import { useRef, useState, useEffect } from 'react';

interface DrawingCanvasProps {
  onDrawingChange: (dataUrl: string | null) => void;
}

export default function DrawingCanvas({ onDrawingChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 초기 흰색 배경
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 초기 상태 저장
    saveToHistory();
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // 실제로 그림을 그렸을 때만 데이터 전송 및 히스토리 저장
    if (hasDrawn) {
      saveToHistory();
      const dataUrl = canvas.toDataURL('image/png');
      onDrawingChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onDrawingChange(null);

    // 히스토리 초기화
    saveToHistory();
  };

  const undo = () => {
    if (currentStep <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStep = currentStep - 1;
    setCurrentStep(newStep);

    const img = new Image();
    img.src = history[newStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // 빈 캔버스인지 확인
      if (newStep === 0) {
        setHasDrawn(false);
        onDrawingChange(null);
      } else {
        setHasDrawn(true);
        onDrawingChange(canvas.toDataURL('image/png'));
      }
    };
  };

  const colorPresets = [
    { name: '검정', value: '#000000' },
    { name: '빨강', value: '#EF4444' },
    { name: '파랑', value: '#3B82F6' },
    { name: '초록', value: '#10B981' },
    { name: '노랑', value: '#F59E0B' },
    { name: '보라', value: '#8B5CF6' },
    { name: '분홍', value: '#EC4899' },
    { name: '주황', value: '#F97316' },
    { name: '지우개', value: '#FFFFFF' },
  ];

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair touch-none"
        style={{ maxWidth: '100%', height: 'auto' }}
      />

      {/* 색상 프리셋 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">색상:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {colorPresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setColor(preset.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                color === preset.value ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-300'
              }`}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded-full border-2 border-gray-300 cursor-pointer"
            title="직접 선택"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">두께:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 w-6">{lineWidth}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={currentStep <= 0}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            실행 취소
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition text-sm"
          >
            전체 지우기
          </button>
        </div>
      </div>
    </div>
  );
}
