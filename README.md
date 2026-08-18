# 스냅사진 스튜디오 예약/갤러리 시스템

사진 스튜디오(돌잔치/웨딩/야외스냅 등)의 예약 접수, 원본사진 전달, 보정사진 셀렉을 처리하는 웹사이트.
스튜디오 이름, 브랜드, 계좌정보, 약관, 예약 항목 등은 모두 관리자 화면에서 직접 설정할 수 있어
코드 수정 없이 다른 작가에게도 그대로 배포할 수 있습니다.

## 바로 배포하기

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdaephal%2Fstudio-booking-system&env=NEXT_PUBLIC_SITE_URL%2CR2_ACCOUNT_ID%2CR2_ACCESS_KEY_ID%2CR2_SECRET_ACCESS_KEY%2CR2_BUCKET%2CGMAIL_USER%2CGMAIL_APP_PASSWORD%2CGOOGLE_CLIENT_ID%2CGOOGLE_CLIENT_SECRET%2CGOOGLE_REDIRECT_URI%2CGALLERY_SESSION_SECRET%2CCRON_SECRET&envDescription=%EA%B0%81%20%EA%B0%92%EC%9D%84%20%EC%96%B4%EB%94%94%EC%84%9C%20%EA%B5%AC%ED%95%98%EB%8A%94%EC%A7%80%EB%8A%94%20SETUP.md%EB%A5%BC%20%EC%B0%B8%EA%B3%A0%ED%95%98%EC%84%B8%EC%9A%94&envLink=https%3A%2F%2Fgithub.com%2Fdaephal%2Fstudio-booking-system%2Fblob%2Fmain%2FSETUP.md&project-name=my-studio&repository-name=my-studio&stores=%5B%7B%22type%22%3A%20%22integration%22%2C%20%22integrationSlug%22%3A%20%22supabase%22%2C%20%22productSlug%22%3A%20%22supabase%22%2C%20%22protocol%22%3A%20%22storage%22%7D%5D)

버튼을 누르면 배포 도중 Supabase 연동 카드가 나타나 클릭 한 번으로 DB까지 자동 준비됩니다. 누르기 전에
**[SETUP.md](SETUP.md)의 "필요한 값 미리 준비하기"**부터 진행하세요 (Cloudflare R2/Gmail/Google Calendar 계정 생성 및 값 발급).

## 기술 스택

Next.js (App Router) + TypeScript + Tailwind CSS · Supabase (DB/관리자 인증) · Cloudflare R2 (사진 저장) ·
Gmail SMTP 또는 Resend (이메일) · Google Calendar API · Vercel Cron (리마인더/만료 처리)

## 시작하기

```bash
npm install
cp .env.example .env.local
npm run dev
```

외부 서비스(Supabase/R2/Gmail/Google) 계정 생성과 배포까지의 전체 과정은 **[SETUP.md](SETUP.md)** 를 따라하세요.
비개발자도 따라할 수 있도록 계정 생성부터 배포, 최초 스튜디오 정보 입력까지 순서대로 안내되어 있습니다.

값이 비어 있어도 개발 서버는 정상 실행되며, 해당 기능을 쓰는 화면에서는 "환경변수 설정이 필요합니다" 안내가 표시됩니다.

## 디렉토리 구조

```
app/(public)/         홈 · 예약 폼
app/g/[slug]/         고객 갤러리 (비밀번호 접속, 셀렉, 재수정, 다운로드)
app/admin/            관리자 대시보드 · 예약 관리 · 스튜디오 설정 · 구글 캘린더 연동
app/api/              예약/갤러리/셀렉/구글 콜백/크론 API
lib/                  Supabase, R2, 이메일, 구글 캘린더, 세션, 검증 등 공통 로직
supabase/migrations/  DB 스키마 (Vercel×Supabase 연동 시 자동 적용)
```

## 관리자 설정 화면

배포 후 `/admin/setup`(설정 가이드)에서 아래 항목들을 순서대로 채우면 바로 서비스를 시작할 수 있습니다.

- **스튜디오 프로필** — 이름, 카카오톡/인스타그램, 계좌정보, 통신판매업 법적 고지, 운영 규칙
- **촬영 약관** — 취소/환불 규정 등 문구를 자유롭게 편집
- **예약 항목 설정** — 촬영형태 종류/이름, 예약 폼의 텍스트 입력 항목(최대 6개) 구성
- **구글 캘린더 연동** / **테마 설정**

## 배포

Vercel에 배포하고 `vercel.json`에 정의된 Cron(리마인더/만료 처리)이 매일 자정 실행되도록 환경변수만 설정하면 됩니다.
자세한 내용은 [SETUP.md](SETUP.md) 참고.
