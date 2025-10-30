# Vivasam QR - Real-time Student Feedback System

QR 코드 기반 실시간 학생 응답 수집 시스템입니다. 교사는 질문을 생성하고 QR 코드를 통해 학생들의 응답을 실시간으로 수집하고 시각화할 수 있습니다.

## Features

### 교사 기능
- **질문 관리**: 객관식, 주관식, 그림 그리기 타입의 질문 생성
- **실시간 대시보드**: 질문 목록 및 응답 현황 실시간 모니터링
- **QR 코드 생성**: 각 질문마다 고유한 QR 코드 자동 생성
- **응답 시각화**:
  - 객관식: 실시간 차트
  - 주관식: 워드 클라우드
  - 그림: 학생별 그림 갤러리
- **질문 상태 관리**: Active/Closed 상태 토글

### 학생 기능
- **간편한 접근**: QR 코드 스캔만으로 즉시 응답 가능
- **다양한 응답 타입**:
  - 객관식 선택
  - 텍스트 입력
  - 캔버스 드로잉 (모바일 최적화)
- **실시간 피드백**: 응답 즉시 반영

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Realtime)
- **Routing**: React Router v7
- **Charts**: Recharts
- **QR Code**: qrcode.react

## Project Structure

```
student-feedback/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── QRCodeDisplay.tsx
│   │   ├── DrawingCanvas.tsx
│   │   ├── WordCloudModal.tsx
│   │   └── ...
│   ├── pages/            # Route pages
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── NewQuestionPage.tsx
│   │   ├── QuestionDetailPage.tsx
│   │   └── StudentResponsePage.tsx
│   ├── lib/              # Utilities and configuration
│   │   ├── supabase.ts   # Supabase client
│   │   ├── store.ts      # Zustand store
│   │   └── utils.ts
│   └── App.tsx
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/suhmieum/vivasam_qr.git
cd vivasam_qr/student-feedback
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

## Database Schema

The application uses Supabase with the following main tables:

- `teachers`: Teacher accounts
- `questions`: Question definitions (type, content, options)
- `responses`: Student responses
- `drawings`: Canvas drawing data (for drawing-type questions)

Realtime subscriptions are used for live updates on the dashboard and question detail pages.

## Key Features Implementation

### Mobile Drawing Canvas
- Touch-optimized coordinate mapping for accurate drawing on scaled canvases
- Prevents scrolling during drawing with `preventDefault`
- Line smoothing for better visual quality

### Realtime Updates
- Supabase Realtime channels for instant response updates
- Automatic UI refresh when students submit answers
- Connection status monitoring

### Word Cloud
- Dynamic text response visualization
- Font size based on frequency
- Modal display for better readability

## Browser Support

- Chrome/Edge (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Private project for Vivasam

## Author

suhmieum
