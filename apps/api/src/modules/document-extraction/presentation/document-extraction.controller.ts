import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { GetExtractionService } from '../application/get-extraction.service.js';
import { ReviewExtractionFieldService } from '../application/review-extraction-field.service.js';
import { StartExtractionService } from '../application/start-extraction.service.js';
import { ReviewExtractionFieldDto } from './dto/review-extraction-field.dto.js';

@Controller('documents/:documentId/extractions')
export class DocumentExtractionController {
  public constructor(
    private readonly startExtraction: StartExtractionService,
    private readonly getExtraction: GetExtractionService,
    private readonly reviewField: ReviewExtractionFieldService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public start(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ) {
    return this.startExtraction.execute(principal.userId, documentId);
  }

  @Post(':jobId/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  public retry(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ) {
    return this.startExtraction.execute(principal.userId, documentId);
  }

  @Get(':jobId')
  public get(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
  ) {
    return this.getExtraction.execute(principal.userId, documentId, jobId);
  }

  @Patch(':jobId/fields/:candidateId')
  public review(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
    @Param('candidateId', new ParseUUIDPipe({ version: '4' }))
    candidateId: string,
    @Body() input: ReviewExtractionFieldDto,
  ) {
    return this.reviewField.execute(
      principal.userId,
      documentId,
      jobId,
      candidateId,
      input.status,
      input.value,
    );
  }

  @Post(':jobId/accept-safe')
  public acceptSafe(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
  ) {
    return this.reviewField.acceptSafe(principal.userId, documentId, jobId);
  }
}
