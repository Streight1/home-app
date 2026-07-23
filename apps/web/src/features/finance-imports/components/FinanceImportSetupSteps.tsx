import { Button } from '../../../components/ui/Button/Button.js';
import { Select } from '../../../components/ui/Select/Select.js';
import { CsvFormatSettings } from './mapping/CsvFormatSettings.js';
import { ImportColumnMapper } from './mapping/ImportColumnMapper.js';
import { ImportProfilePicker } from './mapping/ImportProfilePicker.js';
import { CsvImportDropzone } from './upload/CsvImportDropzone.js';
import type { FinanceImportWizardState } from '../hooks/useFinanceImportWizard.js';

export function FinanceImportSetupSteps({
  wizard,
}: {
  wizard: FinanceImportWizardState;
}) {
  if (wizard.step === 'file') {
    return (
      <form
        className="grid gap-4"
        onSubmit={(event) => void wizard.submitFile(event)}
      >
        <Select
          label="Cílový účet"
          value={wizard.accountId}
          onChange={(event) => wizard.setAccountId(event.target.value)}
          required
        >
          <option value="">Vyberte účet</option>
          {wizard.accounts.data?.items
            .filter((account) => !account.archivedAt)
            .map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ·{' '}
                {account.type === 'CREDIT_CARD'
                  ? 'kreditní karta'
                  : account.currencyCode}
              </option>
            ))}
        </Select>
        <CsvImportDropzone file={wizard.file} onChange={wizard.setFile} />
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={wizard.mutations.create.isPending}
          >
            Nahrát a pokračovat
          </Button>
        </div>
      </form>
    );
  }
  if (wizard.step === 'format') {
    return (
      <div className="grid gap-5">
        <ImportProfilePicker
          profiles={wizard.profiles.data?.items ?? []}
          accountId={wizard.accountId}
          value={wizard.mapping.profileId}
          onApply={(format, mapping) => {
            wizard.setFormat(format);
            wizard.setMapping(mapping);
          }}
        />
        <CsvFormatSettings value={wizard.format} onChange={wizard.setFormat} />
        <WizardActions
          back={() => wizard.setStep('file')}
          next={() => void wizard.submitFormat()}
          loading={wizard.mutations.format.isPending}
        />
      </div>
    );
  }
  if (wizard.step === 'mapping') {
    return (
      <div className="grid gap-5">
        <ImportColumnMapper
          headers={wizard.headers}
          value={wizard.mapping}
          onChange={wizard.setMapping}
        />
        <WizardActions
          back={() => wizard.setStep('format')}
          next={() => void wizard.submitMapping()}
          loading={wizard.mutations.mapping.isPending}
        />
      </div>
    );
  }
  if (wizard.step === 'result' && wizard.result) {
    return (
      <div className="rounded-lg bg-success-soft p-6 text-center">
        <h3 className="text-section-title font-semibold">
          Import je dokončený
        </h3>
        <p className="mt-2 text-body-sm">
          Vytvořeno transakcí:{' '}
          <strong className="tabular-nums">
            {wizard.result.importedRowCount}
          </strong>
        </p>
        <Button className="mt-4" onClick={wizard.reset}>
          Nový import
        </Button>
      </div>
    );
  }
  return null;
}

function WizardActions({
  back,
  next,
  loading,
}: {
  back: () => void;
  next: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex justify-end gap-3">
      <Button onClick={back}>Zpět</Button>
      <Button variant="primary" loading={loading} onClick={next}>
        Pokračovat
      </Button>
    </div>
  );
}
