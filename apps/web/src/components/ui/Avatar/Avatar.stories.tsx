import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar.js';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: { imageUrl: null, name: 'Jana Nováková' },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Fallbacks: Story = {
  render: () => (
    <div className="flex items-center gap-4 bg-canvas p-8">
      <Avatar imageUrl={null} name="Jana Nováková" />
      <Avatar imageUrl={null} name="Petr Novák" size="sm" />
    </div>
  ),
};
