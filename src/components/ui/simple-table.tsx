import { cn } from "@/lib/utils";

/**
 * 서버 컴포넌트용 표 — DataTable과 같은 모양(고정 헤더·첫 열 고정·가로 스크롤)이지만 정렬 없이 미리 정렬된 행을 받는다.
 * 셀 렌더 함수를 클라이언트로 넘길 수 없는 서버 화면(/status, 항만 위험도)에서 쓴다.
 */
export function SimpleTable({
  caption,
  headers,
  rows,
  numeric = [],
  className,
}: {
  caption: string;
  headers: React.ReactNode[];
  rows: { key: string; cells: React.ReactNode[] }[];
  /** 우측 정렬 숫자 열 인덱스 */
  numeric?: number[];
  className?: string;
}) {
  return (
    <div
      className={cn("scroll-shade-x relative overflow-auto rounded-xl border border-line bg-raised", className)}
      tabIndex={0}
      role="region"
      aria-label={caption}
    >
      <table className="w-full border-separate border-spacing-0 text-left text-[0.8125rem]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className={cn(
                  "type-label sticky top-0 z-20 whitespace-nowrap border-b border-line bg-raised px-4 py-3 font-semibold text-fg-label",
                  numeric.includes(i) && "text-right",
                  i === 0 && "left-0 z-30"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="group">
              {row.cells.map((cell, i) => {
                const Tag = i === 0 ? "th" : "td";
                return (
                  <Tag
                    key={i}
                    scope={i === 0 ? "row" : undefined}
                    className={cn(
                      "border-b border-line px-4 py-3 align-top font-normal text-fg group-last:border-b-0",
                      numeric.includes(i) && "num text-right",
                      i === 0 && "sticky left-0 z-10 bg-raised"
                    )}
                  >
                    {cell}
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
