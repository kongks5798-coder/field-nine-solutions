import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import { LikeButton } from "./LikeButton";
import { ForkButton } from "./ForkButton";
import { CommentsSection } from "./CommentsSection";
import { EmbedCode } from "@/components/EmbedCode";

async function getApp(slug: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data } = await supabase
    .from("published_apps")
    .select("slug, name, html, views, likes, forks, user_id, created_at")
    .eq("slug", slug)
    .single();

  if (data) {
    // Increment views (fire and forget)
    supabase
      .from("published_apps")
      .update({ views: (data.views ?? 0) + 1 })
      .eq("slug", slug)
      .then(() => {});
  }

  return data;
}

/** Extract description from generated HTML (meta description > first h1/p > fallback) */
function extractDescription(html: string, appName: string): string {
  const metaDesc =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,200})["']/i
    )?.[1] ??
    html.match(
      /<meta[^>]+content=["']([^"']{10,200})["'][^>]+name=["']description["']/i
    )?.[1];
  if (metaDesc) return metaDesc;
  const h1 = html.match(/<h1[^>]*>([^<]{5,100})<\/h1>/i)?.[1]?.trim();
  if (h1) return `${h1} — Dalkak으로 만든 앱`;
  return `${appName} — Dalkak AI로 만든 웹앱`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = await getApp(slug);
  if (!app) return { title: "앱을 찾을 수 없습니다" };

  const title = `${app.name} — Dalkak`;
  const description = extractDescription(app.html ?? "", app.name);
  const url = `${SITE_URL}/p/${app.slug}`;
  const ogImage = `${SITE_URL}/api/og?title=${encodeURIComponent(app.name)}&slug=${encodeURIComponent(app.slug)}&views=${app.views ?? 0}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

function formatCount(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

export default async function PublishedAppPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = await getApp(slug);
  if (!app) notFound();

  const appUrl = SITE_URL;

  return (
    <html lang="ko">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{app.name} | Dalkak</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #050508; font-family: "Pretendard", "Inter", -apple-system, sans-serif; }
          .topbar {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            height: 44px; background: rgba(6,6,13,0.95); backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,255,255,0.07);
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 16px; gap: 12px;
          }
          .logo { display: flex; align-items: center; gap: 7px; text-decoration: none; }
          .logo-badge {
            width: 24px; height: 24px; border-radius: 6px;
            background: linear-gradient(135deg,#f97316,#f43f5e);
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 9px; color: #fff;
          }
          .logo-name { font-size: 13px; font-weight: 700; color: #d4d8e2; }
          .app-name { font-size: 12px; font-weight: 600; color: #d4d8e2; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .badge { padding: 3px 8px; border-radius: 20px; background: rgba(34,197,94,0.12); color: #22c55e; font-size: 10px; font-weight: 700; border: 1px solid rgba(34,197,94,0.2); flex-shrink: 0; }
          .actions { display: flex; gap: 6px; flex-shrink: 0; }
          .btn { padding: 5px 10px; border-radius: 7px; font-size: 11px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
          .btn-ghost { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #6b7280; }
          .btn-primary { background: linear-gradient(135deg,#f97316,#f43f5e); border: none; color: #fff; }
          /* Layout: iframe takes up most of the viewport, panel below */
          .main-layout { display: flex; flex-direction: column; padding-top: 44px; min-height: 100vh; }
          .frame-wrapper { flex: 1; min-height: calc(100vh - 44px - 280px); }
          .frame { display: block; width: 100%; height: 100%; min-height: calc(100vh - 44px - 280px); border: none; }
          .info-panel {
            background: #0d1117;
            border-top: 1px solid #30363d;
            padding: 20px 24px 40px;
          }
          .info-bar {
            display: flex; align-items: center; gap: 12; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
          }
          .info-bar-name { color: #fff; font-weight: 700; font-size: 18px; }
          .info-bar-meta { color: #8b949e; font-size: 13px; display: flex; gap: 8px; align-items: center; }
          .info-bar-actions { margin-left: auto; display: flex; gap: 8px; align-items: center; }
          @media (max-width: 600px) {
            .info-bar { flex-direction: column; align-items: flex-start; }
            .info-bar-actions { margin-left: 0; }
            .frame-wrapper { min-height: 50vh; }
            .frame { min-height: 50vh; }
          }
          .share-bar {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
          }
          .share-btn {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
            border: none; cursor: pointer; text-decoration: none; transition: all 0.15s;
          }
          .share-kakao { background: #FEE500; color: #3C1E1E; }
          .share-kakao:hover { background: #FFDF00; }
          .share-twitter { background: #000; color: #fff; border: 1px solid #333; }
          .share-twitter:hover { background: #111; }
          .share-copy { background: rgba(255,255,255,0.07); color: #9ca3af; border: 1px solid rgba(255,255,255,0.1); }
          .share-copy:hover { background: rgba(255,255,255,0.12); color: #d1d5db; }
          .viral-bar {
            margin-top: 24px; padding: 16px 20px;
            background: linear-gradient(135deg, rgba(249,115,22,0.08), rgba(244,63,94,0.06));
            border: 1px solid rgba(249,115,22,0.2); border-radius: 12px;
            display: flex; align-items: center; justify-content: space-between;
            flex-wrap: wrap; gap: 12px;
          }
          .viral-text { font-size: 14px; color: rgba(255,255,255,0.75); font-weight: 500; }
          .viral-text b { color: #f97316; }
          .viral-cta {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 9px 18px; border-radius: 8px;
            background: linear-gradient(135deg, #f97316, #f43f5e);
            color: #fff; font-size: 13px; font-weight: 700;
            text-decoration: none; white-space: nowrap;
          }
          .viral-cta:hover { opacity: 0.9; }
        `}</style>
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var APP_TITLE = ${JSON.stringify(app.name)};
            var APP_URL = ${JSON.stringify(appUrl + '/p/' + app.slug)};
            var OG_IMAGE = ${JSON.stringify(appUrl + '/api/og?title=' + encodeURIComponent(app.name) + '&slug=' + encodeURIComponent(app.slug) + '&views=' + (app.views ?? 0))};

            function shareKakao() {
              if (!window.Kakao || !window.Kakao.isInitialized()) {
                alert('카카오톡 공유를 불러오는 중입니다.');
                return;
              }
              window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                  title: APP_TITLE,
                  description: 'Dalkak AI로 1분만에 만든 웹앱 ✨',
                  imageUrl: OG_IMAGE,
                  link: { mobileWebUrl: APP_URL, webUrl: APP_URL }
                },
                buttons: [
                  { title: '앱 보기', link: { mobileWebUrl: APP_URL, webUrl: APP_URL } },
                  { title: '나도 만들기', link: { mobileWebUrl: 'https://fieldnine.io/workspace', webUrl: 'https://fieldnine.io/workspace' } }
                ]
              });
            }
            function copyLink() {
              navigator.clipboard.writeText(APP_URL).then(function() {
                var btn = document.getElementById('copy-btn');
                if (btn) { btn.textContent = '✓ 복사됨'; setTimeout(function(){ btn.textContent = '🔗 링크 복사'; }, 2000); }
              }).catch(function() {
                var ta = document.createElement('textarea');
                ta.value = APP_URL;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
              });
            }
            window.addEventListener('load', function() {
              if (window.Kakao && !window.Kakao.isInitialized()) {
                window.Kakao.init('3f3aece5e3bb5e8c6ac3df5c68012b91');
              }
              var kakaoBtn = document.getElementById('kakao-share-btn');
              var copyBtn = document.getElementById('copy-btn');
              if (kakaoBtn) kakaoBtn.addEventListener('click', shareKakao);
              if (copyBtn) copyBtn.addEventListener('click', copyLink);
            });
          })();
        `}} />
      </head>
      <body>
        <div className="topbar">
          <a href={appUrl} className="logo">
            <div className="logo-badge">D</div>
            <span className="logo-name">Dalkak</span>
          </a>
          <span className="app-name">{app.name}</span>
          <span className="badge">✓ 배포됨</span>
          <div className="actions">
            <ForkButton slug={slug} forkCount={app.forks ?? 0} variant="topbar" />
            <a href={`${appUrl}/workspace`} className="btn btn-primary">
              ✦ 내 앱 만들기
            </a>
          </div>
        </div>

        <div className="main-layout">
          {/* App iframe */}
          <div className="frame-wrapper">
            <iframe
              srcDoc={app.html}
              className="frame"
              title={app.name}
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>

          {/* Info + Actions + Comments panel */}
          <div className="info-panel">
            <div className="info-bar">
              <span className="info-bar-name">{app.name}</span>
              <div className="info-bar-meta">
                <span>👁 {formatCount(app.views)}</span>
                <span>·</span>
                <span>❤️ {formatCount(app.likes)}</span>
                {(app.forks ?? 0) > 0 && (
                  <>
                    <span>·</span>
                    <span>🍴 {formatCount(app.forks)}</span>
                  </>
                )}
              </div>
              <div className="info-bar-actions">
                <LikeButton slug={slug} />
                <ForkButton slug={slug} forkCount={app.forks ?? 0} variant="panel" />
              </div>
            </div>

            {/* Share bar */}
            <div className="share-bar" style={{ marginBottom: 20 }}>
              <button id="kakao-share-btn" className="share-btn share-kakao">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1.5C4.86 1.5 1.5 4.16 1.5 7.44c0 2.04 1.27 3.84 3.19 4.89L3.9 15l3.4-1.82C7.72 13.26 8.36 13.32 9 13.32c4.14 0 7.5-2.66 7.5-5.88S13.14 1.5 9 1.5z" fill="#3C1E1E"/>
                </svg>
                카카오 공유
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${app.name} — Dalkak AI로 만든 웹앱`)}&url=${encodeURIComponent(`${appUrl}/p/${app.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-twitter"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.625zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X 공유
              </a>
              <button id="copy-btn" className="share-btn share-copy">
                🔗 링크 복사
              </button>
            </div>

            {/* Viral CTA bar */}
            <div className="viral-bar">
              <div className="viral-text">
                <b>✦ Dalkak AI</b>로 1분만에 만든 웹앱 · 코딩 없이 누구나 가능
              </div>
              <a href={`${appUrl}/workspace`} className="viral-cta">
                나도 만들기 →
              </a>
            </div>

            {/* Comments */}
            <CommentsSection slug={slug} />

            {/* Share + Embed */}
            <EmbedCode slug={slug} appName={app.name} />
          </div>
        </div>
      </body>
    </html>
  );
}
