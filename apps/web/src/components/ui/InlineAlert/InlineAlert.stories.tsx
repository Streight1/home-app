import type { Meta, StoryObj } from '@storybook/react-vite';
import { InlineAlert } from './InlineAlert.js';

const meta = {
  title: 'Components/InlineAlert',
  component: InlineAlert,
  args: { children: 'Dokument se nepodařilo načíst.' },
} satisfies Meta<typeof InlineAlert>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Variants: Story = {
  render: () => (
    <div className="grid max-w-xl gap-3 bg-canvas p-8">
      <InlineAlert variant="info">Informace je připravená.</InlineAlert>
      <InlineAlert variant="success">Změny jsou uložené.</InlineAlert>
      <InlineAlert variant="warning">Zkontrolujte zadané údaje.</InlineAlert>
      <InlineAlert variant="danger">Dokument se nepodařilo načíst.</InlineAlert>
    </div>
  ),
};
