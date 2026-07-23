import { Button } from '../../../../components/ui/Button/Button.js';

export function TasksPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      className="mt-4 flex items-center justify-between gap-3"
      aria-label="Stránkování úkolů"
    >
      <Button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Předchozí
      </Button>
      <span className="text-body-sm text-text-muted">
        Strana {page} z {totalPages}
      </span>
      <Button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Další
      </Button>
    </nav>
  );
}
