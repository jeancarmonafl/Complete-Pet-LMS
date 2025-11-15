import { useState } from 'react';
interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full';
}

export function Logo({ className = '', size = 'md', variant = 'icon' }: LogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {!imageFailed ? (
        <img
          src="/assets/complete-pet-logo.png"
          alt="Complete-Pet logo"
          className="h-full w-full object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Globe/Earth representation */}
        <circle cx="50" cy="50" r="45" fill="url(#gradient)" />
        
        {/* Landmass shapes (stylized continents) */}
        <path 
          d="M 30 25 Q 35 20, 45 22 T 60 28 Q 65 32, 62 38 T 55 45 Q 50 48, 45 45 T 35 38 Q 28 32, 30 25 Z" 
          fill="currentColor" 
          className="text-green-500"
          opacity="0.9"
        />
        <path 
          d="M 25 55 Q 28 50, 35 52 T 45 58 Q 48 62, 45 68 T 38 72 Q 32 74, 28 70 T 25 62 Q 23 58, 25 55 Z" 
          fill="currentColor" 
          className="text-green-500"
          opacity="0.9"
        />
        <path 
          d="M 55 55 Q 60 52, 68 54 T 78 62 Q 80 68, 76 74 T 68 78 Q 62 80, 58 75 T 55 65 Q 54 60, 55 55 Z" 
          fill="currentColor" 
          className="text-green-400"
          opacity="0.9"
        />
        
        {/* Paw print in the center */}
        <g transform="translate(50, 50) scale(0.4)">
          {/* Main pad */}
          <ellipse cx="0" cy="8" rx="12" ry="15" fill="white" opacity="0.95" />
          {/* Toe pads */}
          <ellipse cx="-10" cy="-8" rx="6" ry="8" fill="white" opacity="0.95" />
          <ellipse cx="-3" cy="-12" rx="6" ry="8" fill="white" opacity="0.95" />
          <ellipse cx="4" cy="-12" rx="6" ry="8" fill="white" opacity="0.95" />
          <ellipse cx="11" cy="-8" rx="6" ry="8" fill="white" opacity="0.95" />
        </g>

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        </svg>
      )}
    </div>
  );
}

