import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../../../components/ui/Card/Card.js';
import { ThemeSelector } from './ThemeSelector.js';

const meta = {
  title: 'Features/Theme/ThemeSelector',
  component: ThemeSelector,
} satisfies Meta<typeof ThemeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  parameters: { theme: 'light' },
  render: () => (
    <main className="min-h-screen bg-canvas p-6 text-text">
      <Card className="mx-auto max-w-lg p-6">
        <ThemeSelector />
      </Card>
    </main>
  ),
};

export const Dark: Story = {
  ...Light,
  parameters: { theme: 'dark' },
};
