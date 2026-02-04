import React from 'react';
import { cn } from '@/lib/utils';
import logoEvolutech from '@/assets/logo-evolutech.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true,
  className 
}) => {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-sm' },
    md: { icon: 'w-8 h-8', text: 'text-lg' },
    lg: { icon: 'w-10 h-10', text: 'text-xl' },
    xl: { icon: 'w-12 h-12', text: 'text-2xl' },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src={logoEvolutech} 
        alt="Evolutech" 
        className={cn(sizes[size].icon, 'object-contain')}
      />
      
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn(
            'font-bold tracking-tight text-gradient',
            sizes[size].text
          )}>
            EVOLUTECH
          </span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">
            Digital
          </span>
        </div>
      )}
    </div>
  );
};
