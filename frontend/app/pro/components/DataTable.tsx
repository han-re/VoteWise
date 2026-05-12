"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

export interface Column<R> {
  /** Stable key used for sort state and React lists. */
  key: string;
  header: ReactNode;
  /** Cell renderer. Returns the React node to render in the cell. */
  render: (row: R) => ReactNode;
  /** Pull a comparable value out of the row (number or string). */
  sortValue?: (row: R) => number | string | null;
  /** Set true for currency / percentage columns. Renders in monospace, right-aligned. */
  numeric?: boolean;
  align?: "left" | "right";
  width?: number | string;
}

interface Props<R> {
  columns: Column<R>[];
  rows: R[];
  /** Stable id extractor for React keys + onRowClick payload. */
  getRowId: (row: R) => string;
  pageSize?: number;
  /** If set, renders a search box that filters rows by this field (case-insensitive substring). */
  searchFieldKey?: string;
  searchPlaceholder?: string;
  searchAccessor?: (row: R) => string;
  onRowClick?: (row: R) => void;
  empty?: ReactNode;
}

type SortDir = "asc" | "desc";

export function DataTable<R>({
  columns,
  rows,
  getRowId,
  pageSize = 25,
  searchFieldKey,
  searchPlaceholder = "Search…",
  searchAccessor,
  onRowClick,
  empty,
}: Props<R>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    if (!query.trim() || !searchAccessor) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchAccessor(r).toLowerCase().includes(q));
  }, [rows, query, searchAccessor]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return filteredRows;
    const out = [...filteredRows];
    out.sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [filteredRows, columns, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sortedRows.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize,
  );

  function handleSort(col: Column<R>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
    setPage(0);
  }

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  };

  return (
    <div>
      {searchFieldKey && (
        <div style={{ marginBottom: 12 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder={searchPlaceholder}
            style={{
              background: "var(--vw-card-bg)",
              border: "1px solid var(--vw-pro-grid)",
              color: "#cddcec",
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 13,
              minWidth: 240,
              outline: "none",
            }}
          />
        </div>
      )}

      <div
        className="tracker-hidden-scrollbar"
        style={{
          overflowX: "auto",
          border: "1px solid var(--vw-pro-grid)",
          borderRadius: 8,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "rgba(125,211,252,0.04)" }}>
              {columns.map((col) => {
                const sortable = Boolean(col.sortValue);
                const isSorted = sortKey === col.key;
                const align = col.align ?? (col.numeric ? "right" : "left");
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col)}
                    style={{
                      padding: "10px 12px",
                      textAlign: align,
                      width: col.width,
                      color: isSorted ? "var(--vw-pro-cyan)" : "rgba(180,207,232,0.7)",
                      fontWeight: 500,
                      fontSize: 11.5,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      cursor: sortable ? "pointer" : "default",
                      userSelect: "none",
                      borderBottom: isSorted
                        ? "2px solid var(--vw-pro-cyan)"
                        : "1px solid var(--vw-pro-grid)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.header}
                    {isSorted && (
                      <span style={{ marginLeft: 6, fontFamily: "var(--vw-pro-mono)" }}>
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: 24, textAlign: "center", color: "rgba(180,207,232,0.55)" }}>
                  {empty ?? "No data."}
                </td>
              </tr>
            )}
            {pageRows.map((row) => (
              <tr
                key={getRowId(row)}
                onClick={() => onRowClick?.(row)}
                style={{
                  cursor: onRowClick ? "pointer" : "default",
                  borderTop: "1px solid var(--vw-pro-grid)",
                }}
              >
                {columns.map((col) => {
                  const align = col.align ?? (col.numeric ? "right" : "left");
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: "10px 12px",
                        textAlign: align,
                        fontFamily: col.numeric ? "var(--vw-pro-mono)" : undefined,
                        color: "#cddcec",
                        whiteSpace: "nowrap",
                        maxWidth: 320,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {col.render(row)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
            fontSize: 12,
            color: "rgba(180,207,232,0.6)",
          }}
        >
          <div>
            {sortedRows.length === 0
              ? "0 rows"
              : `Showing ${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, sortedRows.length)} of ${sortedRows.length}`}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              style={pagerBtnStyle}
            >
              Prev
            </button>
            <span style={{ padding: "4px 10px", fontFamily: "var(--vw-pro-mono)" }}>
              {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              style={pagerBtnStyle}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const pagerBtnStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid var(--vw-pro-grid)",
  color: "#cddcec",
  padding: "4px 12px",
  borderRadius: 4,
  fontSize: 12,
  cursor: "pointer",
};
