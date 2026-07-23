import { Button } from '../../../components/ui/Button/Button.js';
import { Dialog } from '../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { FinanceImportPreviewStep } from './preview/FinanceImportPreviewStep.js';
import { FinanceImportSetupSteps } from './FinanceImportSetupSteps.js';
import { useFinanceImportWizard } from '../hooks/useFinanceImportWizard.js';

export function FinanceImportWizard() {
  const wizard = useFinanceImportWizard();
  const busy =
    wizard.mutations.create.isPending ||
    wizard.mutations.format.isPending ||
    wizard.mutations.mapping.isPending ||
    wizard.mutations.commit.isPending;
  return (
    <section
      className="rounded-lg border border-border bg-surface-raised p-4 shadow-sm sm:p-6"
      aria-labelledby="finance-import-title"
    >
      <div>
        <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
          CSV průvodce
        </p>
        <h2
          id="finance-import-title"
          className="mt-1 text-section-title font-semibold"
        >
          Import pohybů
        </h2>
        <p className="mt-1 text-body-sm text-text-muted">
          Soubor zůstává dočasný, před vytvořením transakcí uvidíte mapování,
          chyby i duplicity.
        </p>
      </div>
      <ol className="mt-5 grid gap-2 sm:grid-cols-5">
        {wizard.orderedSteps.map(([key, label]) => (
          <li
            key={key}
            aria-current={wizard.step === key ? 'step' : undefined}
            className={`rounded-md px-3 py-2 text-caption ${wizard.step === key ? 'bg-selected-surface font-semibold text-primary-emphasis' : 'bg-surface-subtle text-text-muted'}`}
          >
            {label}
          </li>
        ))}
      </ol>
      {wizard.error ? (
        <div className="mt-4">
          <InlineAlert variant="danger">{wizard.error}</InlineAlert>
        </div>
      ) : null}
      <div className="mt-6">
        <FinanceImportSetupSteps wizard={wizard} />
        <FinanceImportPreviewStep wizard={wizard} />
      </div>
      <Dialog
        open={wizard.cancelOpen}
        onOpenChange={wizard.setCancelOpen}
        title="Zrušit rozpracovaný import?"
        description="Dočasný CSV soubor bude bezpečně odstraněn. Již vytvořené transakce tím nejsou ovlivněny."
      >
        <div className="flex justify-end gap-3">
          <Button onClick={() => wizard.setCancelOpen(false)}>Zpět</Button>
          <Button
            variant="danger"
            loading={wizard.mutations.cancel.isPending}
            onClick={() =>
              wizard.session &&
              wizard.mutations.cancel.mutate(wizard.session.id, {
                onSuccess: () => {
                  wizard.setCancelOpen(false);
                  wizard.reset();
                },
              })
            }
          >
            Zrušit import
          </Button>
        </div>
      </Dialog>
      {busy ? (
        <span className="sr-only" role="status">
          Zpracováváme import
        </span>
      ) : null}
    </section>
  );
}
