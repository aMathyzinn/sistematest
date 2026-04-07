'use client';

import StatusBar from './StatusBar';
import SystemNavBar from './SystemNavBar';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="phone-wrapper">
      {/* Phone device body */}
      <div className="phone-device">
        {/* Bezel (visible on md+ only via CSS) */}
        <div className="phone-bezel">
          <div className="phone-btn phone-btn--vol-up" />
          <div className="phone-btn phone-btn--vol-down" />
          <div className="phone-btn phone-btn--power" />
        </div>

        {/* Screen — transform creates containing block for fixed children */}
        <div className="phone-screen">
          <StatusBar />

          <div className="phone-app-area">
            {children}
          </div>

          <SystemNavBar />
        </div>
      </div>
    </div>
  );
}
