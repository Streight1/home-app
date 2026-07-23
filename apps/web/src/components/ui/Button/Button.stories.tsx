import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.js';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Uložit změny' },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 bg-canvas p-8">
      <Button variant="primary">Uložit změny</Button>
      <Button variant="secondary">Zrušit</Button>
      <Button variant="ghost">Zkusit znovu</Button>
      <Button variant="danger">Odstranit</Button>
      <Button loading>Ukládáme…</Button>
      <Button disabled>Neaktivní</Button>
    </div>
  ),
};
