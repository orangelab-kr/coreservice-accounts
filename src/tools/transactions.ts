import { PrismaPromise } from '@prisma/client';
import { Database } from '.';

const { prisma } = Database;

type PrismaPromiseResult = PrismaPromise<any>;
type PrismaPromiseOnce = Promise<() => PrismaPromiseResult>;

export async function $<T extends PrismaPromiseOnce>(
  functions: T | T[]
): Promise<
  T extends PrismaPromiseOnce ? PrismaPromiseResult : PrismaPromiseResult[]
> {
  return functions instanceof Array
    ? Promise.all(functions).then((transactions) =>
        prisma.$transaction(transactions.map((func) => func()))
      )
    : functions.then((func) => func());
}
