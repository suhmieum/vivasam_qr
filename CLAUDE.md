# 학생 의견 받기 - 비바샘

실시간 QR 코드 기반 학생 피드백 수집 플랫폼

## 🎯 프로젝트 개요

교사가 질문을 생성하면 QR 코드가 생성되고, 학생들은 스마트폰으로 QR 코드를 스캔하여 실시간으로 응답할 수 있는 수업 참여 플랫폼입니다.

## 🎨 디자인 시스템

### 컬러 팔레트
- **메인 컬러**: `#FF8800` (비바샘 주황색)
- **호버 컬러**: `#e67700`
- **배경색**: `#e9e1d9` (살구색 베이지)
- **카드 배경**: `#ffffff` (화이트)
- **액센트**: `#fff5f0` (연한 주황색)

### 로고 및 이미지
- **메인 로고**: `/vivasam_logo.png` (120px width)
- **비상교육 로고**: `/visang_logo.svg` (Footer, 클릭 시 https://www.visang.com/)
- **파비콘**: `/favicon.png`
- **빈 상태 이미지**:
  - `/no-search.png` - 대시보드 빈 상태 (200px)
  - `/question.png` - 질문 상세 빈 응답 상태 (180px)

## 🏗️ 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime Subscriptions
- **State Management**: Zustand
- **Routing**: React Router v6
- **QR Code**: qrcode.react
- **Portal**: React Portal (모달용)

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── AlertModal.tsx   # 알림 모달
│   ├── ConfirmModal.tsx # 확인 모달
│   ├── DrawingCanvas.tsx # 그림 그리기 캔버스
│   ├── Footer.tsx       # 푸터 컴포넌트
│   ├── LoadingSpinner.tsx # 로딩 스피너 (3점 애니메이션)
│   ├── Pagination.tsx   # 페이지네이션 (통계 포함)
│   ├── QRCodeDisplay.tsx # QR 코드 표시 (Portal 모달)
│   ├── Toast.tsx        # 토스트 알림
│   └── Toggle.tsx       # 토글 스위치
├── pages/               # 페이지 컴포넌트
│   ├── LoginPage.tsx    # 교사 로그인
│   ├── DashboardPage.tsx # 질문 목록 (페이지네이션, 필터, 검색)
│   ├── NewQuestionPage.tsx # 새 질문 생성
│   ├── QuestionDetailPage.tsx # 질문 상세 & 실시간 응답
│   └── StudentResponsePage.tsx # 학생 응답 제출
├── lib/                 # 유틸리티 & 설정
│   ├── supabase.ts      # Supabase 클라이언트
│   ├── store.ts         # Zustand 스토어
│   └── utils.ts         # 유틸리티 함수
├── types/               # TypeScript 타입 정의
│   └── index.ts
├── App.css              # 앱 전역 스타일
├── index.css            # 글로벌 스타일 & Tailwind
└── main.tsx             # 앱 진입점
```

## 🎯 주요 기능

### 교사 기능
1. **질문 생성**
   - 주관식 (텍스트 입력)
   - 투표 (단일/복수 선택, 최대 5개 항목)
   - 익명 응답 설정

2. **실시간 모니터링**
   - QR 코드 자동 생성 및 표시
   - QR 코드 모달 (Portal, 전체화면 dim)
   - 실시간 응답 수집 및 표시
   - 투표 결과 시각화 (색상별 막대 그래프)
   - 학생 목록 관리 (참여 중/제출 완료 상태)
   - 정렬 가능한 테이블 (번호, 이름, 상태, 시간)

3. **질문 관리**
   - 질문 목록 (필터: 전체/활성/종료)
   - 검색 기능 (질문 내용 검색)
   - 페이지네이션 (10개씩, 통계 정보 표시)
   - 케밥 메뉴 (CSV 다운로드, 종료/재활성화, 삭제)
   - 일괄 삭제 기능
   - 상태별 빈 화면 메시지:
     - 전체 필터 + 0개: "아직 진행한 의견 받기가 없습니다" + "첫 의견 받기" 버튼
     - 활성 필터 + 0개: "진행 중인 의견 받기가 없습니다"
     - 종료 필터 + 0개: "종료된 의견 받기가 없습니다"
     - 검색 결과 0개: "검색 결과가 없습니다"

4. **QR 패널 접기/펼치기**
   - 공간 효율적 사용
   - 부드러운 애니메이션 (500ms)
   - 주황색 그라디언트 토글 버튼

### 학생 기능
1. **2단계 응답 프로세스**
   - Step 1: 학번 + 이름 입력
   - Step 2: 답변 제출

2. **응답 유형**
   - 텍스트 입력
   - 투표 (단일/복수 선택)
   - 그림 그리기 (향후 지원)

3. **중간 저장**
   - Step 1 완료 시 DB에 `is_in_progress` 상태로 저장
   - 재접속 시 이어서 작성 가능

## 🗄️ 데이터베이스 스키마

### questions 테이블
```sql
- id: uuid (PK)
- teacher_id: uuid
- content: text (질문 내용)
- type: text ('text' | 'poll')
- poll_options: text[] (투표 선택지)
- allow_multiple: boolean (복수 선택 허용)
- is_anonymous: boolean (익명 응답)
- status: text ('active' | 'closed' | 'deleted')
- response_count: integer (응답 수, computed)
- created_at: timestamp
```

### responses 테이블
```sql
- id: uuid (PK)
- question_id: uuid (FK)
- student_number: text (학번)
- nickname: text (이름)
- text_answer: text (주관식 답변)
- poll_answer: text[] (투표 답변)
- drawing_data: text (그림 데이터)
- is_in_progress: boolean (작성 중 상태)
- created_at: timestamp (접속 시간)
- submitted_at: timestamp (제출 시간)
```

## 🎨 UI/UX 특징

### 애니메이션
- **QR 패널 접기/펼치기**: opacity + transform (500ms ease-in-out)
- **투표 결과 막대**: 0.8s ease-out gauge animation
- **로딩 스피너**: 3개 점 순차 bounce (0ms, 150ms, 300ms)
- **모달**: fadeIn + slideUp

### 색상 시스템
- **활성 질문**: 주황색 배경 (`#fff5f0`)
- **토글 스위치**: 주황색 (`#FF8800`)
- **투표 옵션**: 고유 색상 (파랑, 초록, 주황, 빨강, 보라)
- **상태 배지**:
  - 활성: 주황색 (`#FF8800`)
  - 종료: 회색 (`#gray-400`)

### 반응형 디자인
- QR 패널: 30% (펼침) / 48px (접힘)
- 응답 패널: 70% / calc(100% - 64px)
- 로고 크기: 120px (대시보드), 200px (로그인)

### 레이아웃 특징
- **테이블**: `table-fixed` 레이아웃으로 일관된 너비 유지
- **컬럼 너비**: 체크박스(w-16), 상태(w-24), 유형(w-24), 익명(w-28), 응답수(w-28)
- **빈 상태**: 캐릭터 이미지 + 메시지 + 버튼 (중앙 정렬, pt-20)
- **페이지네이션**: 0개일 때 전체 숨김, 1개 이상일 때 통계 정보 표시

## 🔧 주요 기능 구현

### 실시간 업데이트
```typescript
// Supabase Realtime 구독
const channel = supabase
  .channel(`question-${id}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'responses', filter: `question_id=eq.${id}` },
    handleRealtimeUpdate
  )
  .subscribe();
```

### 정렬 기능
```typescript
// 숫자 정렬 (문자열 → 숫자)
const numA = parseInt(a.student_number) || 0;
const numB = parseInt(b.student_number) || 0;
compareValue = numA - numB;
```

### 페이지네이션
```typescript
const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

// 0개일 때 전체 숨김
if (totalItems === 0) return null;
```

### CSV 다운로드
```typescript
// BOM 추가로 한글 깨짐 방지
const BOM = '\uFEFF';
const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
```

### QR 코드 모달 (Portal)
```typescript
// React Portal로 document.body에 렌더링
{isModalOpen && createPortal(
  <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] backdrop-blur-sm">
    {/* 모달 내용 */}
  </div>,
  document.body
)}
```

## 🚀 실행 방법

### 개발 서버
```bash
cd student-feedback
npm install
npm run dev
```

### 환경 변수 (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 빌드
```bash
npm run build
```

## 📝 개발 히스토리

### 최근 UI/UX 개선 (2025-01-18)
1. **테이블 레이아웃 개선**
   - `table-fixed`로 일관된 너비 유지
   - 컬럼별 width 클래스 지정
   - 로딩/빈 상태도 테이블 구조 유지 (colSpan 사용)

2. **페이지네이션 개선**
   - 항상 통계 정보 표시 (전체 N개 중 X-Y개 표시)
   - 0개일 때는 페이지네이션 전체 숨김
   - 1개 이상일 때만 표시

3. **빈 상태 개선**
   - 캐릭터 이미지 추가 (aspect ratio 유지)
   - 상황별 메시지 분리 (전체/활성/종료/검색)
   - 중앙 정렬 및 pt-20으로 아래로 배치

4. **QR 코드 UI 개선**
   - Portal을 사용한 전체화면 모달
   - 질문 영역 강조 (그라디언트 배경 + 보더)
   - QR 코드 크기 증가 (300 → 320)
   - 안내 문구 개선 ("스마트폰 카메라로 QR 코드를 스캔하세요!")

5. **텍스트 일관성**
   - "질문" → "의견 받기"로 통일
   - "활성화된" → "진행 중인"
   - "복사됨!" → "복사 완료!"

6. **케밥 메뉴 개선**
   - `flex flex-col`로 세로 정렬 보장
   - z-index 증가 (z-50)
   - 3개 메뉴 항목 (CSV 다운로드, 종료/재활성화, 삭제)

7. **기타 개선**
   - 토글 스위치 색상 변경 (파란색 → 주황색)
   - Footer 로고 클릭 시 비상교육 사이트 새탭 오픈
   - Footer 링크 볼드 제거, 호버 시 주황색
   - "활동 내역" 버튼 텍스트 위치 조정 (pt-0.5)

### 색상 리뉴얼 (비바샘 브랜딩)
- 기존: 파란색 (`#0066ff`)
- 현재: 주황색 (`#FF8800`)
- 배경: 살구색 베이지 (`#e9e1d9`)

### 초기 UI/UX 개선
1. 흰 바 제거 (투표 게이지)
2. 학생 상태 구분 (참여 중/제출 완료)
3. 정렬 가능한 테이블
4. QR 패널 접기/펼치기
5. 페이지네이션 추가
6. 로딩 스피너 개선 (3점 애니메이션)

### 학생 응답 개선
- 2단계 제출 프로세스
- 중간 저장 기능 (`is_in_progress`)
- 접속 시간 추적 (`created_at`)
- 재접속 시 이어쓰기

## 🎓 사용 시나리오

1. **교사**: 로그인 → "새로 의견 받기" → 질문 생성
2. **교사**: QR 코드 표시 → 학생들에게 공유
3. **학생**: QR 스캔 → 학번/이름 입력 → 답변 작성 → 제출
4. **교사**: 실시간 응답 확인 → 결과 분석
5. **교사**: 질문 종료 → CSV 다운로드

## 🔒 보안

- Supabase RLS (Row Level Security) 설정 필요
- 익명 응답 옵션 제공
- 환경 변수로 API 키 관리

## 🐛 알려진 제한사항

- 그림 그리기 기능은 UI만 구현됨 (저장 미구현)
- 교사 인증은 간단한 이름 입력 방식 (프로토타입)
- 실시간 동시 접속자 수 표시 없음

## 📚 참고

- [Supabase 문서](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
