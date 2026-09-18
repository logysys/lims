import { AppDataSource } from '../data-source';
import { seedDatabase } from './seed';

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    await seedDatabase(AppDataSource);
    console.log('✅ Seeds completed');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

run();