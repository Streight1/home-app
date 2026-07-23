export const documentTypeKeys = [
  'GENERAL',
  'INVOICE',
  'RECEIPT',
  'CONTRACT',
  'WARRANTY',
  'INSURANCE',
  'MANUAL',
  'VEHICLE_DOCUMENT',
  'PROPERTY_DOCUMENT',
  'UTILITY_BILL',
  'PERSONAL',
  'OTHER',
] as const;

export type DocumentTypeKey = (typeof documentTypeKeys)[number];

export type MetadataFieldType =
  | 'STRING'
  | 'DATE'
  | 'INTEGER'
  | 'MONEY_MINOR'
  | 'CURRENCY'
  | 'BOOLEAN'
  | 'DECIMAL'
  | 'ENUM'
  | 'LINE_ITEMS';

export interface MetadataFieldDefinition {
  key: string;
  label: string;
  type: MetadataFieldType;
  required: boolean;
  maxLength?: number;
  searchable: boolean;
  filterable: boolean;
  options?: readonly string[];
}

export interface DocumentTypeDefinition {
  key: DocumentTypeKey;
  label: string;
  description: string;
  schemaVersion: number;
  fields: readonly MetadataFieldDefinition[];
}
