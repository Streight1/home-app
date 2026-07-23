import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input.js';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  args: {
    label: 'Název domácnosti',
    placeholder: 'Moje domácnost',
  },
  decorators: [
    (Story) => (
      <div className="min-h-64 bg-canvas p-8 text-text">
        <div className="max-w-sm">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};
export const Error: Story = {
  args: { error: 'Zadejte název domácnosti.' },
};
export const Disabled: Story = { args: { disabled: true } };
