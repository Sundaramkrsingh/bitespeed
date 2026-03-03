import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();

export const prisma = new PrismaClient();