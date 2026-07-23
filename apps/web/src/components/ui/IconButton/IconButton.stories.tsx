import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Search, Settings } from 'lucide-react';
import { IconButton } from './IconButton.js';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const States: Story = {
  args: {
    'aria-label': 'Hledat',
    children: <Search className="size-5" aria-hidden="true" />,
  },
  render: () => (
    <div className="flex gap-3 bg-canvas p-8">
      <IconButton aria-label="Hledat">
        <Search className="size-5" aria-hidden="true" />
      </IconButton>
      <IconButton aria-label="Přidat" variant="ghost">
        <Plus className="size-5" aria-hidden="true" />
      </IconButton>
      <IconButton aria-label="Nastavení" disabled>
        <Settings className="size-5" aria-hidden="true" />
      </IconButton>
    </div>
  ),
};
