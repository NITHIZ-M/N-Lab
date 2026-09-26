import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(onFinish, 350);
    }, 900);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <img
            src="/App_Logo.jpg"
            alt="N-Lab Logo"
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '26px',
              objectFit: 'cover',
              boxShadow: '0 16px 36px rgba(79, 70, 229, 0.22), 0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '3px solid #ffffff',
              animation: 'splashZoomIn 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          />
        </div>

        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.6s ease 0.15s forwards', opacity: 0 }}>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#0F172A',
            }}
          >
            N-Lab Studio
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              color: '#4F46E5',
              marginTop: '4px',
              textTransform: uppercaseText('CLIENT MEDIA TOOLKIT'),
            }}
          >
            CLIENT MEDIA TOOLKIT
          </div>
        </div>

        {/* Sleek White Loading Animation Bar */}
        <div
          style={{
            marginTop: '12px',
            width: '56px',
            height: '4px',
            background: '#E2E8F0',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #4F46E5, #0284C7)',
              borderRadius: '9999px',
              animation: 'loaderSlide 1.2s infinite cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

const uppercaseText = (str: string) => str.toUpperCase();

