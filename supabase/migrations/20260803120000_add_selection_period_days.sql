-- 원본 삭제 시점(gallery_expiry_days)과 셀렉 마감 기본값이 하나의 값으로 묶여 있던 문제를 분리.
-- gallery_expiry_days는 이제 순수하게 "원본 전송일로부터 며칠 뒤 사진을 영구 삭제할지"만 의미하고,
-- selection_period_days는 "원본 전송일로부터 며칠 안에 셀렉을 완료해야 하는지"의 기본값으로 별도 사용됩니다.
-- (원본 전송 시 관리자가 셀렉 마감일을 직접 지정하면 이 기본값 대신 그 값이 사용됩니다.)
alter table app_config add column if not exists selection_period_days integer not null default 30;
