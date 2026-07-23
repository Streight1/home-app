import type { Meta, StoryObj } from '@storybook/react-vite';

function Typography() {
  return (
    <main className="min-h-screen bg-canvas p-6 text-text md:p-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-surface p-6 md:p-8">
        <p className="text-caption font-semibold uppercase tracking-[0.12em] text-primary">
          Typografie
        </p>
        <h1 className="mt-4 text-display font-semibold tracking-[-0.03em]">
          Klidné centrum domácnosti
        </h1>
        <h2 className="mt-8 text-page-title font-semibold tracking-[-0.025em]">
          Nadpis stránky
        </h2>
        <h3 className="mt-6 text-section-title font-semibold">Nadpis sekce</h3>
        <p className="mt-3 text-body leading-7 text-text-muted">
          Inter drží rozhraní čitelné v navigaci, formulářích i delších
          přehledech. Hierarchie je klidná a nepoužívá marketingovou velikost
          uvnitř aplikace.
        </p>
        <p className="mt-5 text-body-sm text-text-muted">
          Menší popis pro metadata a doprovodné informace.
        </p>
        <p className="tabular-nums mt-5 text-2xl font-semibold">18 450 Kč</p>
        <p className="mt-1 text-caption text-text-muted">
          Číselné údaje používají tabulkové číslice.
        </p>
      </div>
    </main>
  );
}

const meta = {
  title: 'Foundations/Typography',
  component: Typography,
} satisfies Meta<typeof Typography>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
