import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AppConfigService } from '../../config/app-config.service.js';
import { APPLICATION_SEARCH_PROVIDER_TOKENS } from '../../common/search/application-search-provider.js';
import { AuditModule } from '../audit/audit.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { MoveDocumentService } from './application/commands/move-document.service.js';
import { ArchiveDocumentService } from './application/commands/archive-document.service.js';
import { AttachDocumentFileService } from './application/commands/attach-document-file.service.js';
import { CreateDocumentService } from './application/commands/create-document.service.js';
import { RestoreDocumentService } from './application/commands/restore-document.service.js';
import { UpdateDocumentService } from './application/commands/update-document.service.js';
import { TrashDocumentService } from './application/commands/trash-document.service.js';
import { RestoreFromTrashService } from './application/commands/restore-from-trash.service.js';
import { PermanentlyDeleteDocumentService } from './application/commands/permanently-delete-document.service.js';
import { DocumentFileValidator } from './application/document-file.validator.js';
import { DeleteFolderService } from './application/folders/delete-folder.service.js';
import { CreateFolderService } from './application/folders/create-folder.service.js';
import { ListFolderTreeService } from './application/folders/list-folder-tree.service.js';
import { MoveFolderService } from './application/folders/move-folder.service.js';
import { RenameFolderService } from './application/folders/rename-folder.service.js';
import { DownloadDocumentFileService } from './application/files/download-document-file.service.js';
import { GetDocumentFileService } from './application/files/get-document-file.service.js';
import { PreviewDocumentFileService } from './application/files/preview-document-file.service.js';
import { StoredFileDeletionWorker } from './application/files/stored-file-deletion.worker.js';
import { DocumentTypeRegistryService } from './application/metadata/document-type-registry.service.js';
import { ValidateDocumentMetadataService } from './application/metadata/validate-document-metadata.service.js';
import { GetDocumentDetailService } from './application/queries/get-document-detail.service.js';
import { ListDocumentsService } from './application/queries/list-documents.service.js';
import { DocumentListPresentationService } from './application/presentation/document-list-presentation.service.js';
import { DocumentsFacade } from './documents.facade.js';
import { DOCUMENT_FOLDER_REPOSITORY } from './domain/ports/document-folder.repository.js';
import { DOCUMENT_REPOSITORY } from './domain/document.repository.js';
import { PrismaDocumentFolderRepository } from './infrastructure/prisma-document-folder.repository.js';
import { PrismaDocumentRepository } from './infrastructure/prisma-document.repository.js';
import { DocumentFilesController } from './presentation/document-files.controller.js';
import { DocumentFoldersController } from './presentation/document-folders.controller.js';
import { DocumentTypesController } from './presentation/document-types.controller.js';
import { DocumentsController } from './presentation/documents.controller.js';
import { DocumentsSearchProvider } from './search/documents-search.provider.js';

@Module({
  imports: [
    AuditModule,
    HouseholdsModule,
    MulterModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: config.maxUploadBytes,
          files: 1,
          fields: 7,
          parts: 9,
        },
      }),
    }),
  ],
  controllers: [
    DocumentsController,
    DocumentFilesController,
    DocumentFoldersController,
    DocumentTypesController,
  ],
  providers: [
    PrismaDocumentRepository,
    { provide: DOCUMENT_REPOSITORY, useExisting: PrismaDocumentRepository },
    PrismaDocumentFolderRepository,
    {
      provide: DOCUMENT_FOLDER_REPOSITORY,
      useExisting: PrismaDocumentFolderRepository,
    },
    DocumentFileValidator,
    DocumentTypeRegistryService,
    ValidateDocumentMetadataService,
    AttachDocumentFileService,
    CreateDocumentService,
    UpdateDocumentService,
    MoveDocumentService,
    ArchiveDocumentService,
    RestoreDocumentService,
    TrashDocumentService,
    RestoreFromTrashService,
    PermanentlyDeleteDocumentService,
    ListDocumentsService,
    DocumentListPresentationService,
    GetDocumentDetailService,
    CreateFolderService,
    RenameFolderService,
    MoveFolderService,
    DeleteFolderService,
    ListFolderTreeService,
    GetDocumentFileService,
    DownloadDocumentFileService,
    PreviewDocumentFileService,
    StoredFileDeletionWorker,
    DocumentsFacade,
    DocumentsSearchProvider,
    {
      provide: APPLICATION_SEARCH_PROVIDER_TOKENS.documents,
      useExisting: DocumentsSearchProvider,
    },
  ],
  exports: [
    DocumentsFacade,
    APPLICATION_SEARCH_PROVIDER_TOKENS.documents,
    DocumentTypeRegistryService,
    ValidateDocumentMetadataService,
  ],
})
export class DocumentsModule {}
