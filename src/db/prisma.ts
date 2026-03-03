import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

config();

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] as string });

export const prisma = new PrismaClient({ adapter });