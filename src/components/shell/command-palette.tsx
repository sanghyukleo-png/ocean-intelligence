"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, History, Search } from "lucide-react";
import { ALL_NAV_ITEMS, type NavItem } from "@/lib/nav";
import { readRecentWork, type RecentWork } from "@/lib/recent-work";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const OPEN_EVENT = "oi:command-palette";

/** 어디서든 팔레트를 연다 (헤더 버튼·모바일 탭) */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** 서버 컴포넌트(404 등)에서도 쓸 수 있는 팔레트 열기 버튼 */
export function CommandPaletteTrigger({ label = "도구 검색", className }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(buttonVariants({ variant: "secondary" }), className)}
    >
      <Search size={16} strokeWidth={1.75} aria-hidden="true" />
      {label}
      <kbd aria-hidden="true" className="hidden rounded-full border border-line-strong px-2 font-mono text-[0.6875rem] leading-5 text-fg-label md:inline">
        ⌘K
      </kbd>
    </button>
  );
}

interface Entry {
  id: string;
  label: string;
  hint: string;
  href: string;
  group: "최근 계산" | "도구 · 페이지";
  item?: NavItem;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[\s·_\-/]+/g, "");
}

function matches(entry: Entry, query: string) {
  if (!query) return true;
  const q = normalize(query);
  const hay = [entry.label, entry.hint, entry.item?.en ?? "", ...(entry.item?.keywords ?? [])].map(normalize);
  return hay.some((h) => h.includes(q));
}

export function CommandPalette() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [recent, setRecent] = useState<RecentWork[]>([]);

  // 전역 단축키: ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setRecent(readRecentWork().slice(0, 5));
      d.showModal();
      requestAnimationFrame(() => input.current?.focus());
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  const entries = useMemo<Entry[]>(() => {
    const recentEntries: Entry[] = recent.map((r) => ({
      id: `recent-${r.id}`,
      label: r.title,
      hint: r.summary,
      href: r.href,
      group: "최근 계산",
    }));
    const navEntries: Entry[] = ALL_NAV_ITEMS.map((item) => ({
      id: item.href,
      label: item.label,
      hint: item.status === "soon" ? `${item.description} · 준비 중` : item.description,
      href: item.href,
      group: "도구 · 페이지",
      item,
    }));
    return [...recentEntries, ...navEntries].filter((e) => matches(e, query.trim()));
  }, [recent, query]);

  const active = Math.min(cursor, Math.max(0, entries.length - 1));

  function go(entry: Entry | undefined) {
    if (!entry) return;
    setOpen(false);
    router.push(entry.href);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }

  let lastGroup: string | null = null;

  return (
    <dialog
      ref={dialog}
      aria-label="도구·페이지 검색"
      onClose={close}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="m-0 mx-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] max-w-none rounded-xl border border-line-strong bg-raised p-0 text-fg shadow-[0_32px_64px_rgb(0_0_0/0.4),inset_0_1px_0_var(--highlight)] backdrop:bg-[rgb(3_6_12/0.55)] backdrop:backdrop-blur-[2px] max-md:mt-4"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-fg-muted" />
        <input
          ref={input}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={entries[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          placeholder="도구·페이지 검색 — 예: laytime, 넷백, q88"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => (entries.length ? (Math.min(c, entries.length - 1) + 1) % entries.length : 0));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => (entries.length ? (Math.min(c, entries.length - 1) - 1 + entries.length) % entries.length : 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(entries[active]);
            }
          }}
          className="h-14 min-w-0 flex-1 bg-transparent text-[0.9375rem] text-fg outline-none placeholder:text-fg-faint"
        />
        <kbd aria-hidden="true" className="hidden rounded-full border border-line-strong px-2 font-mono text-[0.6875rem] leading-5 text-fg-label sm:inline">
          esc
        </kbd>
      </div>

      <ul id={listId} role="listbox" aria-label="검색 결과" className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain p-2">
        {entries.length === 0 && <li className="px-3 py-8 text-center text-sm text-fg-muted">일치하는 도구가 없습니다.</li>}
        {entries.map((entry, i) => {
          const header = entry.group !== lastGroup ? entry.group : null;
          lastGroup = entry.group;
          const Icon = entry.item?.icon ?? History;
          return (
            <li key={entry.id} role="presentation">
              {header && (
                <p role="presentation" className="type-label px-3 pb-2 pt-3 text-fg-label">
                  {header}
                </p>
              )}
              <div
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onPointerMove={() => setCursor(i)}
                onClick={() => go(entry)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2",
                  i === active ? "bg-subtle" : ""
                )}
              >
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" className={i === active ? "text-accent" : "text-fg-muted"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{entry.label}</span>
                  <span className="block truncate text-xs text-fg-muted">{entry.hint}</span>
                </span>
                {i === active && <CornerDownLeft size={14} aria-hidden="true" className="shrink-0 text-fg-muted" />}
              </div>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}
