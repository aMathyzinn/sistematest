'use client';

import { useState, useEffect } from 'react';

export default function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    };
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="status-bar shrink-0 flex items-center justify-between px-7 h-11 text-[12px] font-semibold text-white/70 select-none z-50">
      <span className="tabular-nums tracking-wide">{time}</span>

      <div className="flex items-center gap-2">
        {/* Signal bars */}
        <svg width="16" height="12" viewBox="0 0 16 12" className="opacity-70">
          <rect x="0" y="9" width="3" height="3" rx="0.5" fill="currentColor" />
          <rect x="4" y="6" width="3" height="6" rx="0.5" fill="currentColor" />
          <rect x="8" y="3" width="3" height="9" rx="0.5" fill="currentColor" />
          <rect x="12" y="0" width="3" height="12" rx="0.5" fill="currentColor" opacity="0.35" />
        </svg>

        {/* Wi-Fi */}
        <svg width="15" height="12" viewBox="0 0 24 20" fill="currentColor" className="opacity-70">
          <path d="M12 18a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM3.51 9.54a12.07 12.07 0 0116.98 0l-1.42 1.41a10.07 10.07 0 00-14.14 0L3.51 9.54zM7.34 13.37a7.05 7.05 0 019.32 0l-1.41 1.42a5.05 5.05 0 00-6.5 0l-1.41-1.42z" />
        </svg>

        {/* Battery */}
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] tabular-nums opacity-60">85</span>
          <svg width="20" height="11" viewBox="0 0 28 14" className="opacity-70">
            <rect x="0.5" y="0.5" width="24" height="13" rx="2.5" stroke="currentColor" strokeWidth="1" fill="none" />
            <rect x="25" y="4" width="2.5" height="6" rx="1" fill="currentColor" opacity="0.4" />
            <rect x="2" y="2" width="18" height="10" rx="1.5" fill="currentColor" opacity="0.7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
