import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';

export default function LoginPage() {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const setTeacher = useAppStore((state) => state.setTeacher);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim()) {
      setTeacher({
        id: name.trim(),
        name: name.trim(),
      });
      navigate('/teacher/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#e9e1d9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img src="/vivasam_logo.png" alt="비바샘 로고" className="w-[200px] object-contain" />
            <h1 className="text-3xl font-bold text-gray-900">학생 의견 받기</h1>
          </div>
          <p className="text-base text-gray-600">실시간 수업 참여 플랫폼</p>
        </div>

        <div className="card p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                교사 이름
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="input-base"
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              시작하기
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">테스트용 사이트입니다. 추후 비바샘 로그인 연동 추진 예정입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
