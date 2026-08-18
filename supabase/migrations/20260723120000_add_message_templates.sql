-- 원본전송/보정본전송 시 갤러리 관리 화면에서 복사해 손님께 보내는 안내 문자 문구를 작가가 직접 편집할 수 있도록 컬럼 추가.
-- 비워두면(NULL) 코드에서 기본 문구로 대체합니다. {{studioName}} 등 중괄호 자리표시자는 실제 값으로 치환되어 전송됩니다.
alter table app_config add column if not exists originals_sent_message_template text;
alter table app_config add column if not exists edits_sent_message_template text;
