import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') ?? 'FieldNine — AI로 앱을 만드세요';
  const sub   = searchParams.get('sub')   ?? 'GPT-4o · Claude · Gemini · Grok으로 30초 안에 완성';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #09101e 0%, #160926 50%, #09101e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            fontSize: '64px',
            fontWeight: 900,
            background: 'linear-gradient(90deg, #f97316, #f43f5e)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-2px',
          }}>
            F9
          </div>
          <div style={{ fontSize: '28px', color: '#9ca3af', fontWeight: 400 }}>
            FieldNine
          </div>
        </div>

        {/* Title */}
        <div style={{
          fontSize: '44px',
          fontWeight: 700,
          color: '#e8eaf0',
          textAlign: 'center',
          lineHeight: 1.2,
          marginBottom: '20px',
          maxWidth: '900px',
        }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: '22px',
          color: '#6b7280',
          textAlign: 'center',
          maxWidth: '800px',
        }}>
          {sub}
        </div>

        {/* Bottom badge */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          gap: '12px',
        }}>
          {['GPT-4o', 'Claude', 'Gemini', 'Grok'].map(m => (
            <div key={m} style={{
              background: 'rgba(249,115,22,0.15)',
              border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '16px',
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
