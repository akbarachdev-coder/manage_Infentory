import { Prisma } from '@prisma/client';
import { USER_SELECT } from '../common/user-select.js';

export const PROJECT_INCLUDE = {
  members: {
    include: { user: { select: USER_SELECT } },
  },
  columns: {
    orderBy: { position: 'asc' },
    include: {
      tasks: {
        orderBy: { position: 'asc' },
        include: {
          assignees: { include: { user: { select: USER_SELECT } } },
        },
      },
    },
  },
} satisfies Prisma.ProjectInclude;
