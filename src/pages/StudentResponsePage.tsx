import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Question } from '../types';
import DrawingCanvas from '../components/DrawingCanvas';
import AlertModal from '../components/AlertModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StudentResponsePage() {
  const { id } = useParams<{ id: string }>();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<'info' | 'answer'>('info');
  const [responseId, setResponseId] = useState<string | null>(null);

  // Form state
  const [studentNumber, setStudentNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDrawingExpanded, setIsDrawingExpanded] = useState(false);

  // Modal state
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; title?: string; type?: 'info' | 'success' | 'error' | 'warning' }>({ isOpen: false, message: '' });

  useEffect(() => {
    if (id) {
      loadQuestion();
    }
  }, [id]);

  const loadQuestion = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.status !== 'active') {
        setAlertModal({
          isOpen: true,
          title: '질문 종료',
          message: '이 질문은 종료되었습니다.',
          type: 'warning',
        });
        return;
      }

      setQuestion(data);
    } catch (error) {
      console.error('Failed to load question:', error);
      setAlertModal({
        isOpen: true,
        title: '오류',
        message: '질문을 불러올 수 없습니다.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionToggle = (option: string) => {
    if (!question) return;

    if (question.allow_multiple) {
      setSelectedOptions((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    } else {
      setSelectedOptions([option]);
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question) return;

    // Validation
    if (!question.is_anonymous) {
      if (!studentNumber.trim() || !nickname.trim()) {
        setAlertModal({
          isOpen: true,
          message: '번호와 닉네임을 입력해주세요.',
          type: 'warning',
        });
        return;
      }

      // Check for duplicate submission
      const { data: existing, error: checkError } = await supabase
        .from('responses')
        .select('id, is_in_progress')
        .eq('question_id', id)
        .eq('student_number', studentNumber.trim())
        .eq('nickname', nickname.trim())
        .maybeSingle();

      if (checkError) {
        console.error('Check error:', checkError);
      }

      if (existing) {
        if (existing.is_in_progress) {
          // 이미 입력 중인 상태면 접속 시간 업데이트하고 그 레코드 사용
          await supabase
            .from('responses')
            .update({ created_at: new Date().toISOString() })
            .eq('id', existing.id);

          setResponseId(existing.id);
          setStep('answer');
          return;
        } else {
          setAlertModal({
            isOpen: true,
            title: '중복 제출',
            message: '이미 제출한 응답이 있습니다.',
            type: 'warning',
          });
          return;
        }
      }
    }

    // Create "in_progress" response record
    try {
      const { data, error } = await supabase
        .from('responses')
        .insert([{
          question_id: id,
          student_number: question.is_anonymous ? 'anonymous' : studentNumber.trim(),
          nickname: question.is_anonymous ? 'anonymous' : nickname.trim(),
          is_in_progress: true,
        }])
        .select()
        .single();

      if (error) throw error;

      setResponseId(data.id);
      setStep('answer');
    } catch (error) {
      console.error('Failed to create in-progress response:', error);
      setAlertModal({
        isOpen: true,
        title: '오류',
        message: '진행 중 오류가 발생했습니다.',
        type: 'error',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question || !responseId) return;

    // Validation
    if (question.type === 'text') {
      if (!textAnswer.trim() && !drawingData) {
        setAlertModal({
          isOpen: true,
          message: '답변 또는 그림을 작성해주세요.',
          type: 'warning',
        });
        return;
      }
    } else if (question.type === 'poll') {
      if (selectedOptions.length === 0) {
        setAlertModal({
          isOpen: true,
          message: '항목을 선택해주세요.',
          type: 'warning',
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      // Update existing response record
      const updateData: any = {
        is_in_progress: false,
        submitted_at: new Date().toISOString(),
      };

      if (question.type === 'text') {
        if (textAnswer.trim()) {
          updateData.text_answer = textAnswer.trim();
        }
        if (drawingData) {
          updateData.drawing_data = drawingData;
        }
      } else if (question.type === 'poll') {
        updateData.poll_answer = selectedOptions;
      }

      const { error } = await supabase
        .from('responses')
        .update(updateData)
        .eq('id', responseId);

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit response:', error);
      setAlertModal({
        isOpen: true,
        title: '제출 실패',
        message: '응답 제출에 실패했습니다. 다시 시도해주세요.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setStep('info');
    setResponseId(null);
    setStudentNumber('');
    setNickname('');
    setTextAnswer('');
    setSelectedOptions([]);
    setDrawingData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e9e1d9] flex items-center justify-center p-4">
        <LoadingSpinner size="lg" message="불러오는 중..." />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-[#e9e1d9] flex items-center justify-center p-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">질문을 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#e9e1d9] flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">제출 완료</h2>
          <p className="text-gray-600 mb-6">응답이 전송되었습니다</p>
          <button onClick={handleReset} className="btn-primary w-full">
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e9e1d9]">
      {/* Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />

      {/* Question Header - Fixed at top */}
      <div className="bg-white border-b-2 border-[#ff7031] sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="text-center">
            <div className="mb-2">
              {question.type === 'text' ? (
                <span className="badge-type-text text-sm">주관식</span>
              ) : (
                <span className="badge-type-poll text-sm">투표</span>
              )}
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
              {question.content}
            </h1>
          </div>
        </div>
      </div>

      {/* Step 1: Student Info */}
      {step === 'info' && (
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="card p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">학생 정보 입력</h2>
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              {!question.is_anonymous ? (
                <>
                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
                      번호 <span className="text-gray-500">(최대 3자)</span>
                    </label>
                    <input
                      type="text"
                      id="number"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      placeholder="예: 5"
                      maxLength={3}
                      className="input-base"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                      닉네임 <span className="text-gray-500">(최대 10자)</span>
                    </label>
                    <input
                      type="text"
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="예: 홍길동"
                      maxLength={10}
                      className="input-base"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  익명 응답입니다
                </div>
              )}
              <button type="submit" className="btn-primary w-full text-base py-3.5 mt-6">
                다음
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Answer Form */}
      {step === 'answer' && (
        <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
          <div className="card p-6 shadow-sm">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="text-sm text-gray-600">
                {!question.is_anonymous && (
                  <span>{studentNumber}번 {nickname}</span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pb-4">
              {question.type === 'text' && (
                <>
                  <div>
                    <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                      텍스트 답변 <span className="text-gray-500">({textAnswer.length}/100자)</span>
                    </label>
                    <textarea
                      id="answer"
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="답변을 입력하세요"
                      maxLength={100}
                      rows={4}
                      className="textarea-base"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsDrawingExpanded(!isDrawingExpanded)}
                      className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <span>그림 그리기</span>
                      <svg
                        className={`w-5 h-5 transition-transform duration-200 ${isDrawingExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isDrawingExpanded && (
                      <div className="mt-2">
                        <DrawingCanvas onDrawingChange={setDrawingData} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {question.type === 'poll' && question.poll_options && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {question.allow_multiple ? '항목 선택 (복수 선택 가능)' : '항목 선택'}
                  </label>
                  <div className="space-y-2">
                    {question.poll_options.map((option, idx) => (
                      <label key={idx} className={`radio-card ${selectedOptions.includes(option) ? 'selected' : ''}`}>
                        <input
                          type={question.allow_multiple ? 'checkbox' : 'radio'}
                          checked={selectedOptions.includes(option)}
                          onChange={() => handleOptionToggle(option)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 ${question.allow_multiple ? 'rounded' : 'rounded-full'} border-2 flex items-center justify-center ${selectedOptions.includes(option) ? 'border-[#ff7031] bg-[#ff7031]' : 'border-gray-300'}`}>
                            {selectedOptions.includes(option) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{option}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full text-base py-3.5">
                {submitting ? '제출 중...' : '제출하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
