export type QuestionType = 'text' | 'poll';
export type QuestionStatus = 'active' | 'closed' | 'deleted';

export interface Teacher {
  id: string;
  name: string;
}

export interface Question {
  id: string;
  teacher_id: string;
  teacher_name: string;
  type: QuestionType;
  content: string;
  poll_options?: string[];
  allow_multiple?: boolean;
  is_anonymous?: boolean;
  status: QuestionStatus;
  created_at: string;
  closed_at?: string;
}

export interface Response {
  id: string;
  question_id: string;
  student_number: string;
  nickname: string;
  text_answer?: string;
  drawing_data?: string;
  poll_answer?: string[];
  submitted_at: string;
  created_at?: string;
  is_in_progress?: boolean;
}
