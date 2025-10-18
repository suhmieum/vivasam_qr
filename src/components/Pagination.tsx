interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  totalItems = 0,
  itemsPerPage = 10
}: PaginationProps) {
  // 통계 정보 계산
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const safeTotalPages = Math.max(1, totalPages); // 최소 1페이지

  // 표시할 페이지 번호 계산
  const getVisiblePages = () => {
    const pages: number[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(safeTotalPages, start + maxVisiblePages - 1);

    // 끝에 도달했을 때 start 조정
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // 질문이 없으면 페이지네이션 전체를 숨김
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="py-6 border-t border-gray-200">
      {/* 통계 정보 */}
      <div className="flex items-center justify-between px-6 mb-4">
        <div className="text-sm text-gray-600">
          전체 <span className="font-semibold text-gray-900">{totalItems}</span>개 중{' '}
          <span className="font-semibold text-gray-900">{startItem}</span>-
          <span className="font-semibold text-gray-900">{endItem}</span>개 표시
        </div>
        {safeTotalPages > 1 && (
          <div className="text-sm text-gray-500">
            {currentPage} / {safeTotalPages} 페이지
          </div>
        )}
      </div>

      {/* 페이지네이션 버튼 */}
      {totalItems > 0 && (
        <div className="flex items-center justify-center gap-2">
          {/* 처음 버튼 */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            처음
          </button>

          {/* 이전 버튼 */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            이전
          </button>

          {/* 페이지 번호들 */}
          <div className="flex gap-1">
            {visiblePages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  currentPage === page
                    ? 'bg-[#FF8800] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
            disabled={currentPage === safeTotalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            다음
          </button>

          {/* 마지막 버튼 */}
          <button
            onClick={() => onPageChange(safeTotalPages)}
            disabled={currentPage === safeTotalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            마지막
          </button>
        </div>
      )}
    </div>
  );
}
