import { z } from 'zod';
import { ROLES } from '../../shared/constants/roles';
import { objectId } from '../../shared/utils/objectId';
import { paginationQuery } from '../../shared/utils/pagination';

export const userIdParams = z.object({ id: objectId });

export const listUsersQuery = z.object({
  ...paginationQuery,
  role: z.enum(ROLES).optional(),
});

export const updateRoleSchema = z.object({ role: z.enum(ROLES) });

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
