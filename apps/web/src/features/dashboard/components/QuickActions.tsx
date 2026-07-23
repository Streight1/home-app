import { FilePlus2, Plus, ReceiptText } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button.js';
import { DashboardSection } from './DashboardSection.js';

export function QuickActions() {
  return (
    <DashboardSection
      title="Rychlé akce"
      description="Nejčastější kroky budou dostupné bez hledání v navigaci."
      className="md:col-span-5 xl:col-span-4"
    >
      <div className="grid gap-2">
        <Button disabled className="justify-start">
          <FilePlus2 className="size-4" aria-hidden="true" />
          Přidat dokument
        </Button>
        <Button disabled className="justify-start">
          <ReceiptText className="size-4" aria-hidden="true" />
          Přidat výdaj
        </Button>
        <Button disabled className="justify-start">
          <Plus className="size-4" aria-hidden="true" />
          Přidat úkol
        </Button>
      </div>
      <p className="mt-3 text-caption text-text-muted">
        Připravujeme s navazujícími moduly.
      </p>
    </DashboardSection>
  );
}
