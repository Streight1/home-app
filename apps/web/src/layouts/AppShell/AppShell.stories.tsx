import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../../components/ui/Card/Card.js';
import { AppShell } from './AppShell.js';
import { SIDEBAR_PREFERENCE_KEY } from './sidebarPreference.js';

function ShellContent() {
  return (
    <div>
      <h1 className="text-page-title font-semibold tracking-tight">
        Přehled domácnosti
      </h1>
      <p className="mt-2 text-body text-text-muted">
        Responzivní kostra bez business dat.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <Card className="p-6 md:col-span-2 xl:col-span-8">
          <h2 className="text-section-title font-semibold">Hlavní obsah</h2>
          <p className="mt-2 text-body-sm text-text-muted">
            Obsah se přizpůsobí dostupné šířce, navigace mění vlastní kompozici.
          </p>
        </Card>
        <Card className="p-6 xl:col-span-4">
          <h2 className="text-section-title font-semibold">Vedlejší panel</h2>
          <p className="mt-2 text-body-sm text-text-muted">
            Na menší šířce se řadí pod hlavní obsah.
          </p>
        </Card>
      </div>
    </div>
  );
}

const meta = {
  title: 'Layouts/AppShell',
  component: AppShell,
  args: {
    householdName: 'Moje domácnost',
    displayName: 'Jana Nováková',
    avatarUrl: null,
    isLoggingOut: false,
    onLogout: () => undefined,
    children: <ShellContent />,
  },
} satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  parameters: { theme: 'dark', viewport: { defaultViewport: 'desktop' } },
};
export const DesktopCollapsed: Story = {
  parameters: { theme: 'dark', viewport: { defaultViewport: 'desktop' } },
  render: (args) => {
    localStorage.setItem(SIDEBAR_PREFERENCE_KEY, 'collapsed');
    return <AppShell {...args} />;
  },
};
export const Tablet: Story = {
  parameters: { theme: 'dark', viewport: { defaultViewport: 'tablet' } },
};
export const Mobile: Story = {
  parameters: { theme: 'dark', viewport: { defaultViewport: 'mobile1' } },
};

export const Staging: Story = {
  args: { environmentLabel: 'Staging' },
  parameters: { theme: 'dark', viewport: { defaultViewport: 'mobile1' } },
};
