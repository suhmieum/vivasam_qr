import { useMemo, useState } from 'react';
import { extractWords, getWordSize, type ResponseData } from '../lib/wordcloud';

interface WordCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  responses: ResponseData[];
  questionContent: string;
  isAnonymous: boolean;
}

export default function WordCloudModal({ isOpen, onClose, responses, questionContent: _questionContent, isAnonymous }: WordCloudModalProps) {
  const wordData = useMemo(() => extractWords(responses), [responses]);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  if (!isOpen) return null;

  if (wordData.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">답변 모아보기</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-16">
            <p className="text-gray-500">분석할 텍스트 답변이 없습니다</p>
          </div>
        </div>
      </div>
    );
  }

  const minCount = Math.min(...wordData.map((w) => w.count));
  const maxCount = Math.max(...wordData.map((w) => w.count));

  const colors = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#F97316', // orange
    '#14B8A6', // teal
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">답변 모아보기</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Word Cloud */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-wrap justify-center items-center gap-4 min-h-[400px]">
            {wordData.map((word, idx) => {
              const size = getWordSize(word.count, minCount, maxCount);
              const color = colors[idx % colors.length];
              const delay = idx * 50; // 순차적으로 나타나는 효과

              return (
                <div
                  key={word.text}
                  className="relative inline-flex items-center gap-2 px-3 py-1 rounded-lg hover:scale-125 transition-all duration-300 cursor-default animate-wordPop"
                  style={{
                    fontSize: `${size}px`,
                    color: color,
                    fontWeight: 'bold',
                    animationDelay: `${delay}ms`,
                  }}
                  onMouseEnter={() => setHoveredWord(word.text)}
                  onMouseLeave={() => setHoveredWord(null)}
                >
                  <span className="animate-pulse-gentle">{word.text}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 transition-all">
                    {word.count}
                  </span>

                  {/* Hover Tooltip */}
                  {hoveredWord === word.text && !isAnonymous && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-white rounded-xl px-3 py-2.5 z-50 shadow-2xl border border-gray-200 min-w-[200px] max-w-[320px]">
                      <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto">
                        {word.students.map((student, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-1.5 bg-gradient-to-br from-gray-50 to-gray-100 px-2 py-1.5 rounded-md text-[11px] text-gray-800"
                          >
                            <span className="font-bold text-gray-600">{student.number}</span>
                            <span className="truncate">{student.nickname}</span>
                          </div>
                        ))}
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-[6px] border-transparent border-t-white drop-shadow-sm"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <p>💡 단어 크기는 출현 빈도를 나타냅니다</p>
          </div>
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
