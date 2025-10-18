# 학생 의견 받기

실시간 수업 참여 플랫폼 - 교사들이 쉽고 빠르게 질문을 생성하고, 학생들이 실시간으로 참여할 수 있는 서비스

## 주요 기능

### 교사 기능
- 간단한 로그인 (테스트용)
- 질문 생성 (주관식/투표)
- QR 코드 자동 생성 및 링크 공유
- 실시간 응답 확인 (3:7 레이아웃)
- 투표 결과 차트 시각화
- 응답 개별 삭제
- 질문 종료/재활성화
- 질문 히스토리 관리

### 학생 기능
- QR 코드 스캔으로 빠른 접근
- 모바일 친화적인 UI
- 텍스트 답변 작성 (최대 100자)
- 그림 그리기 (캔버스)
- 투표 참여 (단일/복수 선택)
- 익명 응답 지원
- 중복 제출 방지

## 기술 스택

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Router**: React Router v6
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL + Realtime)
- **QR Code**: qrcode.react
- **Charts**: Recharts

## 설치 및 실행

### 1. 의존성 설치

```bash
cd student-feedback
npm install
```

### 2. Supabase 설정

[SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 문서를 참고하여 Supabase 프로젝트를 설정합니다.

### 3. 환경 변수 설정

`.env.example`을 `.env`로 복사하고 Supabase 정보를 입력합니다:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`로 접속합니다.

## 사용 방법

### 교사

1. **로그인**: 이름만 입력하여 로그인
2. **질문 생성**: "새 질문 만들기" 버튼 클릭
   - 주관식: 텍스트 + 그림 응답 가능
   - 투표: 최대 5개 항목, 복수선택/익명 설정 가능
3. **QR 공유**: 생성된 QR 코드를 화면에 띄워 학생들에게 공유
4. **실시간 확인**: 좌측에 QR 코드, 우측에 실시간 응답 표시
5. **질문 종료**: 응답 받기 완료 후 "질문 종료" 버튼 클릭

### 학생

1. **QR 스캔**: 교사가 공유한 QR 코드 스캔 또는 링크 클릭
2. **정보 입력**: 번호와 닉네임 입력 (익명 투표는 불필요)
3. **응답 작성**:
   - 주관식: 텍스트 입력 또는 그림 그리기
   - 투표: 항목 선택
4. **제출**: "제출하기" 버튼 클릭
5. **완료**: 제출 완료 메시지 확인

## 프로젝트 구조

```
student-feedback/
├── src/
│   ├── components/      # 재사용 가능한 컴포넌트
│   │   ├── QRCodeDisplay.tsx
│   │   └── DrawingCanvas.tsx
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── NewQuestionPage.tsx
│   │   ├── QuestionDetailPage.tsx
│   │   └── StudentResponsePage.tsx
│   ├── lib/            # 라이브러리 설정
│   │   ├── supabase.ts
│   │   └── store.ts
│   ├── types/          # TypeScript 타입 정의
│   │   └── index.ts
│   ├── App.tsx         # 라우팅 설정
│   ├── main.tsx
│   └── index.css
├── .env.example        # 환경 변수 예시
├── SUPABASE_SETUP.md   # Supabase 설정 가이드
└── README.md
```

## 데이터 모델

### Questions (질문)
- `id`: UUID (Primary Key)
- `teacher_id`: 교사 ID
- `teacher_name`: 교사 이름
- `type`: 'text' | 'poll'
- `content`: 질문 내용 (최대 100자)
- `poll_options`: 투표 항목 배열
- `allow_multiple`: 복수 선택 허용 여부
- `is_anonymous`: 익명 투표 여부
- `status`: 'active' | 'closed' | 'deleted'
- `created_at`: 생성 시간
- `closed_at`: 종료 시간

### Responses (응답)
- `id`: UUID (Primary Key)
- `question_id`: 질문 ID (Foreign Key)
- `student_number`: 학생 번호
- `nickname`: 닉네임
- `text_answer`: 텍스트 답변 (최대 100자)
- `drawing_data`: 그림 데이터 (base64)
- `poll_answer`: 투표 답변 배열
- `submitted_at`: 제출 시간

## 제약사항

- 교사는 동시에 1개의 질문만 활성화 가능
- 동일 번호+닉네임 조합으로 중복 제출 불가
- 질문 내용 최대 100자
- 투표 항목 최대 5개
- 텍스트 답변 최대 100자

## 향후 개발 계획 (Phase 2)

- [ ] 결과 데이터 다운로드 (CSV/Excel)
- [ ] 외부 연동 기능 (비바샘 API)
- [ ] 질문 템플릿 제공
- [ ] 관리자/사용자 관리 기능
- [ ] 응답 통계 대시보드
- [ ] 다크모드 지원

## 라이선스

MIT

## 문의

이슈가 있거나 기능 제안이 있으시면 GitHub Issues를 이용해주세요.
