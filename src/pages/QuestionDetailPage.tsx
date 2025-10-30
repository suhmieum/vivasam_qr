import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import type { Question, Response } from '../types';
import QRCodeDisplay from '../components/QRCodeDisplay';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import WordCloudModal from '../components/WordCloudModal';

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; title?: string; type?: 'info' | 'success' | 'error' | 'warning' }>({ isOpen: false, message: '' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; message: string; title?: string; type?: 'danger' | 'warning' | 'info'; onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type?: 'success' | 'info' | 'error' }>({ isOpen: false, message: '' });
  const [showStudentListModal, setShowStudentListModal] = useState(false);
  const [showWordCloudModal, setShowWordCloudModal] = useState(false);

  // Table sorting state
  const [sortField, setSortField] = useState<'number' | 'name' | 'status' | 'time'>('number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // QR panel collapse state
  const [isQRPanelCollapsed, setIsQRPanelCollapsed] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuestion();
      loadResponses();
      const cleanup = subscribeToResponses();
      return cleanup;
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
      setQuestion(data);
    } catch (error) {
      console.error('Failed to load question:', error);
      setAlertModal({
        isOpen: true,
        message: '질문을 불러올 수 없습니다.',
        type: 'error',
      });
      setTimeout(() => navigate('/teacher/dashboard'), 1500);
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('question_id', id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Failed to load responses:', error);
    }
  };

  const subscribeToResponses = () => {
    console.log('🔴 Realtime 구독 시작:', id);

    const channel = supabase
      .channel(`responses:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `question_id=eq.${id}`,
        },
        (payload) => {
          console.log('✅ 새 응답 INSERT:', payload.new);
          setResponses((prev) => [payload.new as Response, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'responses',
          filter: `question_id=eq.${id}`,
        },
        (payload) => {
          console.log('🔄 응답 UPDATE:', payload.new);
          setResponses((prev) =>
            prev.map((r) => r.id === payload.new.id ? payload.new as Response : r)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'responses',
          filter: `question_id=eq.${id}`,
        },
        (payload) => {
          console.log('🗑️ 응답 삭제:', payload.old);
          setResponses((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime 상태:', status);
      });

    return () => {
      console.log('🔌 Realtime 구독 해제:', id);
      supabase.removeChannel(channel);
    };
  };

  const handleCloseQuestion = () => {
    setConfirmModal({
      isOpen: true,
      title: '질문 종료',
      message: '질문을 종료하시겠습니까? 학생들은 더 이상 응답할 수 없습니다.',
      type: 'warning',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('questions')
            .update({ status: 'closed', closed_at: new Date().toISOString() })
            .eq('id', id);

          if (error) throw error;
          loadQuestion();
          setAlertModal({ isOpen: true, message: '질문이 종료되었습니다.', type: 'success' });
        } catch (error) {
          console.error('Failed to close question:', error);
          setAlertModal({ isOpen: true, message: '질문 종료에 실패했습니다.', type: 'error' });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handleDeleteResponse = (responseId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '응답 삭제',
      message: '이 응답을 삭제하시겠습니까?',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('responses')
            .delete()
            .eq('id', responseId);

          if (error) throw error;

          // 삭제 성공 시 즉시 UI 업데이트
          setResponses((prev) => prev.filter((r) => r.id !== responseId));
        } catch (error) {
          console.error('Failed to delete response:', error);
          setAlertModal({ isOpen: true, message: '응답 삭제에 실패했습니다.', type: 'error' });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const getStudentUrl = () => {
    return `${window.location.origin}/student/q/${id}`;
  };

  const handleReopenQuestion = async () => {
    try {
      // 현재 활성 질문이 있는지 확인
      const { data: activeQuestions, error: checkError } = await supabase
        .from('questions')
        .select('id, content')
        .eq('teacher_id', question?.teacher_id)
        .eq('status', 'active');

      if (checkError) throw checkError;

      if (activeQuestions && activeQuestions.length > 0) {
        // 활성 질문이 있으면 경고 모달
        setConfirmModal({
          isOpen: true,
          title: '질문 다시 열기',
          message: `현재 활성 중인 질문 "${activeQuestions[0].content}"이(가) 자동으로 종료됩니다. 계속하시겠습니까?`,
          type: 'warning',
          onConfirm: async () => {
            try {
              // 1. 기존 활성 질문 종료
              await supabase
                .from('questions')
                .update({ status: 'closed', closed_at: new Date().toISOString() })
                .eq('id', activeQuestions[0].id);

              // 2. 현재 질문 활성화
              const { error } = await supabase
                .from('questions')
                .update({ status: 'active', closed_at: null })
                .eq('id', id);

              if (error) throw error;
              loadQuestion();
              setAlertModal({ isOpen: true, message: '질문이 다시 활성화되었습니다.', type: 'success' });
            } catch (error) {
              console.error('Failed to reopen question:', error);
              setAlertModal({ isOpen: true, message: '재활성화에 실패했습니다.', type: 'error' });
            }
            setConfirmModal({ ...confirmModal, isOpen: false });
          },
        });
      } else {
        // 활성 질문이 없으면 바로 활성화
        setConfirmModal({
          isOpen: true,
          title: '질문 다시 열기',
          message: '이 질문을 다시 활성화하시겠습니까?',
          type: 'info',
          onConfirm: async () => {
            try {
              const { error } = await supabase
                .from('questions')
                .update({ status: 'active', closed_at: null })
                .eq('id', id);

              if (error) throw error;
              loadQuestion();
              setAlertModal({ isOpen: true, message: '질문이 다시 활성화되었습니다.', type: 'success' });
            } catch (error) {
              console.error('Failed to reopen question:', error);
              setAlertModal({ isOpen: true, message: '재활성화에 실패했습니다.', type: 'error' });
            }
            setConfirmModal({ ...confirmModal, isOpen: false });
          },
        });
      }
    } catch (error) {
      console.error('Failed to check active questions:', error);
      setAlertModal({ isOpen: true, message: '활성 질문 확인에 실패했습니다.', type: 'error' });
    }
  };

  const getPollResults = () => {
    if (!question || question.type !== 'poll' || !question.poll_options) return [];

    const counts: Record<string, number> = {};
    const students: Record<string, Array<{ number: string; nickname: string }>> = {};

    question.poll_options.forEach((option) => {
      counts[option] = 0;
      students[option] = [];
    });

    // 제출 완료된 응답만 카운트
    responses
      .filter(response => !response.is_in_progress)
      .forEach((response) => {
        if (response.poll_answer) {
          response.poll_answer.forEach((answer) => {
            if (counts[answer] !== undefined) {
              counts[answer]++;
              students[answer].push({
                number: response.student_number,
                nickname: response.nickname,
              });
            }
          });
        }
      });

    return question.poll_options.map((option) => ({
      name: option,
      votes: counts[option],
      students: students[option],
    }));
  };


  const handleSort = (field: 'number' | 'name' | 'status' | 'time') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedResponses = () => {
    const sorted = [...responses];

    sorted.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'number':
          const numA = parseInt(a.student_number) || 0;
          const numB = parseInt(b.student_number) || 0;
          compareValue = numA - numB;
          break;
        case 'name':
          compareValue = a.nickname.localeCompare(b.nickname);
          break;
        case 'status':
          const statusA = a.is_in_progress ? 1 : 0;
          const statusB = b.is_in_progress ? 1 : 0;
          compareValue = statusA - statusB;
          break;
        case 'time':
          const timeA = new Date(a.created_at || a.submitted_at).getTime();
          const timeB = new Date(b.created_at || b.submitted_at).getTime();
          compareValue = timeA - timeB;
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  };

  const downloadCSV = () => {
    if (!question) return;

    // CSV 헤더 생성
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Korean support

    if (question.type === 'text') {
      csvContent += '번호,닉네임,텍스트 답변,그림 여부,제출 시간\n';

      responses.forEach((response) => {
        const row = [
          response.student_number,
          response.nickname,
          `"${(response.text_answer || '').replace(/"/g, '""')}"`, // CSV escape
          response.drawing_data ? 'O' : 'X',
          new Date(response.submitted_at).toLocaleString('ko-KR'),
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (question.type === 'poll') {
      csvContent += '번호,닉네임,선택 항목,제출 시간\n';

      responses.forEach((response) => {
        const row = [
          response.student_number,
          response.nickname,
          `"${(response.poll_answer || []).join(', ')}"`,
          new Date(response.submitted_at).toLocaleString('ko-KR'),
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    // 파일 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `응답_${question.content.slice(0, 20)}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e9e1d9] flex items-center justify-center">
        <LoadingSpinner size="lg" message="불러오는 중..." />
      </div>
    );
  }

  if (!question) return null;

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
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
      <WordCloudModal
        isOpen={showWordCloudModal}
        onClose={() => setShowWordCloudModal(false)}
        responses={responses
          .filter(r => !r.is_in_progress && r.text_answer)
          .map(r => ({
            text: r.text_answer || '',
            studentNumber: r.student_number,
            nickname: r.nickname,
          }))}
        questionContent={question.content}
        isAnonymous={question.is_anonymous || false}
      />

      {/* Student List Modal */}
      {showStudentListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">참여 학생 목록</h3>
              <button
                onClick={() => setShowStudentListModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable Table */}
            <div className="p-6 overflow-y-auto">
              <div className="mb-4">
                <span className="text-sm text-gray-600">총 {responses.length}명 참여</span>
              </div>

              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th
                      onClick={() => handleSort('number')}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        번호
                        {sortField === 'number' && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {sortDirection === 'asc' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('name')}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        이름
                        {sortField === 'name' && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {sortDirection === 'asc' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        상태
                        {sortField === 'status' && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {sortDirection === 'asc' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('time')}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        접속 시간
                        {sortField === 'time' && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {sortDirection === 'asc' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            )}
                          </svg>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getSortedResponses().map((response) => (
                      <tr key={response.id} className={`hover:bg-gray-50 transition ${response.is_in_progress ? 'bg-yellow-50' : ''}`}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {response.student_number}번
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {response.nickname}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {response.is_in_progress ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                              참여 중
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                              제출 완료
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(response.created_at || response.submitted_at)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowStudentListModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top Row: Back button + Actions */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="text-base text-gray-600 hover:text-gray-900 transition flex items-center gap-1 pt-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              활동 내역
            </button>

            <div className="flex items-center gap-2 pt-1">
              {responses.length > 0 && (
                <>
                  <button
                    onClick={() => setShowStudentListModal(true)}
                    className="px-3 py-2 text-xs bg-[#ff7031] hover:bg-[#e65a20] text-white rounded-md transition flex items-center gap-1.5 font-semibold"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    학생 목록
                    <span className="ml-0.5 px-1.5 py-px bg-[#e65a20] rounded text-xs font-bold">
                      {responses.length}
                    </span>
                  </button>
                  <button
                    onClick={downloadCSV}
                    className="px-3 py-2 text-xs bg-[#ff7031] hover:bg-[#e65a20] text-white rounded-md transition flex items-center gap-1.5 font-semibold"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    CSV
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Main Content: 3:7 Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-200px)] relative">
          {/* Collapse/Expand Button - Outside the panel */}
          <button
            onClick={() => setIsQRPanelCollapsed(!isQRPanelCollapsed)}
            className={`absolute top-5 z-20 w-10 h-10 bg-gradient-to-br from-[#FF8800] to-[#e67700] text-white rounded-lg shadow-xl border-2 border-white flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all duration-300 ${
              isQRPanelCollapsed ? 'left-[22px]' : 'left-[calc(30%-28px)]'
            }`}
            title={isQRPanelCollapsed ? 'QR 펼치기' : 'QR 접기'}
          >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isQRPanelCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
          </button>

          {/* Left Panel - QR Code (Collapsible) */}
          <div
            className={`bg-white rounded-lg shadow flex flex-col relative overflow-hidden transition-all duration-300 ease-in-out ${
              isQRPanelCollapsed ? 'w-12' : 'w-[30%]'
            }`}
          >
            {/* Collapsed State - Vertical Text/Icon */}
            {isQRPanelCollapsed && (
              <div className="flex flex-col items-center justify-center h-full py-8 space-y-4">
                <svg className="w-6 h-6 text-[#FF8800]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <div className="text-[#FF8800] text-xs font-bold writing-mode-vertical-rl" style={{ writingMode: 'vertical-rl' }}>
                  QR
                </div>
              </div>
            )}

            {/* Expanded Content */}
            {!isQRPanelCollapsed && (
              <div className="p-6 flex flex-col flex-1">
                {/* QR Code Area with Dimmed Overlay when Closed */}
                <div className="relative flex-1 flex flex-col items-center justify-center mb-3">
                  <QRCodeDisplay url={getStudentUrl()} questionContent={question.content} />

                  {question.status === 'closed' && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center p-6">
                        <svg className="w-16 h-16 text-white mx-auto mb-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-white font-medium mb-4">종료된 질문입니다</p>
                        <button
                          onClick={handleReopenQuestion}
                          className="btn-success text-sm py-2.5 px-5 shadow-lg hover:shadow-xl"
                        >
                          다시 활성화
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Student Instructions */}
                  {question.status === 'active' && (
                    <div className="mt-8 w-full bg-gray-100 rounded-lg p-4">
                      <p className="text-lg font-bold text-gray-800 text-center mb-3">
                        스마트폰 카메라로 스캔하세요
                      </p>
                      <div className="space-y-1.5 text-sm text-gray-600">
                        <p className="flex items-start gap-2">
                          <span className="font-bold text-gray-800 flex-shrink-0">1.</span>
                          <span>카메라 앱 열기</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="font-bold text-gray-800 flex-shrink-0">2.</span>
                          <span>QR 코드에 카메라 맞추기</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="font-bold text-gray-800 flex-shrink-0">3.</span>
                          <span>나타나는 링크 누르기</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Responses (Flexible Width) */}
          <div className={`bg-white rounded-lg shadow p-6 overflow-y-auto transition-all duration-300 ease-in-out ${
            isQRPanelCollapsed ? 'w-[calc(100%-72px)]' : 'w-[70%]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">실시간 응답</h3>
              <div className="flex items-center gap-2">
                {question.type === 'text' && responses.filter(r => !r.is_in_progress && r.text_answer).length > 0 && (
                  <button
                    onClick={() => setShowWordCloudModal(true)}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    답변 모아보기
                  </button>
                )}
                {question.status === 'active' && (
                  <button
                    onClick={handleCloseQuestion}
                    className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    의견 받기 종료
                  </button>
                )}
              </div>
            </div>

            {/* Question Content */}
            <div className="mb-6 p-4 bg-[#fff5f0] border-l-4 border-[#ff7031] rounded">
              <p className="text-base font-medium text-gray-900">{question.content}</p>
            </div>

            {/* Poll Results Chart */}
            {question.type === 'poll' && (
              <div className="mb-6 p-6 bg-gradient-to-br from-[#fff5f0] to-[#ffe8dc] rounded-xl border border-[#ffcdb8]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900">투표 결과</h4>
                  <span className="text-sm text-gray-600">총 {responses.filter(r => !r.is_in_progress).length}명 제출</span>
                </div>

                <div className="space-y-4">
                  {getPollResults().sort((a, b) => b.votes - a.votes).map((item, idx) => {
                    const maxVotes = Math.max(...getPollResults().map(r => r.votes));
                    const totalVotes = responses.filter(r => !r.is_in_progress).length;
                    const powerPercent = maxVotes > 0 ? (item.votes / maxVotes) * 100 : 0;
                    const votePercent = totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0;

                    // 선택지별 고유 색상 (순서대로 1~5번)
                    const colorPalette = [
                      '#3b82f6, #2563eb', // 1번: 파랑
                      '#10b981, #059669', // 2번: 초록
                      '#f59e0b, #d97706', // 3번: 주황
                      '#ef4444, #dc2626', // 4번: 빨강
                      '#8b5cf6, #7c3aed', // 5번: 보라
                    ];

                    const getBarColor = () => {
                      return colorPalette[idx % colorPalette.length];
                    };

                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800">{item.name}</span>
                          <span className="text-2xl font-bold text-gray-900">{item.votes}</span>
                        </div>
                        <div className="relative h-10 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out flex items-center px-4 poll-bar-animate"
                            style={{
                              width: `${powerPercent}%`,
                              background: `linear-gradient(90deg, ${getBarColor()})`,
                              animation: 'gaugeGrow 0.8s ease-out'
                            }}
                          >
                            {powerPercent > 15 && (
                              <span className="text-white font-bold text-sm drop-shadow-md">
                                {item.votes}명 ({votePercent}%)
                              </span>
                            )}
                          </div>
                        </div>
                        {!question.is_anonymous && item.students.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.students.map((student, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs border border-gray-200"
                              >
                                {student.number}번 {student.nickname}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Responses List */}
            {responses.filter(r => !r.is_in_progress).length === 0 ? (
              <div className="text-center py-24">
                <img
                  src="/question.png"
                  alt="응답 없음"
                  className="max-w-[180px] h-auto mx-auto mb-4 opacity-80"
                />
                <p className="text-gray-500 text-base">아직 응답이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {responses.filter(r => !r.is_in_progress).map((response) => (
                  <div
                    key={response.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    {/* Header: 학생 정보 + 시간 + 삭제 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {!question.is_anonymous && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-sm">
                            <span className="font-semibold text-gray-700">{response.student_number}번</span>
                            <span className="text-gray-600">{response.nickname}</span>
                          </span>
                        )}
                        {question.is_anonymous && (
                          <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">익명</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(response.submitted_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteResponse(response.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        삭제
                      </button>
                    </div>

                    {/* Text Answer */}
                    {response.text_answer && (
                      <div className="text-gray-900 text-base font-semibold leading-relaxed">{response.text_answer}</div>
                    )}

                    {/* Poll Answer */}
                    {response.poll_answer && (
                      <div className="text-gray-900 text-base font-semibold leading-relaxed">
                        {response.poll_answer.join(', ')}
                      </div>
                    )}

                    {/* Drawing */}
                    {response.drawing_data && (
                      <div className="mt-3">
                        <img
                          src={response.drawing_data}
                          alt="학생 그림"
                          className="max-w-full h-auto border border-gray-200 rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
