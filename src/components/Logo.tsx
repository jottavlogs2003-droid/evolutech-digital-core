import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true,
  className 
}) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg' },
    md: { icon: 'w-10 h-10', text: 'text-xl' },
    lg: { icon: 'w-14 h-14', text: 'text-3xl' },
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'relative flex items-center justify-center rounded-xl gradient-primary shadow-glow',
        sizes[size].icon
      )}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-2/3 h-2/3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" className="fill-primary-foreground/20" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-bold tracking-tight text-gradient',
            sizes[size].text
          )}>
            EVOLUTECH
          </span>
          <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
            Digital
          </span>
        </div>
      )}
    </div>
  );
};
