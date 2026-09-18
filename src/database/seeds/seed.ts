import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@modules/users/entities/user.entity';
import { Organization } from '@modules/organizations/entities/organization.entity';
import { TestMethod } from '@modules/testing/entities/test-method.entity';
import { Instrument } from '@modules/instruments/entities/instrument.entity';
import { CoaTemplate } from '@modules/coa/entities/coa-template.entity';
import { UserRole, OrgType, InstrumentType, InstrumentStatus } from '@common/enums';

export async function seedDatabase(dataSource: DataSource) {
  const orgRepo = dataSource.getRepository(Organization);
  const userRepo = dataSource.getRepository(User);
  const methodRepo = dataSource.getRepository(TestMethod);
  const instrumentRepo = dataSource.getRepository(Instrument);
  const templateRepo = dataSource.getRepository(CoaTemplate);

  // Check if already seeded
  const existing = await orgRepo.findOne({ where: { type: OrgType.LAB } });
  if (existing) {
    console.log('⏭️  Database already seeded, skipping...');
    return;
  }

  // 1. Create Lab Organization
  const labOrg = await orgRepo.save(
    orgRepo.create({
      name: 'TruSource Analytical Labs',
      type: OrgType.LAB,
      orgCode: 'TS-LAB-001',
      email: 'lab@trusource.com',
      isActive: true,
      isVerified: true,
      verificationDate: new Date(),
    }),
  );

  // 2. Create Customer Org
  const customerOrg = await orgRepo.save(
    orgRepo.create({
      name: 'Acme Wellness Co.',
      type: OrgType.CUSTOMER,
      orgCode: 'CUST-001',
      email: 'contact@acmewellness.com',
      isActive: true,
      isVerified: true,
    }),
  );

  // 3. Create Manufacturer Org
  const manufacturerOrg = await orgRepo.save(
    orgRepo.create({
      name: 'GreenLeaf Manufacturing',
      type: OrgType.MANUFACTURER,
      orgCode: 'MFG-001',
      email: 'info@greenleaf.com',
      isActive: true,
      isVerified: true,
    }),
  );

  // 4. Create Users
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const adminUser = await userRepo.save(
    userRepo.create({
      email: 'admin@trusource.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      orgId: labOrg.id,
      isActive: true,
      emailVerified: true,
    }),
  );

  const analystUser = await userRepo.save(
    userRepo.create({
      email: 'analyst@trusource.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Analyst',
      role: UserRole.ANALYST,
      orgId: labOrg.id,
      isActive: true,
      emailVerified: true,
      department: 'Chemistry',
    }),
  );

  const qaUser = await userRepo.save(
    userRepo.create({
      email: 'qa@trusource.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'QA',
      role: UserRole.QA,
      orgId: labOrg.id,
      isActive: true,
      emailVerified: true,
      department: 'Quality',
    }),
  );

  const customerUser = await userRepo.save(
    userRepo.create({
      email: 'customer@acmewellness.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Customer',
      role: UserRole.CUSTOMER,
      orgId: customerOrg.id,
      isActive: true,
      emailVerified: true,
    }),
  );

  const manufacturerUser = await userRepo.save(
    userRepo.create({
      email: 'mfg@greenleaf.com',
      passwordHash,
      firstName: 'Charlie',
      lastName: 'Maker',
      role: UserRole.MANUFACTURER,
      orgId: manufacturerOrg.id,
      isActive: true,
      emailVerified: true,
    }),
  );

  // 5. Create Test Methods
  const methods = [
    { code: 'TM-HPLC-001', name: 'HPLC - Cannabinoid Profile', category: 'Potency', instrument: 'HPLC' },
    { code: 'TM-GCMS-001', name: 'GC-MS - Terpene Profile', category: 'Terpenes', instrument: 'GC-MS' },
    { code: 'TM-ICPMS-001', name: 'ICP-MS - Heavy Metals', category: 'Heavy Metals', instrument: 'ICP-MS' },
    { code: 'TM-MICRO-001', name: 'Microbial Limits - Total Aerobic', category: 'Microbiology', instrument: 'sterility' },
    { code: 'TM-PEST-001', name: 'Pesticide Screen', category: 'Pesticides', instrument: 'GC-MS' },
    { code: 'TM-PH-001', name: 'pH Determination', category: 'Physical', instrument: 'pH_meter' },
    { code: 'TM-WATER-001', name: 'Water Content (Karl Fischer)', category: 'Physical', instrument: 'osmometer' },
    { code: 'TM-FTIR-001', name: 'FTIR - Identity', category: 'Identity', instrument: 'FTIR' },
  ];

  for (const m of methods) {
    await methodRepo.save(
      methodRepo.create({
        methodCode: m.code,
        methodName: m.name,
        category: m.category,
        instrumentType: m.instrument,
        version: '1.0',
        isCurrent: true,
        iso17025Standard: 'ISO/IEC 17025:2017',
        validationStatus: 'validated',
        acceptanceCriteria: { min: 0, max: 100 },
      }),
    );
  }

  // 6. Create Instruments
  const instruments = [
    { code: 'INST-HPLC-01', name: 'Agilent 1260 HPLC', type: InstrumentType.HPLC },
    { code: 'INST-GCMS-01', name: 'Shimadzu GCMS-QP2020', type: InstrumentType.GC_MS },
    { code: 'INST-ICPMS-01', name: 'Agilent 7900 ICP-MS', type: InstrumentType.ICP_MS },
    { code: 'INST-FTIR-01', name: 'Thermo Nicolet iS50', type: InstrumentType.FTIR },
    { code: 'INST-PH-01', name: 'Mettler Toledo SevenExcellence', type: InstrumentType.PH_METER },
  ];

  for (const inst of instruments) {
    await instrumentRepo.save(
      instrumentRepo.create({
        instrumentCode: inst.code,
        name: inst.name,
        type: inst.type,
        status: InstrumentStatus.OPERATIONAL,
        labLocation: 'Main Lab',
        room: '101',
      }),
    );
  }

  // 7. Create COA Template
  await templateRepo.save(
    templateRepo.create({
      name: 'Default COA Template',
      type: 'product',
      templateHtml: `
        <div class="coa">
          <h1>Certificate of Analysis</h1>
          <p>COA #: {{coaNumber}}</p>
          <p>Product: {{productName}}</p>
          <p>Lot: {{lotNumber}}</p>
          <table>
            <thead><tr><th>Test</th><th>Result</th><th>Unit</th><th>Status</th></tr></thead>
            <tbody>
              {{#each tests}}
              <tr><td>{{method}}</td><td>{{result}}</td><td>{{unit}}</td><td>{{status}}</td></tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      `,
      templateCss: `.coa { font-family: Arial; padding: 20px; }`,
      isActive: true,
      isDefault: true,
    }),
  );

  console.log('✅ Seed data created:');
  console.log(`   - Organizations: 3`);
  console.log(`   - Users: 5 (admin, analyst, qa, customer, manufacturer)`);
  console.log(`   - Test Methods: ${methods.length}`);
  console.log(`   - Instruments: ${instruments.length}`);
  console.log(`   - COA Templates: 1`);
  console.log('');
  console.log('🔑 Login credentials (password: Password123!):');
  console.log('   admin@trusource.com        (Super Admin)');
  console.log('   analyst@trusource.com      (Analyst)');
  console.log('   qa@trusource.com           (QA)');
  console.log('   customer@acmewellness.com  (Customer)');
  console.log('   mfg@greenleaf.com          (Manufacturer)');
}