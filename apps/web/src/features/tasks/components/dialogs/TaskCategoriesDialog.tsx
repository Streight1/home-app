import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  useCreateTaskCategory,
  useDeleteTaskCategory,
  useUpdateTaskCategory,
} from '../../hooks/useTaskCategories.js';
import { taskErrorMessage } from '../../lib/taskErrorMessage.js';
import type { TaskCategory } from '../../types/task.types.js';

const colors: { value: TaskCategory['colorToken']; label: string }[] = [
  { value: 'primary', label: 'Fialová' },
  { value: 'blue', label: 'Modrá' },
  { value: 'cyan', label: 'Tyrkysová' },
  { value: 'success', label: 'Zelená' },
  { value: 'warning', label: 'Oranžová' },
  { value: 'danger', label: 'Červená' },
];

export function TaskCategoriesDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TaskCategory[];
}) {
  const [name, setName] = useState('');
  const [colorToken, setColorToken] =
    useState<TaskCategory['colorToken']>('primary');
  const [editing, setEditing] = useState<TaskCategory | null>(null);
  const [deleting, setDeleting] = useState<TaskCategory | null>(null);
  const create = useCreateTaskCategory();
  const update = useUpdateTaskCategory();
  const remove = useDeleteTaskCategory();
  const submit = () => {
    if (!name.trim()) return;
    const mutation = editing
      ? update.mutate(
          { id: editing.id, input: { name: name.trim(), colorToken } },
          { onSuccess: reset },
        )
      : create.mutate({ name: name.trim(), colorToken }, { onSuccess: reset });
    return mutation;
  };
  const reset = () => {
    setName('');
    setColorToken('primary');
    setEditing(null);
  };
  const error = create.error ?? update.error ?? remove.error;
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Kategorie úkolů"
        description="Kategorie jsou společné pro celou domácnost."
        size="md"
        mobileFullScreen
      >
        <form
          className="grid gap-3 rounded-lg border border-border bg-surface p-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            label={editing ? 'Nový název' : 'Název kategorie'}
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
          />
          <Select
            label="Barva"
            value={colorToken}
            onChange={(event) =>
              setColorToken(event.target.value as TaskCategory['colorToken'])
            }
          >
            {colors.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            {editing ? (
              <Button variant="ghost" onClick={reset}>
                Zrušit úpravu
              </Button>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              loading={create.isPending || update.isPending}
            >
              {editing ? 'Uložit' : 'Vytvořit kategorii'}
            </Button>
          </div>
        </form>
        {error ? (
          <p className="mt-3 text-body-sm text-danger">
            {taskErrorMessage(error)}
          </p>
        ) : null}
        <ul className="mt-5 divide-y divide-border rounded-lg border border-border">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <span className="font-medium text-text">{category.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(category);
                    setName(category.name);
                    setColorToken(category.colorToken);
                  }}
                >
                  Upravit
                </Button>
                <Button variant="ghost" onClick={() => setDeleting(category)}>
                  Odstranit
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Odstranit kategorii?"
        description="Úkoly zůstanou zachované a budou bez kategorie."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleting(null)}>Zrušit</Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              deleting &&
              remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
            }
          >
            Odstranit
          </Button>
        </div>
      </Dialog>
    </>
  );
}
