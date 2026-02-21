import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Metadata } from "next";

async function getApp(slug: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data } = await supabase
    .from("published_apps")
    .select("slug, name, html, views, user_id, created_at")
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const app = await getApp(slug);
  if (!app) return { title: "앱을 찾을 수 없습니다" };
  return {
    title: `${app.name} | FieldNine`,
    description: `FieldNine AI로 만든 앱 — ${app.name}`,
    openGraph: {
      title: app.name,
      description: "FieldNine AI로 만든 앱",
      url: `https://fieldnine.io/p/${app.slug}`,
    },
  };
}

export default async function PublishedAppPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await getApp(slug);
  if (!app) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fieldnine.io";

  return (
    <html lang="ko">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{app.name} | FieldNine</title>
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
          .frame { position: fixed; top: 44px; left: 0; right: 0; bottom: 0; border: none; width: 100%; height: calc(100vh - 44px); }
        `}</style>
      </head>
      <body>
        <div className="topbar">
          <a href={appUrl} className="logo">
            <div className="logo-badge">F9</div>
            <span className="logo-name">FieldNine</span>
          </a>
          <span className="app-name">{app.name}</span>
          <span className="badge">✓ 배포됨</span>
          <div className="actions">
            <a href={`${appUrl}/workspace?fork=${encodeURIComponent(slug)}`} className="btn btn-ghost">
              🍴 포크
            </a>
            <a href={`${appUrl}/workspace`} className="btn btn-primary">
              ✦ 내 앱 만들기
            </a>
          </div>
        </div>
        <iframe
          srcDoc={app.html}
          className="frame"
          title={app.name}
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        />
      </body>
    </html>
  );
}
