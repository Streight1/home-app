import { Button } from '../../../../components/ui/Button/Button.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type { DocumentPageSize } from '../../types/document.types.js';

export function DocumentPagination({
  page,
  pageSize,
  totalPages,
  disabled,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: DocumentPageSize;
  totalPages: number;
  disabled: boolean;
  onPage: (page: number) => void;
  onPageSize: (size: DocumentPageSize) => void;
}) {
  return (
    <nav
      aria-label="Stránkování dokumentů"
      className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <Select
        label="Položek na stránku"
        className="sm:w-28"
        value={pageSize}
        onChange={(event) =>
          onPageSize(Number(event.target.value) as DocumentPageSize)
        }
      >
        {[10, 20, 50, 100].map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
      <div className="flex items-center justify-between gap-3">
        <Button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1 || disabled}
        >
          Předchozí
        </Button>
        <span className="tabular-nums text-caption text-text-muted">
          Strana {page} z {Math.max(1, totalPages)}
        </span>
        <Button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages || disabled}
        >
          Další
        </Button>
      </div>
    </nav>
  );
}
