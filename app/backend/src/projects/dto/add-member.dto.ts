import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
