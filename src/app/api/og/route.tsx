import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') ?? 'Dalkak — AI로 앱을 만들어드립니다';
  const sub   = searchParams.get('sub')   ?? 'GPT-4o · Claude · Gemini · Grok으로 30초 안에 완성';
  const slug  = searchParams.get('slug')  ?? '';
  const views = searchParams.get('views') ?? '';

  // ── Shared Brand Logo ────────────────────────────────────────────────────────
  const BrandLogo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: 'linear-gradient(135deg, #f97316, #f43f5e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', fontWeight: 900, color: '#fff',
      }}>
        D
      </div>
      <div style={{ fontSize: '22px', color: '#e8eaf0', fontWeight: 700, letterSpacing: '-0.3px' }}>
        딸깍
      </div>
    </div>
  );

  // ── Per-app OG image ─────────────────────────────────────────────────────────
  if (slug) {
    const prompt = sub && sub !== 'GPT-4o · Claude · Gemini · Grok으로 30초 안에 완성' ? sub : '';
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0a0a0f',
            fontFamily: 'sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Orange glow — top right */}
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)',
            display: 'flex',
          }} />

          {/* Header bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '32px 52px 0',
          }}>
            {BrandLogo}
            <div style={{
              fontSize: '16px',
              color: '#475569',
              fontWeight: 500,
            }}>
              fieldnine.io
            </div>
          </div>

          {/* Divider */}
          <div style={{
            margin: '24px 52px 0',
            height: '1px',
            background: 'rgba(255,255,255,0.07)',
            display: 'flex',
          }} />

          {/* Main content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 52px',
          }}>
            {/* App name */}
            <div style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#f0f4f8',
              lineHeight: 1.15,
              marginBottom: '20px',
              maxWidth: '900px',
              letterSpacing: '-1px',
            }}>
              {title}
            </div>

            {/* Prompt snippet */}
            {prompt && (
              <div style={{
                fontSize: '20px',
                color: '#64748b',
                maxWidth: '820px',
                lineHeight: 1.5,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {prompt}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{
            margin: '0 52px',
            height: '1px',
            background: 'rgba(255,255,255,0.07)',
            display: 'flex',
          }} />

          {/* Footer bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 52px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#f97316',
                display: 'flex',
              }} />
              <span style={{ fontSize: '16px', color: '#94a3b8' }}>AI로 만든 앱</span>
              {views && (
                <>
                  <span style={{ fontSize: '16px', color: '#334155' }}>·</span>
                  <span style={{ fontSize: '16px', color: '#94a3b8' }}>{views} 조회</span>
                </>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, #f97316, #f43f5e)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
            }}>
              딸깍으로 만들어보기 →
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // ── Default / home OG image ───────────────────────────────────────────────────
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '52px 72px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Orange glow — top right */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Secondary glow — bottom left */}
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-60px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #f97316, #f43f5e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', fontWeight: 900, color: '#fff',
            }}>
              D
            </div>
            <div style={{ fontSize: '28px', color: '#e8eaf0', fontWeight: 700, letterSpacing: '-0.5px' }}>
              딸깍
            </div>
          </div>
          <div style={{ fontSize: '17px', color: '#475569' }}>fieldnine.io</div>
        </div>

        {/* Main headline */}
        <div style={{
          fontSize: '54px',
          fontWeight: 800,
          color: '#f0f4f8',
          lineHeight: 1.15,
          marginBottom: '24px',
          maxWidth: '900px',
          letterSpacing: '-1.5px',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: '22px',
          color: '#64748b',
          marginBottom: '40px',
          maxWidth: '800px',
        }}>
          {sub}
        </div>

        {/* AI model badges */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {['GPT-4o', 'Claude', 'Gemini', 'Grok'].map(m => (
            <div key={m} style={{
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.28)',
              borderRadius: '100px',
              padding: '7px 18px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#f97316',
            }}>
              {m}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
