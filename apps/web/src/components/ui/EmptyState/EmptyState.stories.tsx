import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { EmptyState } from './EmptyState.js';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  args: {
    title: 'Zatím tu nic není.',
    description: 'Položky se zobrazí, jakmile je přidáte.',
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: (args) => (
    <div className="max-w-2xl bg-canvas p-8">
      <EmptyState
        {...args}
        action={<Button disabled>Přidat dokument</Button>}
      />
    </div>
  ),
};
