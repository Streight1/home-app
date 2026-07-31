import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { DocumentsFacade } from '../../documents/documents.facade.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { expeditionsInvalid } from '../domain/expeditions.errors.js';
import {
  EXPEDITIONS_WRITE_ROLE,
  optionalText,
} from '../domain/expeditions.types.js';
import {
  GEAR_IMAGE_HTTP_PORT,
  type GearImageHttpPort,
} from '../images/gear-image-http.port.js';
import {
  GEAR_IMAGE_SEARCH_PORT,
  type GearImageSearchPort,
} from '../images/gear-image-search.port.js';
import { sanitizeImage } from '../images/image-sanitizer.js';
import { validatePublicImageUrl } from '../images/image-network-policy.js';
import type {
  GearImageFromUrlDto,
  GearImageSearchDto,
} from '../presentation/dto/gear.dto.js';
import { GearService } from './gear.service.js';

const maxImageBytes = 5 * 1024 * 1024;
const maxRedirects = 3;

@Injectable()
export class GearImagesService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly documents: DocumentsFacade,
    private readonly gear: GearService,
    private readonly audit: AuditService,
    @Inject(GEAR_IMAGE_HTTP_PORT) private readonly http: GearImageHttpPort,
    @Inject(GEAR_IMAGE_SEARCH_PORT)
    private readonly imageSearch: GearImageSearchPort,
  ) {}

  public async importFromUrl(
    userId: string,
    gearItemId: string,
    input: GearImageFromUrlDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_WRITE_ROLE,
    );
    const gear = await this.gear.find(membership.householdId, gearItemId);
    const downloaded = await this.download(input.imageUrl);
    const safe = sanitizeImage(downloaded.body, downloaded.contentType);
    const document = await this.documents.createImportedImage({
      userId,
      title: `Fotografie výbavy – ${gear.name}`,
      buffer: safe.buffer,
      mimeType: safe.mimeType,
      extension: safe.extension,
    });
    await this.prisma.$transaction(async (tx) => {
      if (input.setAsCover)
        await tx.gearItemDocument.updateMany({
          where: { gearItemId, isCover: true },
          data: { isCover: false },
        });
      await tx.gearItemDocument.create({
        data: {
          gearItemId,
          documentId: document.id,
          relationType: 'PHOTO',
          isCover: input.setAsCover,
          createdByUserId: userId,
        },
      });
      await tx.gearItem.update({
        where: { id: gearItemId },
        data: {
          imageSourceUrl: input.imageUrl,
          imageAttribution: optionalText(input.attribution),
          updatedByUserId: userId,
        },
      });
      await this.audit.record(tx, {
        action: 'GEAR_IMAGE_IMPORTED',
        householdId: membership.householdId,
        userId,
        entityType: 'GearItem',
        entityId: gearItemId,
        metadata: { source: 'HTTPS_URL', mimeType: safe.mimeType },
      });
    });
    return this.gear.detail(userId, gearItemId);
  }

  public async search(userId: string, input: GearImageSearchDto) {
    await this.access.getActiveMembership(userId, EXPEDITIONS_WRITE_ROLE);
    if (!this.imageSearch.configured)
      return {
        configured: false,
        results: [],
        fallback: ['UPLOAD', 'HTTPS_URL'],
      };
    return {
      configured: true,
      results: await this.imageSearch.search(input.query.trim()),
      fallback: ['UPLOAD', 'HTTPS_URL'],
    };
  }

  private async download(source: string) {
    let current = validatePublicImageUrl(source);
    for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
      const response = await this.http.get(current, maxImageBytes);
      if (response.status >= 300 && response.status < 400) {
        if (!response.location || redirect === maxRedirects)
          throw expeditionsInvalid('Přesměrování obrázku není povolené.');
        current = validatePublicImageUrl(
          new URL(response.location, current).toString(),
        );
        continue;
      }
      if (response.status !== 200)
        throw expeditionsInvalid('Obrázek se nepodařilo bezpečně načíst.');
      if (response.body.length === 0 || response.body.length > maxImageBytes)
        throw expeditionsInvalid('Obrázek má neplatnou velikost.');
      return response;
    }
    throw expeditionsInvalid('Obrázek má příliš mnoho přesměrování.');
  }
}
