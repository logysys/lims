import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

import { UsersService } from '@modules/users/users.service';
import { OrganizationsService } from '@modules/organizations/organizations.service';
import { AuditService } from '@modules/audit/audit.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '@modules/users/entities/user.entity';
import { UserSession } from '@modules/users/entities/user-session.entity';
import { UserRole, OrgType, AuditAction } from '@common/enums';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_FAILURES = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  constructor(
    private usersService: UsersService,
    private organizationsService: OrganizationsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    if (user.accountLocked) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new ForbiddenException(
          `Account is locked until ${user.lockedUntil.toISOString()}`,
        );
      }
      // Auto-unlock if lock expired
      await this.usersService.update(user.id, {
        accountLocked: false,
        lockedUntil: null,
        loginFailures: 0,
      } as any);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const failures = (user.loginFailures || 0) + 1;
      const updates: Partial<User> = { loginFailures: failures };
      if (failures >= this.MAX_LOGIN_FAILURES) {
        updates.accountLocked = true;
        updates.lockedUntil = new Date(
          Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000,
        );
      }
      await this.usersService.update(user.id, updates);
      return null;
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is not active');
    }

    if (user.approvalStatus === 'pending') {
      throw new ForbiddenException('Account is pending approval');
    }

    // Reset failure counter
    if (user.loginFailures > 0) {
      await this.usersService.update(user.id, { loginFailures: 0 });
    }

    return user;
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // MFA check
    if (user.mfaEnabled) {
      if (!loginDto.mfaCode) {
        return {
          mfaRequired: true,
          userId: user.id,
          message: 'MFA code required',
        };
      }
      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: loginDto.mfaCode,
        window: 1,
      });
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    return this.createSession(user, ipAddress, userAgent);
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Create organization
    const org = await this.organizationsService.create({
      name: registerDto.companyName,
      type: registerDto.accountType,
      email: registerDto.email,
      phone: registerDto.phone,
      addressLine1: registerDto.addressLine1,
      city: registerDto.city,
      state: registerDto.state,
      country: registerDto.country,
      postalCode: registerDto.postalCode,
    });

    // Determine role and approval status
    let role: UserRole;
    let approvalStatus: string;

    switch (registerDto.accountType) {
      case OrgType.CUSTOMER:
        role = UserRole.CUSTOMER;
        approvalStatus = 'approved';
        break;
      case OrgType.MANUFACTURER:
        role = UserRole.MANUFACTURER;
        approvalStatus = 'pending';
        break;
      case OrgType.LAB:
        role = UserRole.ANALYST;
        approvalStatus = 'pending';
        break;
      default:
        role = UserRole.CONSUMER;
        approvalStatus = 'approved';
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role,
      orgId: org.id,
      emailVerified: false,
      verificationToken,
      approvalStatus,
    });

    // Send verification email (async)
    await this.notificationsService.sendEmailVerification(user, verificationToken);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.CREATE,
      resourceType: 'user',
      resourceId: user.id,
      newValues: { email: user.email, role: user.role },
    });

    return {
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
      requiresApproval: approvalStatus === 'pending',
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.update(user.id, {
      emailVerified: true,
      verificationToken: null,
    } as any);

    return { message: 'Email verified successfully' };
  }

  async createSession(user: User, ipAddress: string, userAgent: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    });

    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    await this.sessionRepository.save(
      this.sessionRepository.create({
        userId: user.id,
        jwtToken: accessToken,
        ipAddress,
        userAgent,
        expiresAt,
      }),
    );

    await this.usersService.update(user.id, { lastLogin: new Date() } as any);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.LOGIN,
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        orgId: user.orgId,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }
      return this.createSession(user, '', '');
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, token: string) {
    await this.sessionRepository.update(
      { userId, jwtToken: token },
      { revokedAt: new Date() },
    );
  }

  async setupMfa(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();

    const secret = speakeasy.generateSecret({
      name: `${this.configService.get('mfa.appName')} (${user.email})`,
    });

    await this.usersService.update(userId, { mfaSecret: secret.base32 } as any);

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  async enableMfa(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA not initialized');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    await this.usersService.update(userId, { mfaEnabled: true } as any);
    return { message: 'MFA enabled successfully' };
  }

  async disableMfa(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA not enabled');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    await this.usersService.update(userId, {
      mfaEnabled: false,
      mfaSecret: null,
    } as any);

    return { message: 'MFA disabled successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.update(userId, { passwordHash: newHash } as any);

    // Revoke all sessions
    await this.sessionRepository.update(
      { userId },
      { revokedAt: new Date() },
    );

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.update(user.id, {
      resetToken,
      resetTokenExpiry,
    } as any);

    await this.notificationsService.sendPasswordResetEmail(user, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.update(user.id, {
      passwordHash: newHash,
      resetToken: null,
      resetTokenExpiry: null,
      loginFailures: 0,
      accountLocked: false,
    } as any);

    return { message: 'Password reset successfully' };
  }

  async approveUser(userId: string, approverId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    await this.usersService.update(userId, {
      approvalStatus: 'approved',
      isActive: true,
    } as any);

    await this.notificationsService.sendAccountApprovedEmail(user);

    return { message: 'User approved successfully' };
  }
}