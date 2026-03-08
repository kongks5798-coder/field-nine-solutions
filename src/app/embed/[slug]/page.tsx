import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `Dalkak Embed — ${slug}` };
}

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = serviceClient();
  const { data: app } = await supabase
    .from("published_apps")
    .select("slug, name, html, views")
    .eq("slug", slug)
    .single();

  if (!app) notFound();

  // Fire-and-forget view increment
  supabase
    .from("published_apps")
    .update({ views: (app.views ?? 0) + 1 })
    .eq("slug", slug)
    .then(() => {});

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{app.name}</title>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100vh; }`}</style>
      </head>
      <body dangerouslySetInnerHTML={{ __html: app.html ?? "" }} />
    </html>
  );
}
