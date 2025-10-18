export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container-main py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <a href="https://www.visang.com/" target="_blank" rel="noopener noreferrer">
              <img src="/visang_logo.svg" alt="비상교육" className="h-8" />
            </a>
          </div>
          <div className="flex-1">
            <ul className="flex gap-4 mb-3 text-sm">
              <li>
                <a
                  href="https://www.vivasam.com/public/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 hover:text-[#FF8800] transition"
                >
                  서비스 이용약관
                </a>
              </li>
              <li>
                <a
                  href="https://www.vivasam.com/public/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 hover:text-[#FF8800] transition"
                >
                  개인정보처리방침
                </a>
              </li>
            </ul>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>㈜비상교육</span>
                <span>TEL : 1544-7714(선생님 전용 고객센터)</span>
                <span>
                  MAIL : <a href="mailto:vivasam@visang.com" className="hover:text-[#FF8800] transition">vivasam@visang.com</a>
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>대표자명 : 양태회</span>
                <span>사업자등록번호 : 211-87-07735</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                COPYRIGHT BY ㈜비상교육 ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
