import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { Sheet, SheetClose } from './Sheet.js';

const meta = { title: 'Components/Sheet', component: Sheet } satisfies Meta<
  typeof Sheet
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Filtry',
    description: 'Na telefonu se filtry otevírají ve spodním panelu.',
    side: 'bottom',
    trigger: <Button>Otevřít filtry</Button>,
    children: (
      <div className="grid gap-3">
        <Button disabled>Typ dokumentu</Button>
        <Button disabled>Období</Button>
        <SheetClose asChild>
          <Button variant="primary">Hotovo</Button>
        </SheetClose>
      </div>
    ),
  },
};

export const Open: Story = {
  ...Default,
  args: { ...Default.args, defaultOpen: true },
};
