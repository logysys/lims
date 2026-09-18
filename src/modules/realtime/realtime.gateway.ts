import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  orgId?: string;
  role?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      });

      client.userId = payload.sub;
      client.orgId = payload.orgId;
      client.role = payload.role;

      // Join user-specific room
      client.join(`user:${payload.sub}`);
      // Join org room
      if (payload.orgId) client.join(`org:${payload.orgId}`);
      // Join role room
      client.join(`role:${payload.role}`);

      // Track user sockets
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);

      client.emit('connected', {
        message: 'Connected to TruSource realtime',
        userId: payload.sub,
      });
    } catch (err) {
      this.logger.warn(`Unauthorized socket connection: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:sample')
  handleSubscribeSample(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sampleId: string },
  ) {
    client.join(`sample:${data.sampleId}`);
    return { subscribed: true, sampleId: data.sampleId };
  }

  @SubscribeMessage('unsubscribe:sample')
  handleUnsubscribeSample(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sampleId: string },
  ) {
    client.leave(`sample:${data.sampleId}`);
    return { unsubscribed: true };
  }

  @SubscribeMessage('subscribe:batch')
  handleSubscribeBatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { batchId: string },
  ) {
    client.join(`batch:${data.batchId}`);
    return { subscribed: true };
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { pong: Date.now() };
  }

  // ============ Server-side emit methods ============

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToOrg(orgId: string, event: string, data: any) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }

  emitToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  emitToSample(sampleId: string, event: string, data: any) {
    this.server.to(`sample:${sampleId}`).emit(event, data);
  }

  emitToBatch(batchId: string, event: string, data: any) {
    this.server.to(`batch:${batchId}`).emit(event, data);
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}