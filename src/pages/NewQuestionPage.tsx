import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import type { QuestionType } from '../types';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import Toggle from '../components/Toggle';

export default function NewQuestionPage() {
  const navigate = useNavigate();
  const teacher = useAppStore((state) => state.teacher);

  const [type, setType] = useState<QuestionType>('text');
  const [content, setContent] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; title?: string; type?: 'info' | 'success' | 'error' | 'warning' }>({ isOpen: false, message: '' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; message: string; title?: string; type?: 'danger' | 'warning' | 'info'; onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });

  const handleAddOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacher) {
      setAlertModal({
        isOpen: true,
        message: '로그인이 필요합니다.',
        type: 'warning',
      });
      return;
    }

    if (content.trim().length === 0) {
      setAlertModal({
        isOpen: true,
        message: '질문 내용을 입력해주세요.',
        type: 'warning',
      });
      return;
    }

    if (content.length > 100) {
      setAlertModal({
        isOpen: true,
        message: '질문은 최대 100자까지 입력 가능합니다.',
        type: 'warning',
      });
      return;
    }

    if (type === 'poll') {
      const validOptions = pollOptions.filter((opt) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        setAlertModal({
          isOpen: true,
          message: '투표 항목은 최소 2개 이상 입력해주세요.',
          type: 'warning',
        });
        return;
      }
    }

    setLoading(true);

    try {
      // 활성 질문이 있는지 확인
      const { data: activeQuestions, error: checkError } = await supabase
        .from('questions')
        .select('id, content')
        .eq('teacher_id', teacher.id)
        .eq('status', 'active');

      if (checkError) throw checkError;

      if (activeQuestions && activeQuestions.length > 0) {
        setLoading(false);
        setConfirmModal({
          isOpen: true,
          title: '활성 질문 종료',
          message: `현재 활성 중인 질문 "${activeQuestions[0].content}"이(가) 자동으로 종료됩니다. 계속하시겠습니까?`,
          type: 'warning',
          onConfirm: async () => {
            setConfirmModal({ ...confirmModal, isOpen: false });
            await createQuestionWithCloseActive(activeQuestions[0].id);
          },
        });
        return;
      }

      // 질문 생성
      const questionData = {
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        type,
        content: content.trim(),
        status: 'active',
        ...(type === 'poll' && {
          poll_options: pollOptions.filter((opt) => opt.trim().length > 0),
          allow_multiple: allowMultiple,
          is_anonymous: isAnonymous,
        }),
      };

      const { data, error } = await supabase
        .from('questions')
        .insert([questionData])
        .select()
        .single();

      if (error) throw error;

      navigate(`/teacher/question/${data.id}`);
    } catch (error) {
      console.error('Failed to create question:', error);
      setAlertModal({
        isOpen: true,
        title: '생성 실패',
        message: '질문 생성에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const createQuestionWithCloseActive = async (activeQuestionId: string) => {
    if (!teacher) return;

    setLoading(true);

    try {
      // 1. 기존 활성 질문 종료
      await supabase
        .from('questions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', activeQuestionId);

      // 2. 새 질문 생성
      const questionData = {
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        type,
        content: content.trim(),
        status: 'active',
        ...(type === 'poll' && {
          poll_options: pollOptions.filter((opt) => opt.trim().length > 0),
          allow_multiple: allowMultiple,
          is_anonymous: isAnonymous,
        }),
      };

      const { data, error } = await supabase
        .from('questions')
        .insert([questionData])
        .select()
        .single();

      if (error) throw error;

      navigate(`/teacher/question/${data.id}`);
    } catch (error) {
      console.error('Failed to create question:', error);
      setAlertModal({
        isOpen: true,
        title: '생성 실패',
        message: '질문 생성에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e9e1d9]">
      {/* Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      <header className="section-header">
        <div className="container-main py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">새로 의견 받기</h1>
            <button onClick={() => navigate('/teacher/dashboard')} className="text-sm text-gray-600 hover:text-gray-900">
              취소
            </button>
          </div>
        </div>
      </header>

      <main className="container-main py-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">질문 유형</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`radio-card ${type === 'text' ? 'selected' : ''}`}>
                <input type="radio" value="text" checked={type === 'text'} onChange={(e) => setType(e.target.value as QuestionType)} className="sr-only" />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${type === 'text' ? 'border-[#ff7031]' : 'border-gray-300'}`}>
                    {type === 'text' && <div className="w-3 h-3 rounded-full bg-[#ff7031]"></div>}
                  </div>
                  <span className="font-medium text-gray-900">주관식</span>
                </div>
              </label>
              <label className={`radio-card ${type === 'poll' ? 'selected' : ''}`}>
                <input type="radio" value="poll" checked={type === 'poll'} onChange={(e) => setType(e.target.value as QuestionType)} className="sr-only" />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${type === 'poll' ? 'border-[#ff7031]' : 'border-gray-300'}`}>
                    {type === 'poll' && <div className="w-3 h-3 rounded-full bg-[#ff7031]"></div>}
                  </div>
                  <span className="font-medium text-gray-900">투표</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              질문 내용 <span className="text-gray-500">({content.length}/100자)</span>
            </label>
            <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="질문 내용을 입력하세요" maxLength={100} rows={3} className="textarea-base" required />
          </div>

          {/* 투표 옵션 */}
          {type === 'poll' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">투표 항목 (최대 5개)</label>
                {pollOptions.length < 5 && (
                  <button type="button" onClick={handleAddOption} className="text-sm text-[#ff7031] hover:underline font-medium">
                    + 항목 추가
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`항목 ${index + 1}`} maxLength={100} className="input-base" required />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => handleRemoveOption(index)} className="text-gray-400 hover:text-red-600 px-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-3 border-t border-gray-200">
                <Toggle
                  checked={allowMultiple}
                  onChange={setAllowMultiple}
                  label="복수 선택 허용"
                />
                <Toggle
                  checked={isAnonymous}
                  onChange={setIsAnonymous}
                  label="익명 투표"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={() => navigate('/teacher/dashboard')} className="btn-secondary" disabled={loading}>
              취소
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '생성 중...' : '질문 생성'}
            </button>
          </div>
          </form>
        </div>
      </main>
    </div>
  );
}
