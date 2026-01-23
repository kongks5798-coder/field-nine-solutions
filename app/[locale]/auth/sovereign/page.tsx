'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * SOVEREIGN GATE - CEO Exclusive Access Portal
 * Phase 33: Fortress Gate Animation + Tesla Minimalism
 *
 * Design: Warm Ivory (#F9F9F7) + Deep Black (#171717)
 * Animation: Fortress gate opening effect on successful auth
 */

export default function SovereignAuthPage() {
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/panopticon';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/sovereign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Trigger fortress unlock animation
        setIsUnlocking(true);

        setTimeout(() => {
          setIsUnlocked(true);

          // Navigate after animation completes
          setTimeout(() => {
            router.push(redirectPath);
          }, 800);
        }, 1200);
      } else {
        setError(data.error || 'Access Denied');
        // Shake animation on error
        const form = document.getElementById('sovereign-form');
        form?.classList.add('shake');
        setTimeout(() => form?.classList.remove('shake'), 500);
      }
    } catch {
      setError('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut: Escape to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPassphrase('');
        setError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F9F9F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Fortress Gate Animation Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: isUnlocking ? 100 : -1,
          display: 'flex',
          pointerEvents: isUnlocking ? 'auto' : 'none',
        }}
      >
        {/* Left Gate */}
        <div
          style={{
            width: '50%',
            height: '100%',
            backgroundColor: '#171717',
            transform: isUnlocked ? 'translateX(-100%)' : 'translateX(0)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '40px',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '60%',
              backgroundColor: '#333',
              borderRadius: '2px',
            }}
          />
          <div
            style={{
              width: '4px',
              height: '40%',
              backgroundColor: '#333',
              borderRadius: '2px',
              marginLeft: '20px',
            }}
          />
        </div>

        {/* Right Gate */}
        <div
          style={{
            width: '50%',
            height: '100%',
            backgroundColor: '#171717',
            transform: isUnlocked ? 'translateX(100%)' : 'translateX(0)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '40px',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '40%',
              backgroundColor: '#333',
              borderRadius: '2px',
            }}
          />
          <div
            style={{
              width: '4px',
              height: '60%',
              backgroundColor: '#333',
              borderRadius: '2px',
              marginLeft: '20px',
            }}
          />
        </div>

        {/* Center Lock Icon */}
        {isUnlocking && !isUnlocked && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 101,
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                border: '4px solid #F9F9F7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 0.5s ease-in-out infinite',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F9F9F7"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '48px 32px',
          opacity: isUnlocking ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              backgroundColor: '#171717',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F9F9F7"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#171717',
              letterSpacing: '4px',
              margin: 0,
            }}
          >
            SOVEREIGN
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '8px',
              letterSpacing: '2px',
            }}
          >
            FIELD NINE COMMAND CENTER
          </p>
        </div>

        {/* Form */}
        <form id="sovereign-form" onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 600,
                color: '#171717',
                letterSpacing: '1px',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              Passphrase
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter sovereign passphrase"
              autoFocus
              autoComplete="off"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                border: `2px solid ${error ? '#EF4444' : '#E5E5E5'}`,
                borderRadius: '12px',
                backgroundColor: '#FFF',
                color: '#171717',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                if (!error) {
                  e.target.style.borderColor = '#171717';
                  e.target.style.boxShadow = '0 0 0 4px rgba(23, 23, 23, 0.1)';
                }
              }}
              onBlur={(e) => {
                if (!error) {
                  e.target.style.borderColor = '#E5E5E5';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span style={{ fontSize: '13px', color: '#DC2626' }}>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !passphrase}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              backgroundColor: isLoading || !passphrase ? '#A3A3A3' : '#171717',
              color: '#F9F9F7',
              border: 'none',
              borderRadius: '12px',
              cursor: isLoading || !passphrase ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #666',
                    borderTopColor: '#FFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Authenticating...
              </>
            ) : (
              'Enter Citadel'
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: '48px',
            textAlign: 'center',
            fontSize: '10px',
            color: '#A3A3A3',
            letterSpacing: '1px',
          }}
        >
          <p style={{ margin: 0 }}>FIELD NINE SOLUTIONS</p>
          <p style={{ margin: '4px 0 0' }}>SOVEREIGN ACCESS v1.0</p>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
        }

        .shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }

        input::placeholder {
          color: #A3A3A3;
        }
      `}</style>
    </div>
  );
}
