import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useDocumentPickerOptions } from '../../../documents/documents.public.js';
import {
  useFinancialAccounts,
  useFinancialCategories,
  useFinanceMutations,
} from '../../hooks/useFinance.js';
import { FinancialTransactionForm } from './FinancialTransactionForm.js';
import type { FinancialTransaction } from '../../types/finance.types.js';
import { useCategorizationMutations } from '../../../finance-categorization/finance-categorization.public.js';

export function FinancialTransactionDialog({
  open,
  type,
  transaction,
  onOpenChange,
}: {
  open: boolean;
  type: 'expense' | 'income';
  transaction?: FinancialTransaction;
  onOpenChange: (open: boolean) => void;
}) {
  const accounts = useFinancialAccounts();
  const categories = useFinancialCategories();
  const documents = useDocumentPickerOptions();
  const mutations = useFinanceMutations();
  const categorization = useCategorizationMutations();
  const mutation = transaction
    ? mutations.updateTransaction
    : mutations.createTransaction;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        transaction
          ? 'Upravit transakci'
          : type === 'expense'
            ? 'Nový výdaj'
            : 'Nový příjem'
      }
      description="Částku ukládáme přesně v nejmenších měnových jednotkách."
      size="lg"
      mobileFullScreen
    >
      {mutation.isError || categorization.create.isError ? (
        <div className="mb-4">
          <InlineAlert variant="danger">
            Transakci se nepodařilo uložit.
          </InlineAlert>
        </div>
      ) : null}
      <FinancialTransactionForm
        type={type}
        accounts={accounts.data?.items ?? []}
        categories={categories.data?.items ?? []}
        documents={documents.data ?? []}
        loading={mutation.isPending || categorization.create.isPending}
        {...(transaction ? { initial: transaction } : {})}
        onCancel={() => onOpenChange(false)}
        onSubmit={(data, createRule) => {
          if (transaction)
            mutations.updateTransaction.mutate(
              { id: transaction.id, data },
              { onSuccess: () => onOpenChange(false) },
            );
          else {
            const save = async () => {
              if (!mutations.createTransaction.data)
                await mutations.createTransaction.mutateAsync({ type, data });
              if (createRule && data.categoryId && data.counterpartyName) {
                await categorization.create.mutateAsync({
                  name: `Platby u ${data.counterpartyName}`,
                  priority: 100,
                  enabled: true,
                  field: 'COUNTERPARTY_NAME',
                  operator: 'EQUALS',
                  comparisonValue: data.counterpartyName,
                  categoryId: data.categoryId,
                  accountId: data.accountId,
                  transactionType: type === 'expense' ? 'EXPENSE' : 'INCOME',
                });
              }
              onOpenChange(false);
            };
            void save().catch(() => undefined);
          }
        }}
      />
    </Dialog>
  );
}
