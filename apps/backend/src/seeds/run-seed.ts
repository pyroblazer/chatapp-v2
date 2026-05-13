import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { createConnection } from 'typeorm';
import entities from '../utils/typeorm';

const logger = new Logger('Seed');

async function runSeed() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host:
        process.env.DATABASE_HOST || process.env.MYSQL_DB_HOST || 'localhost',
      port: parseInt(
        process.env.DATABASE_PORT || process.env.MYSQL_DB_PORT || '5432',
        10,
      ),
      username: process.env.DATABASE_USERNAME || process.env.MYSQL_DB_USERNAME,
      password: process.env.DATABASE_PASSWORD || process.env.MYSQL_DB_PASSWORD,
      database: process.env.DATABASE_NAME || process.env.MYSQL_DB_NAME,
      entities,
      logging: false,
    });

    const { seedSuperuser } = await import('./superuser.seed');
    const result = await seedSuperuser();

    if (result.created) {
      logger.log(`Superuser created: ${result.username} (${result.email})`);
    } else {
      logger.log(`Superuser already exists: ${result.username}`);
    }

    await connection.close();
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed', err);
    process.exit(1);
  }
}

runSeed();
