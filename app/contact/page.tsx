export default function ContactPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              문의<span className="text-green-500">하기</span>
            </h1>
            <p className="text-xl text-gray-400">
              궁금한 점이 있으시면 언제든지 연락주세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* 연락처 정보 */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6 text-green-500">연락처 정보</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">이메일</h3>
                      <p className="text-gray-400">contact@fieldnine.com</p>
                      <p className="text-gray-400">support@fieldnine.com</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">전화</h3>
                      <p className="text-gray-400">02-1234-5678</p>
                      <p className="text-gray-400 text-sm">평일 09:00 - 18:00</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">주소</h3>
                      <p className="text-gray-400">
                        서울특별시 강남구 테헤란로 123<br />
                        Field Nine 빌딩 10층
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-6">
                <h3 className="font-semibold mb-3">응답 시간</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• 일반 문의: 영업일 기준 24시간 이내</li>
                  <li>• 기술 지원: 24/7 실시간 채팅</li>
                  <li>• 긴급 문의: 전화 상담 가능</li>
                </ul>
              </div>
            </div>

            {/* 문의 폼 */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-green-500">문의 양식</h2>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    이름 <span className="text-green-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 bg-black border border-green-500/30 rounded-lg focus:outline-none focus:border-green-500 text-white"
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    이메일 <span className="text-green-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-black border border-green-500/30 rounded-lg focus:outline-none focus:border-green-500 text-white"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    회사명
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="w-full px-4 py-3 bg-black border border-green-500/30 rounded-lg focus:outline-none focus:border-green-500 text-white"
                    placeholder="회사명을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    문의 유형 <span className="text-green-500">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 bg-black border border-green-500/30 rounded-lg focus:outline-none focus:border-green-500 text-white"
                  >
                    <option value="">선택하세요</option>
                    <option value="product">제품 문의</option>
                    <option value="pricing">요금 문의</option>
                    <option value="support">기술 지원</option>
                    <option value="partnership">파트너십</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    메시지 <span className="text-green-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-black border border-green-500/30 rounded-lg focus:outline-none focus:border-green-500 text-white resize-none"
                    placeholder="문의 내용을 입력하세요"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors"
                >
                  문의 보내기
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
