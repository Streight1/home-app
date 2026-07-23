import { IsIn, IsOptional } from 'class-validator';

export class ReviewExtractionFieldDto {
  @IsIn(['ACCEPTED', 'EDITED', 'REJECTED'])
  public status!: 'ACCEPTED' | 'EDITED' | 'REJECTED';

  @IsOptional()
  public value?: unknown;
}
