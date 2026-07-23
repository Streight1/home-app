import { Readable } from 'node:stream';
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { DownloadDocumentFileService } from '../src/modules/documents/application/queries/download-document-file.service.js';
import type { PreviewDocumentFileService } from '../src/modules/documents/application/files/preview-document-file.service.js';
import { DocumentFilesController } from '../src/modules/documents/presentation/document-files.controller.js';

describe('DocumentFilesController', () => {
  it('returns safe download headers without a redirect URL', async () => {
    const download = {
      execute: vi.fn().mockResolvedValue({
        stream: Readable.from('%PDF-1.7'),
        mimeType: 'application/pdf',
        sizeBytes: 8,
        disposition:
          'attachment; filename="pojistka.pdf"; filename*=UTF-8\'\'pojistka.pdf',
      }),
    } as unknown as DownloadDocumentFileService;
    const setHeader = vi.fn();
    const response = { setHeader } as unknown as Response;
    const preview = {
      execute: vi.fn(),
    } as unknown as PreviewDocumentFileService;
    const file = await new DocumentFilesController(download, preview).download(
      { userId: 'user-id', sessionId: 'session-id' },
      '10000000-0000-4000-8000-000000000001',
      response,
    );
    expect(setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(file.getHeaders()).toMatchObject({
      type: 'application/pdf',
      length: 8,
      disposition: expect.stringContaining('attachment'),
    });
  });
});
