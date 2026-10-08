-- OCEAN INTELLIGENCE 수집 저장소 (지시서 11.2)
-- 서버(Route Handler)만 비밀 키로 접근한다. RLS를 켜고 공개 정책을 두지 않아 anon 키로는 읽기·쓰기 불가.

create table if not exists public.observations (
  metric           text        not null,
  source           text        not null,
  as_of            text        not null,          -- 원천 기준 시각(ISO) 또는 날짜(YYYY-MM-DD)
  as_of_precision  text        not null check (as_of_precision in ('day', 'minute')),
  value            double precision not null,
  unit             text        not null,
  fetched_at       timestamptz not null,
  source_url       text        not null,
  primary key (metric, source, as_of)
);
create index if not exists observations_recent on public.observations (metric, source, as_of desc);

create table if not exists public.snapshots (
  key         text primary key,
  data        jsonb       not null,
  as_of       text        not null,
  fetched_at  timestamptz not null,
  source      text        not null,
  source_url  text        not null
);

create table if not exists public.source_runs (
  id           bigint generated always as identity primary key,
  source_id    text        not null,
  started_at   timestamptz not null,
  finished_at  timestamptz not null,
  ok           boolean     not null,
  duration_ms  integer     not null,
  kind         text,
  message      text,
  accepted     integer     not null default 0,
  rejected     integer     not null default 0
);
create index if not exists source_runs_recent on public.source_runs (source_id, finished_at desc);

create table if not exists public.source_status (
  source_id             text primary key,
  last_attempt_at       timestamptz,
  last_success_at       timestamptz,
  consecutive_failures  integer not null default 0,
  last_duration_ms      integer,
  last_error            jsonb
);

alter table public.observations  enable row level security;
alter table public.snapshots     enable row level security;
alter table public.source_runs   enable row level security;
alter table public.source_status enable row level security;

-- 수집 기록은 90일만 보관
create or replace function public.prune_source_runs() returns void language sql as $$
  delete from public.source_runs where finished_at < now() - interval '90 days';
$$;
