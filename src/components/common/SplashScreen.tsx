import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(onFinish, 300);
    }, 600); // Quick 600ms boot time

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <img
          src="/App_Logo.jpg"
          alt="N-Lab"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            objectFit: 'cover',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        />

        <span
          style={{
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '-0.3px',
            color: 'var(--text-primary)',
          }}
        >
          N-Lab
        </span>

        <div
          style={{
            width: '40px',
            height: '2px',
            background: 'var(--accent-primary)',
            borderRadius: '9999px',
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  );
};
