import { useEffect, useRef, useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { documentErrorMessage } from '../../lib/documentErrorMessage.js';

export function FolderCreateDialog({
  parentId,
  onCreate,
  pending,
  error,
}: {
  parentId: string | null;
  onCreate: (input: { name: string; parentId: string | null }) => void;
  pending: boolean;
  error: unknown;
}) {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const observedPending = useRef(false);
  useEffect(() => {
    if (!submitted) return;
    if (pending) {
      observedPending.current = true;
      return;
    }
    if (!observedPending.current || error) return;
    setOpen(false);
    setName('');
    setSubmitted(false);
    observedPending.current = false;
  }, [error, pending, submitted]);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" onClick={() => setOpen(true)}>
          <FolderPlus className="size-4" aria-hidden="true" />
          Nová složka
        </Button>
      }
      title="Nová složka"
      description="Složka organizuje dokumenty pouze logicky; nemění jejich fyzické uložení."
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) {
            setSubmitted(true);
            onCreate({ name: name.trim(), parentId });
          }
        }}
      >
        <Input
          label="Název složky"
          value={name}
          maxLength={100}
          required
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
        {error ? (
          <InlineAlert variant="danger">
            {documentErrorMessage(error)}
          </InlineAlert>
        ) : null}
        <Button
          variant="primary"
          type="submit"
          loading={pending}
          disabled={!name.trim()}
        >
          Vytvořit složku
        </Button>
      </form>
    </Dialog>
  );
}
