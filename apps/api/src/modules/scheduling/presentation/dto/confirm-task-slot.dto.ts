import { IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmTaskSlotDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4_000)
  public candidateToken!: string;
}
