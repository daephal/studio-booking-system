-- 원본 전송 시 손님이 참고/SNS 업로드용으로 함께 받는 "샘플사진"을 위한 새 photos.kind 값 추가.
alter table photos drop constraint photos_kind_check;
alter table photos add constraint photos_kind_check check (kind in ('original', 'edited', 'sample'));
