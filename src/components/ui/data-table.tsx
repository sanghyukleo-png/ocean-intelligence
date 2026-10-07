"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** 셀 렌더 */
  cell: (row: T) => React.ReactNode;
  /** 정렬 기준값. 지정하면 정렬 가능 */
  sortValue?: (row: T) => number | string | null | undefined;
  /** 숫자 열: 우측 정렬 + tabular-nums */
  numeric?: boolean;
  className?: string;
  headerClassName?: string;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

/**
 * 고정 헤더 · 첫 열 고정 · 정렬 · 숫자 우측 정렬.
 * 모바일에서도 카드로 접지 않고 가로 스크롤한다.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  maxHeight,
  initialSort = null,
  stickyFirstColumn = true,
  dense = false,
  onRowClick,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** 스크린리더용 표 설명 */
  caption?: string;
  /** 지정하면 세로 스크롤 + 헤더 고정 */
  maxHeight?: number | string;
  initialSort?: SortState;
  stickyFirstColumn?: boolean;
  dense?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}) {
  const [sort, setSort] = useState<SortState>(initialSort);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      // 값 없는 행은 항상 아래로
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "ko");
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, columns, sort]);

  function toggle(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  }

  const cellPad = dense ? "px-3 py-2" : "px-4 py-3";

  return (
    <div
      className={cn("scroll-shade-x relative overflow-auto rounded-xl border border-line bg-raised", className)}
      style={maxHeight ? { maxHeight } : undefined}
      tabIndex={0}
      role="region"
      aria-label={caption}
    >
      <table className="w-full border-separate border-spacing-0 text-left text-[0.8125rem]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col, i) => {
              const active = sort?.key === col.key;
              const sortable = Boolean(col.sortValue);
              const Icon = !active ? ArrowUpDown : sort!.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "sticky top-0 z-20 whitespace-nowrap border-b border-line bg-raised font-semibold",
                    cellPad,
                    col.numeric && "text-right",
                    i === 0 && stickyFirstColumn && "left-0 z-30",
                    col.headerClassName
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggle(col.key)}
                      className={cn(
                        "type-label inline-flex min-h-11 items-center gap-1 rounded-sm transition-colors hover:text-fg md:min-h-0",
                        active ? "text-fg" : "text-fg-label",
                        col.numeric && "flex-row-reverse"
                      )}
                    >
                      {col.header}
                      <Icon size={12} strokeWidth={2} aria-hidden="true" className={active ? "text-accent" : "opacity-50"} />
                    </button>
                  ) : (
                    <span className="type-label text-fg-label">{col.header}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("group", onRowClick && "cursor-pointer")}
            >
              {columns.map((col, i) => (
                <td
                  key={col.key}
                  className={cn(
                    "border-b border-line align-middle text-fg transition-colors group-last:border-b-0 group-hover:bg-subtle",
                    cellPad,
                    col.numeric && "num text-right",
                    i === 0 && stickyFirstColumn && "sticky left-0 z-10 bg-raised",
                    col.className
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
