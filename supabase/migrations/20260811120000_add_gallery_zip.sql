-- 관리자가 미리 생성해두는 원본 전체 ZIP 캐시 (재생성 시 같은 R2 키를 덮어써서 이전 파일을 대체함).
alter table galleries add column if not exists zip_r2_key text;
alter table galleries add column if not exists zip_size bigint;
alter table galleries add column if not exists zip_built_at timestamptz;
