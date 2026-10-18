import { PrismaClient } from '@prisma/client';
import type { ITXClientDenyList } from '@prisma/client/runtime/client';
type D = ITXClientDenyList;
type A = Omit<PrismaClient, D>;
declare const a: A;
a.task.findMany();
