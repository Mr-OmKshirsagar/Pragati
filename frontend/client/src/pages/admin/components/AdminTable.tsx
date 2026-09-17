import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => ReactNode;
  width?: string;
  sortable?: boolean;
}

interface AdminTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  isEmpty?: boolean;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => ReactNode;
  selectable?: boolean;
  selectedRows?: Set<any>;
  onSelectRow?: (id: any, selected: boolean) => void;
}

export function AdminTable<T extends { id?: any }>({
  columns,
  data,
  isLoading,
  isEmpty,
  onRowClick,
  actions,
  selectable,
  selectedRows,
  onSelectRow,
}: AdminTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#e2e8f2] bg-white overflow-hidden">
        <div className="p-8 text-center text-[#8294b0]">Loading...</div>
      </div>
    );
  }

  if (isEmpty || data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e2e8f2] bg-white overflow-hidden">
        <div className="p-12 text-center">
          <div className="text-[#8294b0] text-sm">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e2e8f2] bg-white overflow-x-auto shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e2e8f2] bg-[#f8fafc]">
            {selectable && (
              <th className="px-6 py-4">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#d0d8e6] text-primary accent-primary"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.08em] text-[#7d8ba3]"
                style={{ width: column.width }}
              >
                {column.label}
                {column.sortable && <span className="ml-2 inline text-[#b4bcd1]">↕</span>}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.08em] text-[#7d8ba3]">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const rowId = row.id ?? idx;
            const isSelected = selectedRows?.has(rowId);
            return (
              <tr
                key={rowId}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-[#e2e8f2] transition-colors hover:bg-[#f5f7fb] ${
                  onRowClick ? "cursor-pointer" : ""
                } ${isSelected ? "bg-primary/10" : "bg-white"}`}
              >
                {selectable && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected || false}
                      onChange={(e) =>
                        onSelectRow?.(rowId, e.target.checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-[#d0d8e6] text-primary accent-primary"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 text-sm text-[#3d4959]"
                  >
                    {column.render
                      ? column.render((row as any)[column.key], row)
                      : (row as any)[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
