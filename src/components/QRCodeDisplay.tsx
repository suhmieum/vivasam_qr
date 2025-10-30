import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface QRCodeDisplayProps {
  url: string;
  questionContent: string;
}

export default function QRCodeDisplay({ url, questionContent }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full space-y-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
        >
          <QRCodeSVG value={url} size={240} level="H" includeMargin={true} />
        </button>
        <p className="text-xs text-gray-500 text-center">QR 코드 클릭 시 크게 보기</p>

        <button
          onClick={handleCopy}
          className={`w-full px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
            copied ? 'bg-emerald-600 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              복사 완료!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              링크 복사
            </>
          )}
        </button>
      </div>

      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">QR 코드</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center space-y-8">
              {/* 질문 영역 - 강조 */}
              <div className="bg-gradient-to-br from-[#fff5f0] to-[#ffe8dc] p-6 rounded-xl border-2 border-[#FF8800] shadow-md">
                <p className="text-xl font-bold text-gray-900">{questionContent}</p>
              </div>

              {/* QR 코드 영역 */}
              <div className="flex justify-center">
                <div className="bg-white p-8 rounded-xl shadow-lg inline-block border-4 border-gray-100">
                  <QRCodeSVG value={url} size={320} level="H" includeMargin={true} />
                </div>
              </div>

              {/* 안내 문구 */}
              <div className="space-y-3">
                <p className="text-xl font-bold text-gray-800">스마트폰 카메라로 QR 코드를 스캔하세요!</p>
                <button onClick={handleCopy} className="btn-primary text-sm py-2">
                  {copied ? '✓ 복사 완료!' : '링크 복사'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
