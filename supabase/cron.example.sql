-- 외부 스케줄러 예시: Supabase pg_cron + pg_net 으로 /api/ingest/[source] 를 주기 호출한다.
-- Vercel Hobby cron은 하루 1회라 특보(10분)·AIS(5분) 주기를 못 맞춘다(docs/data-sources.md 인프라 제약).
-- 실행 전: Database → Extensions에서 pg_cron, pg_net 활성화. <SITE>와 <CRON_SECRET>은 직접 바꾼다(이 파일에 실제 값을 커밋하지 않는다).
-- 비밀 값은 Vault에 두는 것을 권장: select vault.create_secret('<CRON_SECRET>', 'oi_cron_secret');

select cron.schedule('oi-kma-warnings', '*/10 * * * *', $$
  select net.http_post(
    url := 'https://<SITE>/api/ingest/kma-warnings',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'oi_cron_secret'))
  );
$$);

select cron.schedule('oi-ais', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://<SITE>/api/ingest/aisstream',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'oi_cron_secret')),
    timeout_milliseconds := 60000
  );
$$);

-- 나머지(환율·유가·중기해상예보)는 각 소스의 최소 간격을 서버가 지키므로 30분마다 all 호출로 충분하다
select cron.schedule('oi-all', '*/30 * * * *', $$
  select net.http_post(
    url := 'https://<SITE>/api/ingest/all',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'oi_cron_secret')),
    timeout_milliseconds := 60000
  );
$$);

select cron.schedule('oi-prune', '0 4 * * *', $$ select public.prune_source_runs(); $$);
