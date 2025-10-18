import { createClient } from '@supabase/supabase-js';

// 환경 변수 설정 (나중에 .env 파일로 이동)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
