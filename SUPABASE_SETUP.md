# Supabase 설정 가이드

이 프로젝트를 실행하기 위해서는 Supabase 데이터베이스를 설정해야 합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정을 만듭니다
2. "New Project" 버튼을 클릭하여 새 프로젝트를 생성합니다
3. 프로젝트 이름, 데이터베이스 비밀번호, 지역을 설정합니다

## 2. 데이터베이스 테이블 생성

Supabase 대시보드에서 SQL Editor로 이동하여 아래 SQL을 실행합니다:

```sql
-- Questions 테이블 생성
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'poll')),
  content TEXT NOT NULL CHECK (char_length(content) <= 100),
  poll_options TEXT[],
  allow_multiple BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Responses 테이블 생성
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_number TEXT NOT NULL,
  nickname TEXT NOT NULL,
  text_answer TEXT CHECK (text_answer IS NULL OR char_length(text_answer) <= 100),
  drawing_data TEXT,
  poll_answer TEXT[],
  is_in_progress BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(question_id, student_number, nickname)
);

-- 인덱스 생성
CREATE INDEX idx_questions_teacher_id ON questions(teacher_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_responses_question_id ON responses(question_id);
CREATE INDEX idx_responses_submitted_at ON responses(submitted_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Questions 테이블 정책
CREATE POLICY "Questions are viewable by everyone"
  ON questions FOR SELECT
  USING (true);

CREATE POLICY "Teachers can insert questions"
  ON questions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can update their own questions"
  ON questions FOR UPDATE
  USING (true);

CREATE POLICY "Teachers can delete their own questions"
  ON questions FOR DELETE
  USING (true);

-- Responses 테이블 정책
CREATE POLICY "Responses are viewable by everyone"
  ON responses FOR SELECT
  USING (true);

CREATE POLICY "Students can insert responses"
  ON responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Students can update responses"
  ON responses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete responses"
  ON responses FOR DELETE
  USING (true);
```

## 3. Realtime 활성화

1. Supabase 대시보드에서 Database → Replication으로 이동합니다
2. `responses` 테이블에 대해 Realtime을 활성화합니다

## 4. 환경 변수 설정

1. Supabase 대시보드에서 Settings → API로 이동합니다
2. `Project URL`과 `anon public` 키를 확인합니다
3. 프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력합니다:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 5. 테스트

설정이 완료되면 애플리케이션을 실행하여 테스트합니다:

```bash
npm run dev
```

## 참고사항

- **보안**: 현재 RLS 정책은 테스트용으로 모든 작업을 허용합니다. 프로덕션에서는 더 엄격한 정책을 설정해야 합니다.
- **데이터 보관**: 응답 데이터는 무제한 보관됩니다. 필요시 자동 삭제 정책을 추가하세요.
- **Realtime 제한**: Supabase Free tier는 200 동시 연결까지 지원합니다.
