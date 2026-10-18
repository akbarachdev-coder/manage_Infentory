import { Prisma } from '@prisma/client';

export const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;
