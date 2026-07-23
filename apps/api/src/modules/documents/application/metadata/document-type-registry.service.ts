import { Injectable } from '@nestjs/common';
import type {
  DocumentTypeDefinition,
  DocumentTypeKey,
  MetadataFieldDefinition,
} from '../../domain/metadata/document-type.js';

const stringField = (
  key: string,
  label: string,
  maxLength = 200,
  searchable = true,
): MetadataFieldDefinition => ({
  key,
  label,
  type: 'STRING',
  required: false,
  maxLength,
  searchable,
  filterable: false,
});
const dateField = (key: string, label: string): MetadataFieldDefinition => ({
  key,
  label,
  type: 'DATE',
  required: false,
  searchable: false,
  filterable: true,
});
const integerField = (
  key: string,
  label: string,
  type: 'INTEGER' | 'MONEY_MINOR' = 'INTEGER',
): MetadataFieldDefinition => ({
  key,
  label,
  type,
  required: false,
  searchable: false,
  filterable: true,
});
const currencyField: MetadataFieldDefinition = {
  key: 'currencyCode',
  label: 'Měna',
  type: 'CURRENCY',
  required: false,
  searchable: false,
  filterable: true,
  options: ['CZK', 'EUR'],
};
const booleanField = (key: string, label: string): MetadataFieldDefinition => ({
  key,
  label,
  type: 'BOOLEAN',
  required: false,
  searchable: false,
  filterable: true,
});
const lineItemsField: MetadataFieldDefinition = {
  key: 'lineItems',
  label: 'Položky faktury',
  type: 'LINE_ITEMS',
  required: false,
  searchable: true,
  filterable: false,
};
const enumField = (
  key: string,
  label: string,
  options: readonly string[],
): MetadataFieldDefinition => ({
  key,
  label,
  type: 'ENUM',
  required: false,
  searchable: false,
  filterable: true,
  options,
});

const generalFields = [
  stringField('issuerName', 'Vystavitel'),
  stringField('recipientName', 'Příjemce'),
  stringField('referenceNumber', 'Referenční číslo'),
  dateField('validFrom', 'Platnost od'),
  dateField('validUntil', 'Platnost do'),
];

const definitions: readonly DocumentTypeDefinition[] = [
  {
    key: 'GENERAL',
    label: 'Obecný dokument',
    description: 'Dokument bez specializovaného schématu.',
    schemaVersion: 1,
    fields: generalFields,
  },
  {
    key: 'INVOICE',
    label: 'Faktura',
    description: 'Přijatá nebo vydaná faktura.',
    schemaVersion: 2,
    fields: [
      stringField('supplierName', 'Dodavatel'),
      stringField('purchaseSummary', 'Čeho se nákup týká', 300),
      stringField('supplierCompanyId', 'IČO', 20),
      stringField('supplierVatId', 'DIČ', 24),
      stringField('invoiceNumber', 'Číslo faktury', 100),
      stringField('variableSymbol', 'Variabilní symbol', 20),
      stringField('constantSymbol', 'Konstantní symbol', 10),
      dateField('issueDate', 'Datum vystavení'),
      dateField('taxableSupplyDate', 'Datum zdanitelného plnění'),
      dateField('dueDate', 'Datum splatnosti'),
      integerField('subtotalAmountMinor', 'Základ bez DPH', 'MONEY_MINOR'),
      integerField('vatAmountMinor', 'DPH', 'MONEY_MINOR'),
      integerField('totalAmountMinor', 'Celkem', 'MONEY_MINOR'),
      currencyField,
      stringField('supplierBankAccount', 'Bankovní účet', 100),
      stringField('supplierIban', 'IBAN', 34),
      stringField('orderNumber', 'Číslo objednávky', 100),
      enumField('paymentStatus', 'Stav platby', [
        'UNPAID',
        'PAID',
        'OVERDUE',
        'PARTIAL',
      ]),
      lineItemsField,
    ],
  },
  {
    key: 'RECEIPT',
    label: 'Účtenka',
    description: 'Doklad o nákupu nebo platbě.',
    schemaVersion: 1,
    fields: [
      stringField('merchantName', 'Prodejce'),
      stringField('receiptNumber', 'Číslo účtenky', 100),
      dateField('purchaseDate', 'Datum nákupu'),
      integerField('totalAmountMinor', 'Celkem', 'MONEY_MINOR'),
      currencyField,
      enumField('paymentMethod', 'Způsob platby', [
        'CASH',
        'CARD',
        'TRANSFER',
        'OTHER',
      ]),
      dateField('warrantyUntil', 'Záruka do'),
    ],
  },
  {
    key: 'CONTRACT',
    label: 'Smlouva',
    description: 'Smluvní vztah s protistranou.',
    schemaVersion: 1,
    fields: [
      stringField('counterpartyName', 'Protistrana'),
      stringField('contractNumber', 'Číslo smlouvy', 100),
      dateField('signedDate', 'Datum podpisu'),
      dateField('validFrom', 'Platnost od'),
      dateField('validUntil', 'Platnost do'),
      integerField('noticePeriodDays', 'Výpovědní lhůta ve dnech'),
      booleanField('automaticRenewal', 'Automatické prodloužení'),
      integerField('recurringAmountMinor', 'Pravidelná částka', 'MONEY_MINOR'),
      currencyField,
      enumField('paymentFrequency', 'Frekvence platby', [
        'MONTHLY',
        'QUARTERLY',
        'YEARLY',
        'OTHER',
      ]),
    ],
  },
  {
    key: 'WARRANTY',
    label: 'Záruka',
    description: 'Záruční doklad k produktu.',
    schemaVersion: 1,
    fields: [
      stringField('productName', 'Produkt'),
      stringField('manufacturer', 'Výrobce'),
      stringField('model', 'Model'),
      stringField('serialNumber', 'Sériové číslo'),
      stringField('sellerName', 'Prodejce'),
      dateField('purchaseDate', 'Datum nákupu'),
      dateField('warrantyUntil', 'Záruka do'),
    ],
  },
  {
    key: 'INSURANCE',
    label: 'Pojištění',
    description: 'Pojistná smlouva nebo potvrzení.',
    schemaVersion: 1,
    fields: [
      stringField('insurerName', 'Pojišťovna'),
      stringField('policyNumber', 'Číslo pojistky'),
      stringField('insuredSubject', 'Předmět pojištění'),
      dateField('validFrom', 'Platnost od'),
      dateField('validUntil', 'Platnost do'),
      integerField('premiumAmountMinor', 'Pojistné', 'MONEY_MINOR'),
      currencyField,
      enumField('paymentFrequency', 'Frekvence platby', [
        'MONTHLY',
        'QUARTERLY',
        'YEARLY',
        'OTHER',
      ]),
    ],
  },
  {
    key: 'MANUAL',
    label: 'Návod',
    description: 'Návod nebo technická dokumentace.',
    schemaVersion: 1,
    fields: [
      stringField('manufacturer', 'Výrobce'),
      stringField('model', 'Model'),
      stringField('documentVersion', 'Verze dokumentu'),
      stringField('language', 'Jazyk', 20),
    ],
  },
  {
    key: 'VEHICLE_DOCUMENT',
    label: 'Doklad k vozidlu',
    description: 'Dokument vztahující se k vozidlu.',
    schemaVersion: 1,
    fields: [
      stringField('vehicleName', 'Vozidlo'),
      stringField('vin', 'VIN', 17),
      stringField('registrationPlate', 'SPZ', 20),
      stringField('documentNumber', 'Číslo dokumentu'),
      dateField('issueDate', 'Datum vydání'),
      dateField('validUntil', 'Platnost do'),
      integerField('mileage', 'Stav kilometrů'),
    ],
  },
  {
    key: 'PROPERTY_DOCUMENT',
    label: 'Doklad k nemovitosti',
    description: 'Dokument vztahující se k nemovitosti.',
    schemaVersion: 1,
    fields: [
      stringField('propertyName', 'Nemovitost'),
      stringField('addressLabel', 'Adresa', 300),
      stringField('documentNumber', 'Číslo dokumentu'),
      dateField('validFrom', 'Platnost od'),
      dateField('validUntil', 'Platnost do'),
    ],
  },
  {
    key: 'UTILITY_BILL',
    label: 'Vyúčtování služby',
    description: 'Vyúčtování energií nebo domácí služby.',
    schemaVersion: 1,
    fields: [
      stringField('supplierName', 'Dodavatel'),
      stringField('serviceType', 'Druh služby'),
      stringField('supplyPoint', 'Odběrné místo'),
      dateField('billingPeriodFrom', 'Období od'),
      dateField('billingPeriodTo', 'Období do'),
      {
        ...stringField('consumptionValue', 'Spotřeba', 40, false),
        type: 'DECIMAL',
      },
      stringField('consumptionUnit', 'Jednotka', 20, false),
      integerField('totalAmountMinor', 'Celkem', 'MONEY_MINOR'),
      currencyField,
      dateField('dueDate', 'Datum splatnosti'),
      stringField('variableSymbol', 'Variabilní symbol', 20),
    ],
  },
  {
    key: 'PERSONAL',
    label: 'Osobní dokument',
    description: 'Soukromý osobní dokument.',
    schemaVersion: 1,
    fields: generalFields,
  },
  {
    key: 'OTHER',
    label: 'Jiný dokument',
    description: 'Dokument nezařazený do ostatních typů.',
    schemaVersion: 1,
    fields: generalFields,
  },
];

@Injectable()
export class DocumentTypeRegistryService {
  private readonly byKey = new Map(
    definitions.map((definition) => [definition.key, definition]),
  );

  public list(): readonly DocumentTypeDefinition[] {
    return definitions;
  }

  public get(key: DocumentTypeKey): DocumentTypeDefinition | undefined {
    return this.byKey.get(key);
  }
}
