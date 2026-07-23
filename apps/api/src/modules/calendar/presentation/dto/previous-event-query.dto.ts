import { IsUUID } from 'class-validator';

export class PreviousEventQueryDto {
  @IsUUID('4') public travelerUserId!: string;
}
