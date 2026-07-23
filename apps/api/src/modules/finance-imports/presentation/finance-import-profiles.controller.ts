import {
  Body,
  Controller,
  Delete,
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
import { ImportProfileService } from '../application/profiles/import-profile.service.js';
import {
  CreateImportProfileDto,
  UpdateImportProfileDto,
} from './dto/import-profile.dto.js';

@Controller('finance/import-profiles')
export class FinanceImportProfilesController {
  public constructor(private readonly profiles: ImportProfileService) {}

  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.profiles.list(principal.userId);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateImportProfileDto,
  ) {
    return this.profiles.create(principal.userId, input);
  }

  @Patch(':profileId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('profileId', new ParseUUIDPipe({ version: '4' })) profileId: string,
    @Body() input: UpdateImportProfileDto,
  ) {
    return this.profiles.update(principal.userId, profileId, input);
  }

  @Delete(':profileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('profileId', new ParseUUIDPipe({ version: '4' })) profileId: string,
  ): Promise<void> {
    await this.profiles.delete(principal.userId, profileId);
  }
}
