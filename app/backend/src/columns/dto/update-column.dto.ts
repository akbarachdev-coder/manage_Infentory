import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title?: string;
}
