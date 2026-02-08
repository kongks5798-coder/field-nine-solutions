export const revalidate = 60;

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="max-w-3xl w-full px-8 py-24">
        <h1 className="text-4xl font-semibold tracking-tight">fieldnine.io 사령부</h1>
        <p className="mt-4 max-w-xl text-lg opacity-80">
          웜 아이보리와 딥 블랙의 미니멀한 Tesla 스타일로 구성된 Next.js 기반 운영 허브
        </p>
        <div className="mt-10 flex gap-4">
          <a
            href="/admin"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:opacity-90"
          >
            관리자 페이지
          </a>
          <a
            href="https://fieldnine.io"
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 dark:border-white/15 px-6 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            공식 도메인
          </a>
        </div>
      </div>
    </main>
  );
}
