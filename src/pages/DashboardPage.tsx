import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import type { Question, Response } from '../types';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import Pagination from '../components/Pagination';
import Footer from '../components/Footer';

type FilterType = 'all' | 'active' | 'closed';

interface QuestionWithCount extends Question {
  response_count: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { teacher, logout } = useAppStore();
  const [questions, setQuestions] = useState<QuestionWithCount[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type?: 'success' | 'info' | 'error' }>({ isOpen: false, message: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'status' | 'content' | 'type' | 'response_count' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modal states
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; title?: string; type?: 'info' | 'success' | 'error' | 'warning' }>({ isOpen: false, message: '' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; message: string; title?: string; type?: 'danger' | 'warning' | 'info'; onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });

  useEffect(() => {
    loadQuestions();
  }, [teacher]);

  const loadQuestions = async () => {
    if (!teacher) return;
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*, responses(count)')
        .eq('teacher_id', teacher.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 응답 수를 포함한 데이터로 변환
      const questionsWithCount = (data || []).map((q: any) => ({
        ...q,
        response_count: q.responses?.[0]?.count || 0,
        responses: undefined, // responses 필드 제거
      }));

      setQuestions(questionsWithCount);
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

  const handleDeleteQuestion = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: '질문 삭제',
      message: '정말 이 질문을 삭제하시겠습니까?',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('questions').update({ status: 'deleted' }).eq('id', id);
          if (error) throw error;
          loadQuestions();
          setAlertModal({ isOpen: true, message: '질문이 삭제되었습니다.', type: 'success' });
        } catch (error) {
          console.error('Failed to delete question:', error);
          setAlertModal({ isOpen: true, message: '삭제에 실패했습니다.', type: 'error' });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: '질문 삭제',
      message: `선택한 ${selectedIds.length}개의 질문을 삭제하시겠습니까?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('questions')
            .update({ status: 'deleted' })
            .in('id', selectedIds);

          if (error) throw error;
          setSelectedIds([]);
          loadQuestions();
          setAlertModal({ isOpen: true, message: `${selectedIds.length}개의 질문이 삭제되었습니다.`, type: 'success' });
        } catch (error) {
          console.error('Failed to delete questions:', error);
          setAlertModal({ isOpen: true, message: '삭제에 실패했습니다.', type: 'error' });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuestions.map(q => q.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleReopenQuestion = (id: string) => {
    const currentActiveQuestion = questions.find((q) => q.status === 'active');

    if (currentActiveQuestion) {
      // 이미 활성 질문이 있는 경우
      setConfirmModal({
        isOpen: true,
        title: '질문 다시 열기',
        message: `현재 활성 중인 질문 "${currentActiveQuestion.content}"이(가) 자동으로 종료됩니다. 계속하시겠습니까?`,
        type: 'warning',
        onConfirm: async () => {
          try {
            // 1. 기존 활성 질문 종료
            await supabase
              .from('questions')
              .update({ status: 'closed', closed_at: new Date().toISOString() })
              .eq('id', currentActiveQuestion.id);

            // 2. 새 질문 활성화
            const { error } = await supabase
              .from('questions')
              .update({ status: 'active', closed_at: null })
              .eq('id', id);

            if (error) throw error;

            loadQuestions();
            setAlertModal({ isOpen: true, message: '질문이 다시 열렸습니다.', type: 'success' });
          } catch (error) {
            console.error('Failed to reopen question:', error);
            setAlertModal({ isOpen: true, message: '재활성화에 실패했습니다.', type: 'error' });
          }
          setConfirmModal({ ...confirmModal, isOpen: false });
        },
      });
    } else {
      // 활성 질문이 없는 경우
      (async () => {
        try {
          const { error } = await supabase
            .from('questions')
            .update({ status: 'active', closed_at: null })
            .eq('id', id);

          if (error) throw error;

          loadQuestions();
          setAlertModal({ isOpen: true, message: '질문이 다시 열렸습니다.', type: 'success' });
        } catch (error) {
          console.error('Failed to reopen question:', error);
          setAlertModal({ isOpen: true, message: '재활성화에 실패했습니다.', type: 'error' });
        }
      })();
    }
  };

  const handleCloseQuestion = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: '질문 종료',
      message: '정말 이 질문을 종료하시겠습니까?',
      type: 'warning',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('questions')
            .update({ status: 'closed', closed_at: new Date().toISOString() })
            .eq('id', id);

          if (error) throw error;

          loadQuestions();
          setAlertModal({ isOpen: true, message: '질문이 종료되었습니다.', type: 'success' });
        } catch (error) {
          console.error('Failed to close question:', error);
          setAlertModal({ isOpen: true, message: '종료에 실패했습니다.', type: 'error' });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handleNewQuestion = () => {
    const currentActiveQuestion = questions.find((q) => q.status === 'active');

    if (currentActiveQuestion) {
      setConfirmModal({
        isOpen: true,
        title: '새로 의견 받기',
        message: `현재 진행 중인 의견 받기 "${currentActiveQuestion.content}"이(가) 자동으로 종료됩니다. 계속하시겠습니까?`,
        type: 'warning',
        onConfirm: async () => {
          try {
            // 확인 버튼 누르는 순간 기존 질문 종료
            await supabase
              .from('questions')
              .update({ status: 'closed', closed_at: new Date().toISOString() })
              .eq('id', currentActiveQuestion.id);

            setConfirmModal({ ...confirmModal, isOpen: false });
            navigate('/teacher/question/new');
          } catch (error) {
            console.error('Failed to close active question:', error);
            setAlertModal({ isOpen: true, message: '질문 종료에 실패했습니다.', type: 'error' });
          }
        },
      });
    } else {
      navigate('/teacher/question/new');
    }
  };

  const downloadCSV = async (question: QuestionWithCount, e: React.MouseEvent) => {
    e.stopPropagation();

    if (question.response_count === 0) {
      setToast({ isOpen: true, message: '다운로드할 응답이 없습니다', type: 'info' });
      return;
    }

    try {
      // 응답 데이터 가져오기
      const { data: responses, error } = await supabase
        .from('responses')
        .select('*')
        .eq('question_id', question.id)
        .order('submitted_at', { ascending: true });

      if (error) throw error;

      // CSV 생성
      const BOM = '\uFEFF';
      let csvContent = BOM;

      if (question.type === 'text') {
        csvContent += '번호,닉네임,텍스트 답변,그림 여부,제출 시간\n';
        responses?.forEach((response: Response) => {
          const row = [
            response.student_number,
            response.nickname,
            `"${(response.text_answer || '').replace(/"/g, '""')}"`,
            response.drawing_data ? 'O' : 'X',
            formatDate(response.submitted_at),
          ];
          csvContent += row.join(',') + '\n';
        });
      } else if (question.type === 'poll') {
        csvContent += '번호,닉네임,선택 항목,제출 시간\n';
        responses?.forEach((response: Response) => {
          const row = [
            response.student_number,
            response.nickname,
            `"${(response.poll_answer || []).join(', ')}"`,
            formatDate(response.submitted_at),
          ];
          csvContent += row.join(',') + '\n';
        });
      }

      // 다운로드
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `응답_${question.content.slice(0, 20)}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download CSV:', error);
      setToast({ isOpen: true, message: 'CSV 다운로드에 실패했습니다', type: 'error' });
    }
  };

  // 정렬 핸들러
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 필터링, 검색, 정렬
  const filteredQuestions = questions
    .filter((q) => filter === 'all' || q.status === filter)
    .filter((q) => q.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'status':
          // 활성이 위로
          compareValue = a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0;
          break;
        case 'content':
          compareValue = a.content.localeCompare(b.content);
          break;
        case 'type':
          compareValue = a.type.localeCompare(b.type);
          break;
        case 'response_count':
          compareValue = a.response_count - b.response_count;
          break;
        case 'created_at':
          compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  // 필터/검색 변경시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  // 메뉴 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <div className="min-h-screen bg-[#e9e1d9] flex flex-col">
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

      <header className="section-header sticky top-0 z-10">
        <div className="container-main py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/vivasam_logo.png" alt="비바샘 로고" className="w-[120px] object-contain" />
              <h1 className="text-xl font-bold text-gray-900">학생 의견 받기</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{teacher?.name} 선생님</span>
              <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-main py-6 flex-1">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === 'all'
                    ? 'bg-[#FF8800] text-white'
                    : 'bg-white text-gray-700 hover:bg-[#f5f0eb]'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === 'active'
                    ? 'bg-[#FF8800] text-white'
                    : 'bg-white text-gray-700 hover:bg-[#f5f0eb]'
                }`}
              >
                활성
              </button>
              <button
                onClick={() => setFilter('closed')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === 'closed'
                    ? 'bg-[#FF8800] text-white'
                    : 'bg-white text-gray-700 hover:bg-[#f5f0eb]'
                }`}
              >
                종료
              </button>
            </div>
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
              >
                선택 삭제 ({selectedIds.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* 검색 바 */}
            <div className="relative w-80">
              <input
                type="text"
                placeholder="질문 내용으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8800] focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button onClick={handleNewQuestion} className="btn-primary">
              새로 의견 받기
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm flex flex-col min-h-[600px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full table-fixed">
            {loading ? (
              <>
                <tbody>
                  <tr>
                    <td colSpan={7} className="text-center py-40">
                      <LoadingSpinner size="lg" message="불러오는 중..." />
                    </td>
                  </tr>
                </tbody>
              </>
            ) : filteredQuestions.length === 0 ? (
              <>
                <tbody>
                  <tr>
                    <td colSpan={7} className="h-[500px]">
                      <div className="flex flex-col items-center justify-center h-full pt-20">
                        <img
                          src="/no-search.png"
                          alt="의견 받기 없음"
                          className="max-w-[200px] h-auto mb-6 opacity-80"
                        />
                        <p className="text-gray-500 text-lg mb-6">
                          {searchQuery
                            ? '검색 결과가 없습니다'
                            : filter === 'active'
                            ? '진행 중인 의견 받기가 없습니다'
                            : filter === 'closed'
                            ? '종료된 의견 받기가 없습니다'
                            : '아직 진행한 의견 받기가 없습니다'}
                        </p>
                        {!searchQuery && filter === 'all' && (
                          <button onClick={handleNewQuestion} className="btn-primary">
                            첫 의견 받기
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </>
            ) : (
              <>
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 w-16">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-[#FF8800] rounded focus:ring-[#FF8800]"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-6 py-4 text-left text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition w-24"
                  >
                    <div className="flex items-center gap-1">
                      상태
                      {sortField === 'status' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    onClick={() => handleSort('content')}
                    className="px-6 py-4 text-left text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition"
                  >
                    <div className="flex items-center gap-1">
                      질문 내용
                      {sortField === 'content' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    onClick={() => handleSort('type')}
                    className="px-6 py-4 text-left text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition w-24"
                  >
                    <div className="flex items-center gap-1">
                      유형
                      {sortField === 'type' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    onClick={() => handleSort('response_count')}
                    className="px-6 py-4 text-center text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition w-28"
                  >
                    <div className="flex items-center justify-center gap-1">
                      응답 수
                      {sortField === 'response_count' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    onClick={() => handleSort('created_at')}
                    className="px-6 py-4 text-left text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition w-40"
                  >
                    <div className="flex items-center gap-1">
                      생성 시간
                      {sortField === 'created_at' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="pl-6 pr-8 py-4 text-right text-sm font-bold text-gray-700 w-24">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedQuestions.map((question) => (
                  <tr
                    key={question.id}
                    className={`transition ${
                      question.status === 'active'
                        ? 'bg-[#fff5f0] hover:bg-[#ffe8dc]'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(question.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(question.id);
                        }}
                        className="w-4 h-4 text-[#FF8800] rounded focus:ring-[#FF8800]"
                      />
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => navigate(`/teacher/question/${question.id}`)}
                    >
                      {question.status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF8800] text-white">
                          활성
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-400 text-white">
                          종료
                        </span>
                      )}
                    </td>
                    <td
                      className="px-6 py-4 max-w-md cursor-pointer"
                      onClick={() => navigate(`/teacher/question/${question.id}`)}
                    >
                      <div className={`text-sm font-medium truncate ${
                        question.status === 'active' ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {question.content}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => navigate(`/teacher/question/${question.id}`)}
                    >
                      <span className="text-sm text-gray-500">
                        {question.type === 'text' ? '주관식' : '투표'}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-center cursor-pointer"
                      onClick={() => navigate(`/teacher/question/${question.id}`)}
                    >
                      <span className="text-sm font-semibold text-gray-900">
                        {question.response_count}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => navigate(`/teacher/question/${question.id}`)}
                    >
                      <span className="text-sm text-gray-500">
                        {formatDate(question.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === question.id ? null : question.id);
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="6" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="18" r="1.5" />
                          </svg>
                        </button>

                        {openMenuId === question.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 flex flex-col">
                            <button
                              onClick={(e) => {
                                downloadCSV(question, e);
                                setOpenMenuId(null);
                              }}
                              disabled={question.response_count === 0}
                              className={`w-full px-4 py-2 text-left text-sm transition ${
                                question.response_count > 0
                                  ? 'text-gray-700 hover:bg-gray-100'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              CSV 다운로드
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                if (question.status === 'active') {
                                  handleCloseQuestion(question.id);
                                } else {
                                  handleReopenQuestion(question.id);
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
                            >
                              {question.status === 'active' ? '종료' : '재활성화'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                handleDeleteQuestion(question.id);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </>
            )}
            </table>
          </div>

          {/* 페이지네이션 - 하단 고정 */}
          <div className="mt-auto">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredQuestions.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
