import { PrismaPromise } from '@prisma/client';
import { Database } from '.';

const { prisma } = Database;

export const TA = async (functions: Promise<() => PrismaPromise<any>>[]) => {
  const transactions = await Promise.all(functions);
  return prisma.$transaction(transactions.map((func) => func()));
};
