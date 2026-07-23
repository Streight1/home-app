import type { Meta, StoryObj } from '@storybook/react-vite';

const colors = [
  ['Plátno', 'bg-canvas'],
  ['Jemné plátno', 'bg-canvas-subtle'],
  ['Povrch', 'bg-surface'],
  ['Zvýšený povrch', 'bg-surface-raised'],
  ['Hover povrch', 'bg-surface-hover'],
  ['Primární', 'bg-primary'],
  ['Primární jemná', 'bg-primary-soft'],
  ['Nebezpečí', 'bg-danger'],
  ['Varování', 'bg-warning'],
  ['Úspěch', 'bg-success'],
  ['Informace', 'bg-info'],
] as const;

function DesignTokens() {
  return (
    <main className="min-h-screen bg-canvas p-6 text-text md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-page-title font-semibold">Design tokeny</h1>
        <p className="mt-2 text-body text-text-muted">
          Sémantická paleta HomeApp Aurora pro světlé i tmavé prostředí.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colors.map(([label, colorClass]) => (
            <section
              key={label}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div
                className={`h-20 rounded-md border border-border ${colorClass}`}
              />
              <p className="mt-3 text-body-sm font-medium">{label}</p>
            </section>
          ))}
        </div>
        <section className="mt-8 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-section-title font-semibold">Tvar a hloubka</h2>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div className="size-20 rounded-sm border border-border bg-surface-subtle" />
            <div className="size-20 rounded-md border border-border bg-surface-subtle" />
            <div className="size-20 rounded-lg border border-border bg-surface shadow-sm" />
            <div className="size-20 rounded-xl border border-border bg-surface shadow-md" />
          </div>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Foundations/Design tokens',
  component: DesignTokens,
} satisfies Meta<typeof DesignTokens>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Light: Story = { parameters: { theme: 'light' } };
export const Dark: Story = { parameters: { theme: 'dark' } };
