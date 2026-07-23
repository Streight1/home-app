import { Injectable } from '@nestjs/common';
import type { HouseholdRole } from '../../../households/household.types.js';
import type { DocumentRecord } from '../../domain/document.repository.js';

const previewMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
]);

function text(document: DocumentRecord, key: string): string | null {
  const value = document.metadataJson[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function money(document: DocumentRecord, key: string) {
  const minorUnits = document.metadataJson[key];
  const currencyCode = document.metadataJson.currencyCode;
  return typeof minorUnits === 'number' &&
    Number.isSafeInteger(minorUnits) &&
    typeof currencyCode === 'string'
    ? { minorUnits, currencyCode }
    : null;
}

function firstLineItem(document: DocumentRecord): string | null {
  const items = document.metadataJson.lineItems;
  if (!Array.isArray(items)) return null;
  const description = items[0]?.description.trim();
  return description ?? null;
}

function presentation(document: DocumentRecord) {
  const title = document.title.trim();
  const fallback = title
    ? title
    : (document.file?.sanitizedFilename ?? 'Dokument');
  if (document.type === 'INVOICE') {
    const invoiceNumber = text(document, 'invoiceNumber');
    const orderNumber = text(document, 'orderNumber');
    return {
      primaryLabel:
        text(document, 'supplierName') ??
        text(document, 'issuerName') ??
        fallback,
      secondaryLabel:
        text(document, 'purchaseSummary') ??
        document.description?.trim() ??
        firstLineItem(document),
      referenceLabel: invoiceNumber
        ? `Faktura ${invoiceNumber}`
        : orderNumber
          ? `Objednávka ${orderNumber}`
          : null,
      documentDate:
        text(document, 'issueDate') ??
        document.documentDate?.toISOString().slice(0, 10) ??
        null,
      amount: money(document, 'totalAmountMinor'),
    };
  }
  if (document.type === 'RECEIPT') {
    const receiptNumber = text(document, 'receiptNumber');
    return {
      primaryLabel: text(document, 'merchantName') ?? fallback,
      secondaryLabel:
        text(document, 'purchaseSummary') ??
        document.description?.trim() ??
        null,
      referenceLabel: receiptNumber ? `Účtenka ${receiptNumber}` : null,
      documentDate:
        text(document, 'purchaseDate') ??
        document.documentDate?.toISOString().slice(0, 10) ??
        null,
      amount: money(document, 'totalAmountMinor'),
    };
  }
  if (document.type === 'CONTRACT') {
    const contractNumber = text(document, 'contractNumber');
    return {
      primaryLabel: text(document, 'counterpartyName') ?? fallback,
      secondaryLabel:
        document.description?.trim() ?? text(document, 'subject') ?? null,
      referenceLabel: contractNumber ? `Smlouva ${contractNumber}` : null,
      documentDate:
        text(document, 'signedDate') ??
        text(document, 'validFrom') ??
        document.documentDate?.toISOString().slice(0, 10) ??
        null,
      amount: money(document, 'recurringAmountMinor'),
    };
  }
  if (document.type === 'WARRANTY') {
    const manufacturer = text(document, 'manufacturer');
    const model = text(document, 'model');
    const productLabel = [manufacturer, model]
      .filter((value): value is string => value !== null)
      .join(' ');
    return {
      primaryLabel: text(document, 'productName') ?? fallback,
      secondaryLabel: productLabel.length > 0 ? productLabel : null,
      referenceLabel:
        text(document, 'serialNumber') ?? text(document, 'sellerName'),
      documentDate:
        text(document, 'purchaseDate') ??
        document.documentDate?.toISOString().slice(0, 10) ??
        null,
      amount: null,
    };
  }
  return {
    primaryLabel:
      text(document, 'supplierName') ??
      text(document, 'issuerName') ??
      text(document, 'insurerName') ??
      text(document, 'manufacturer') ??
      fallback,
    secondaryLabel:
      document.description?.trim() ??
      text(document, 'insuredSubject') ??
      text(document, 'propertyName') ??
      null,
    referenceLabel:
      text(document, 'referenceNumber') ??
      text(document, 'documentNumber') ??
      text(document, 'policyNumber'),
    documentDate:
      document.documentDate?.toISOString().slice(0, 10) ??
      text(document, 'issueDate') ??
      text(document, 'validFrom'),
    amount:
      money(document, 'totalAmountMinor') ??
      money(document, 'premiumAmountMinor'),
  };
}

@Injectable()
export class DocumentListPresentationService {
  public map(document: DocumentRecord, role: HouseholdRole) {
    const canMutate = role !== 'VIEWER';
    const canPermanentlyDelete = role === 'OWNER' || role === 'ADMIN';
    return {
      id: document.id,
      type: document.type,
      title: document.title,
      folder:
        document.status === 'TRASHED'
          ? document.trashedFromFolder
          : document.folder,
      status: document.status,
      trashedAt: document.trashedAt?.toISOString() ?? null,
      presentation: presentation(document),
      canPreview: Boolean(
        document.file && previewMimeTypes.has(document.file.detectedMimeType),
      ),
      permissions: {
        canEdit: canMutate && document.status !== 'TRASHED',
        canArchive: canMutate && document.status === 'ACTIVE',
        canRestoreArchive: canMutate && document.status === 'ARCHIVED',
        canMove: canMutate && document.status !== 'TRASHED',
        canMoveToTrash: canMutate && document.status !== 'TRASHED',
        canRestoreFromTrash: canMutate && document.status === 'TRASHED',
        canPermanentlyDelete:
          canPermanentlyDelete && document.status === 'TRASHED',
      },
      file: document.file
        ? {
            id: document.file.id,
            originalFilename: document.file.sanitizedFilename,
            extension: document.file.extension,
            mimeType: document.file.mimeType,
          }
        : null,
    };
  }
}
