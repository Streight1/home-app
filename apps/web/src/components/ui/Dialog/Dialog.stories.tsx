import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { Dialog, DialogClose } from './Dialog.js';

const meta = { title: 'Components/Dialog', component: Dialog } satisfies Meta<
  typeof Dialog
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Upravit domácnost',
    description:
      'Dialog udrží focus uvnitř a po zavření jej vrátí na spouštěcí tlačítko.',
    trigger: <Button>Otevřít dialog</Button>,
    children: (
      <div>
        <p className="text-body-sm text-text-muted">
          Ukázkový obsah bez ukládání dat.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button>Zrušit</Button>
          </DialogClose>
          <Button variant="primary" disabled>
            Uložit změny
          </Button>
        </div>
      </div>
    ),
  },
};

export const Open: Story = {
  ...Default,
  args: { ...Default.args, defaultOpen: true },
};
