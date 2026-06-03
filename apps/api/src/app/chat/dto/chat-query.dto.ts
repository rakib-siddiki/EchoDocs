import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'Query must be a non-empty string' })
  query!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}
