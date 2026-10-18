import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class MoveTaskDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position: number;

  @IsOptional()
  @IsUUID()
  columnId?: string;
}
