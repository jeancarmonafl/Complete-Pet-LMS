import { PropsWithChildren } from 'react';

import { AnimatedBackground } from '../components/AnimatedBackground';
import { TopbarControls } from '../components/TopbarControls';

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="absolute right-6 top-6 z-10">
        <TopbarControls />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
