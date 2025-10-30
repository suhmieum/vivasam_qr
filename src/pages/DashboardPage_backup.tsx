import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import type { Question } from '../types';

type FilterType = 'all' | 'active' | 'closed';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { teacher, logout } = useAppStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [teacher]);

  const loadQuestions = async () => {
    if (!teacher) return;

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('teacher_id', teacher.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: 'deleted' })
        .eq('id', id);

      if (error) throw error;
      loadQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('삭제 실패');
    }
  };

  const handleReopenQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: 'active', closed_at: null })
        .eq('id', id);

      if (error) throw error;
      loadQuestions();
    } catch (error) {
      console.error('Failed to reopen question:', error);
      alert('재활성화 실패');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'all') return true;
    return q.status === filter;
  });

  const activeQuestion = questions.find((q) => q.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">학생 의견 받기</h1>
            <span className="text-gray-600">안녕하세요, {teacher?.name} 선생님</span>
          </div>
          <div className="flex items-center gap-4">
            {activeQuestion && (
              <button
                onClick={() => navigate(`/teacher/question/${activeQuestion.id}`)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                활성 질문 보기
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/teacher/question/new')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            새 질문 만들기
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">필터:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="closed">종료</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">아직 질문이 없습니다</div>
            <button
              onClick={() => navigate('/teacher/question/new')}
              className="text-blue-600 hover:text-blue-700"
            >
              첫 질문 만들기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          question.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {question.status === 'active' ? '활성' : '종료'}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {question.type === 'text' ? '주관식' : '투표'}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      {question.content}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {new Date(question.created_at).toLocaleString('ko-KR')}
                      {question.closed_at && (
                        <span> ~ {new Date(question.closed_at).toLocaleString('ko-KR')} 종료</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/teacher/question/${question.id}`)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      상세보기
                    </button>
                    {question.status === 'closed' && (
                      <button
                        onClick={() => handleReopenQuestion(question.id)}
                        className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      >
                        다시 열기
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
