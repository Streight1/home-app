import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CsvImportDropzone } from './components/upload/CsvImportDropzone.js';
import { ImportColumnMapper } from './components/mapping/ImportColumnMapper.js';
import { ImportPreviewTable } from './components/preview/ImportPreviewTable.js';
import { ImportProfilePicker } from './components/mapping/ImportProfilePicker.js';
import { ImportBulkCategoryControl } from './components/preview/ImportBulkCategoryControl.js';
import { CreditCardTransferReview } from './components/preview/CreditCardTransferReview.js';
import type {
  ImportMapping,
  ImportPreviewRow,
} from './types/finance-import.types.js';

const mapping: ImportMapping = {
  amountColumnMode: 'SIGNED_AMOUNT',
  columnMapping: {},
  invertAmountSign: false,
  defaultCurrencyCode: 'CZK',
};
const row = (overrides: Partial<ImportPreviewRow> = {}): ImportPreviewRow => ({
  id: '10000000-0000-4000-8000-000000000001',
  rowNumber: 1,
  status: 'VALID',
  bookedDate: '2026-07-16',
  amountMinor: '125050',
  currencyCode: 'CZK',
  transactionType: 'EXPENSE',
  counterpartyName: 'Anonymní obchod',
  description: 'Nákup',
  categoryId: null,
  transferSourceAccountId: null,
  matchingTransactionId: null,
  userIncluded: true,
  validationErrorsJson: [],
  ...overrides,
});

describe('finance import responsive wizard components', () => {
  it('accepts a CSV through a standard keyboard-accessible file picker', async () => {
    const onChange = vi.fn();
    render(<CsvImportDropzone file={null} onChange={onChange} />);
    const file = new File(['Datum;Částka'], 'vypis.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    await userEvent.upload(input as HTMLInputElement, file);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(file));
  });

  it('rejects a binary file before it reaches the import API', async () => {
    const onChange = vi.fn();
    render(<CsvImportDropzone file={null} onChange={onChange} />);
    const file = new File([new Uint8Array([0, 1, 2])], 'program.exe', {
      type: 'application/octet-stream',
    });
    const binaryInput =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!binaryInput) throw new Error('File input nebyl vykreslen.');
    await userEvent.upload(binaryInput, file, { applyAccept: false });
    expect(
      await screen.findByText('Vybraný soubor není textové CSV.'),
    ).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('allows manual remapping and separate debit/credit mode', async () => {
    const onChange = vi.fn();
    render(
      <ImportColumnMapper
        headers={['Datum', 'Debet', 'Kredit']}
        value={mapping}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Způsob částky'),
      'SEPARATE_DEBIT_CREDIT',
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ amountColumnMode: 'SEPARATE_DEBIT_CREDIT' }),
    );
  });

  it('renders a desktop table and a separate mobile list without making the page itself wide', () => {
    render(<ImportPreviewTable rows={[row()]} onIncludedChange={vi.fn()} />);
    expect(screen.getByRole('table')).toHaveClass('w-full');
    expect(screen.getAllByText('Anonymní obchod')).toHaveLength(2);
    expect(screen.getByRole('table').parentElement).toHaveClass(
      'overflow-x-auto',
    );
  });

  it('lets a user explicitly include a possible duplicate', () => {
    const onChange = vi.fn();
    render(
      <ImportPreviewTable
        rows={[row({ status: 'POSSIBLE_DUPLICATE', userIncluded: false })]}
        onIncludedChange={onChange}
      />,
    );
    const controls = screen.getAllByLabelText('Zahrnout řádek 1');
    const firstControl = controls[0];
    if (!firstControl) throw new Error('Ovládání řádku nebylo vykresleno.');
    fireEvent.click(firstControl);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'POSSIBLE_DUPLICATE' }),
      true,
    );
  });

  it('keeps transfer review disabled until a source account is confirmed', () => {
    render(
      <ImportPreviewTable
        rows={[row({ status: 'NEEDS_TRANSFER_REVIEW', userIncluded: false })]}
        onIncludedChange={vi.fn()}
      />,
    );
    expect(screen.getAllByLabelText('Zahrnout řádek 1')[0]).toBeDisabled();
  });

  it('applies a saved profile back to format and mapping controls', async () => {
    const onApply = vi.fn();
    render(
      <ImportProfilePicker
        accountId="10000000-0000-4000-8000-000000000001"
        value={null}
        onApply={onApply}
        profiles={[
          {
            id: '20000000-0000-4000-8000-000000000002',
            name: 'Moje banka',
            accountId: null,
            sourceKind: 'BANK_ACCOUNT',
            encoding: 'utf-8',
            delimiter: ';',
            quoteCharacter: '"',
            hasHeader: true,
            headerRowNumber: 1,
            skipRowsBefore: 0,
            dateFormat: 'DD.MM.YYYY',
            decimalSeparator: ',',
            thousandSeparator: ' ',
            amountColumnMode: 'SIGNED_AMOUNT',
            columnMappingJson: {
              bookedDate: 'Datum',
              signedAmount: 'Částka',
            },
            invertAmountSign: false,
            defaultCurrencyCode: 'CZK',
          },
        ]}
      />,
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Uložený importní profil'),
      '20000000-0000-4000-8000-000000000002',
    );
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ delimiter: ';' }),
      expect.objectContaining({
        profileId: '20000000-0000-4000-8000-000000000002',
      }),
    );
  });

  it('supports one-row and visible-page category assignment', async () => {
    const onCategoryChange = vi.fn();
    const onApply = vi.fn();
    const category = {
      id: '30000000-0000-4000-8000-000000000003',
      name: 'Potraviny',
    };
    render(
      <>
        <ImportBulkCategoryControl
          categories={[category]}
          rowIds={[row().id]}
          loading={false}
          onApply={onApply}
        />
        <ImportPreviewTable
          rows={[row()]}
          categories={[category]}
          onIncludedChange={vi.fn()}
          onCategoryChange={onCategoryChange}
        />
      </>,
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Kategorie řádku 1'),
      category.id,
    );
    expect(onCategoryChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: row().id }),
      category.id,
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Kategorie pro zobrazené řádky'),
      category.id,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Použít pro zobrazené' }),
    );
    expect(onApply).toHaveBeenCalledWith(category.id);
  });

  it('requires an explicit source account before classifying a card movement as repayment', async () => {
    const onReview = vi.fn();
    render(
      <CreditCardTransferReview
        rows={[
          row({
            status: 'NEEDS_TRANSFER_REVIEW',
            transactionType: 'REFUND',
            userIncluded: false,
          }),
        ]}
        accounts={[
          {
            id: '20000000-0000-4000-8000-000000000002',
            name: 'Běžný účet',
            type: 'CURRENT',
            currencyCode: 'CZK',
            openingBalanceMinor: '0',
            openingBalanceDate: '2026-07-01',
            currentBalanceMinor: '0',
            description: null,
            colorToken: 'blue',
            iconKey: 'wallet',
            archivedAt: null,
          },
        ]}
        loading={false}
        onReview={onReview}
      />,
    );
    const repayment = screen.getByRole('button', { name: 'Splacení karty' });
    expect(repayment).toBeDisabled();
    await userEvent.selectOptions(
      screen.getByLabelText('Zdrojový účet splátky'),
      '20000000-0000-4000-8000-000000000002',
    );
    await userEvent.click(repayment);
    expect(onReview).toHaveBeenCalledWith(
      expect.objectContaining({ rowNumber: 1 }),
      {
        transactionType: 'TRANSFER_IN',
        transferSourceAccountId: '20000000-0000-4000-8000-000000000002',
        userIncluded: true,
      },
    );
  });
});
