import { Controller, Get } from '@nestjs/common';
import { DocumentTypeRegistryService } from '../application/metadata/document-type-registry.service.js';

@Controller('document-types')
export class DocumentTypesController {
  public constructor(private readonly registry: DocumentTypeRegistryService) {}
  @Get() public list() {
    return { items: this.registry.list() };
  }
}
