import { useMemo, useState, type SyntheticEvent } from 'react';
import {
  useFinancialAccounts,
  useFinancialCategories,
} from '../../finance/hooks/useFinance.js';
import {
  useFinanceImportMutations,
  useFinanceImportPreview,
  useFinanceImportProfiles,
} from './useFinanceImports.js';
import type {
  ImportFormat,
  ImportMapping,
  ImportSession,
  ImportStep,
} from '../types/finance-import.types.js';

export const financeImportStepLabels: Record<ImportStep, string> = {
  file: '1. Soubor a účet',
  format: '2. Formát',
  mapping: '3. Mapování',
  preview: '4. Náhled',
  result: '5. Výsledek',
};

export function useFinanceImportWizard() {
  const accounts = useFinancialAccounts();
  const categories = useFinancialCategories();
  const profiles = useFinanceImportProfiles();
  const mutations = useFinanceImportMutations();
  const [step, setStep] = useState<ImportStep>('file');
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState('');
  const [session, setSession] = useState<ImportSession | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [format, setFormat] = useState<ImportFormat>(defaultFormat);
  const [mapping, setMapping] = useState<ImportMapping>(defaultMapping);
  const [result, setResult] = useState<{ importedRowCount: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmRepeatedFile, setConfirmRepeatedFile] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const preview = useFinanceImportPreview(
    step === 'preview' ? (session?.id ?? null) : null,
    previewPage,
  );
  const selectedAccount = accounts.data?.items.find(
    (account) => account.id === accountId,
  );
  const submitFile = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!file || !selectedAccount) {
      setError('Vyberte účet a CSV soubor.');
      return;
    }
    try {
      const created = await mutations.create.mutateAsync([
        selectedAccount.id,
        selectedAccount.type === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'BANK_ACCOUNT',
        file,
      ]);
      setSession(created);
      setFormat({
        ...defaultFormat,
        encoding: created.detectedFormat?.encoding ?? 'utf-8',
        delimiter: created.detectedFormat?.delimiter ?? ';',
        hasHeader: created.detectedFormat?.hasHeader ?? true,
        headerRowNumber: created.detectedFormat?.headerRowNumber ?? 1,
      });
      setStep('format');
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };
  const submitFormat = async () => {
    if (!session) return;
    try {
      const response = await mutations.format.mutateAsync({
        id: session.id,
        data: format,
      });
      const nextHeaders = Object.keys(response.sample[0] ?? {});
      setHeaders(nextHeaders);
      setMapping((value) => ({
        ...value,
        columnMapping: value.profileId
          ? value.columnMapping
          : suggestMapping(nextHeaders),
      }));
      setStep('mapping');
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };
  const submitMapping = async () => {
    if (!session) return;
    try {
      await mutations.mapping.mutateAsync({ id: session.id, data: mapping });
      setPreviewPage(1);
      setStep('preview');
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };
  const commit = async () => {
    if (!session) return;
    try {
      setResult(
        await mutations.commit.mutateAsync({
          id: session.id,
          duplicates: true,
          repeated: confirmRepeatedFile,
        }),
      );
      setStep('result');
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };
  const reset = () => {
    setStep('file');
    setFile(null);
    setSession(null);
    setResult(null);
    setError(null);
    setHeaders([]);
    setMapping(defaultMapping);
    setPreviewPage(1);
    setConfirmRepeatedFile(false);
  };
  const categoryOptions = (categories.data?.items ?? [])
    .filter(
      (category) =>
        !category.archivedAt &&
        (category.kind === 'EXPENSE' || category.kind === 'BOTH'),
    )
    .map((category) => ({ id: category.id, name: category.name }));
  return {
    accounts,
    profiles,
    mutations,
    step,
    setStep,
    file,
    setFile,
    accountId,
    setAccountId,
    session,
    format,
    setFormat,
    mapping,
    setMapping,
    headers,
    result,
    error,
    cancelOpen,
    setCancelOpen,
    confirmRepeatedFile,
    setConfirmRepeatedFile,
    preview,
    setPreviewPage,
    categoryOptions,
    orderedSteps: useMemo(
      () => Object.entries(financeImportStepLabels) as [ImportStep, string][],
      [],
    ),
    submitFile,
    submitFormat,
    submitMapping,
    commit,
    reset,
  };
}

export type FinanceImportWizardState = ReturnType<
  typeof useFinanceImportWizard
>;

const defaultFormat: ImportFormat = {
  encoding: 'utf-8',
  delimiter: ';',
  quoteCharacter: '"',
  hasHeader: true,
  headerRowNumber: 1,
  skipRowsBefore: 0,
  dateFormat: 'DD.MM.YYYY',
  decimalSeparator: ',',
  thousandSeparator: ' ',
};
const defaultMapping: ImportMapping = {
  amountColumnMode: 'SIGNED_AMOUNT',
  columnMapping: {},
  invertAmountSign: false,
  defaultCurrencyCode: null,
};
function suggestMapping(headers: string[]) {
  const result: Record<string, string> = {};
  for (const header of headers) {
    const key = header.toLocaleLowerCase('cs-CZ');
    if (/datum.*zaúč|booked/.test(key)) result.bookedDate = header;
    else if (key.includes('datum')) result.transactionDate = header;
    else if (/částka|amount/.test(key)) result.signedAmount = header;
    else if (/protistr|obchod|merchant/.test(key))
      result.counterpartyName = header;
    else if (/popis|zpráva|description/.test(key)) result.description = header;
    else if (key.includes('variabil')) result.variableSymbol = header;
    else if (/měna|currency/.test(key)) result.currencyCode = header;
  }
  return result;
}
const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'Import se nepodařilo zpracovat.';
