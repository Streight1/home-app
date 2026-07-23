import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge.js';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Připravujeme' },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 bg-canvas p-8">
      <Badge>Neutrální</Badge>
      <Badge variant="primary">Aktivní</Badge>
      <Badge variant="success">Hotovo</Badge>
      <Badge variant="warning">Pozornost</Badge>
    </div>
  ),
};
