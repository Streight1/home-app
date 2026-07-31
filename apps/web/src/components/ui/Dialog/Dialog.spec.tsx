import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Dialog } from './Dialog.js';

describe('Dialog', () => {
  it('keeps non-dismissible loading feedback visible and focus-contained', async () => {
    const user = userEvent.setup();
    render(
      <Dialog
        open
        dismissible={false}
        title="Načítáme dialog…"
        description="Připravujeme formulář."
      >
        <div role="status">Chvilku strpení.</div>
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Načítáme dialog…',
    });
    await waitFor(() => expect(dialog).toHaveFocus());
    expect(screen.getByRole('status')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Zavřít dialog' }),
    ).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(dialog).toBeVisible();
  });
});
