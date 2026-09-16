import React, { useRef } from 'react';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGsapTheme } from '@/hooks/useGsapTheme';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

interface AnimatedThemeToggleProps {
  className?: string;
}

const AnimatedThemeToggle: React.FC<AnimatedThemeToggleProps> = ({ className }) => {
  const { resolvedTheme, toggleTheme } = useGsapTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconContainerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!buttonRef.current || !iconContainerRef.current) {
      toggleTheme();
      return;
    }

    // Animate the button
    const tl = gsap.timeline();

    // Create sparkle burst
    const sparkles: HTMLSpanElement[] = [];
    for (let i = 0; i < 8; i++) {
      const sparkle = document.createElement('span');
      sparkle.innerHTML = '✦';
      sparkle.style.cssText = `
        position: absolute;
        font-size: 12px;
        color: ${resolvedTheme === 'dark' ? 'hsl(45 100% 60%)' : 'hsl(27 95% 60%)'};
        pointer-events: none;
        opacity: 0;
        z-index: 10;
      `;
      buttonRef.current.appendChild(sparkle);
      sparkles.push(sparkle);
    }

    // Icon rotation and scale
    tl.to(iconContainerRef.current, {
      rotate: 360,
      scale: 0,
      duration: 0.25,
      ease: 'power2.in'
    });

    // Sparkle burst
    tl.to(sparkles, {
      opacity: 1,
      scale: 1.5,
      duration: 0.15,
      stagger: 0.02
    }, '-=0.15');

    // Toggle theme at midpoint
    tl.call(() => toggleTheme());

    // Sparkles fly out
    sparkles.forEach((sparkle, i) => {
      const angle = (i / 8) * Math.PI * 2;
      tl.to(sparkle, {
        x: Math.cos(angle) * 30,
        y: Math.sin(angle) * 30,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => sparkle.remove()
      }, '-=0.25');
    });

    // Icon comes back
    tl.to(iconContainerRef.current, {
      rotate: 0,
      scale: 1,
      duration: 0.4,
      ease: 'elastic.out(1, 0.5)'
    }, '-=0.2');
  };

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={handleClick}
      className={cn(
        "rounded-full relative overflow-visible transition-all duration-300",
        "hover:bg-primary/10 hover:scale-110",
        "active:scale-95",
        className
      )}
    >
      <div
        ref={iconContainerRef}
        className="relative flex items-center justify-center"
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700" />
        )}
      </div>
      
      {/* Ambient glow */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100",
          resolvedTheme === 'dark' 
            ? "bg-amber-400/20 shadow-[0_0_15px_hsl(45_100%_60%/0.3)]"
            : "bg-slate-400/20 shadow-[0_0_15px_hsl(220_20%_50%/0.2)]"
        )}
      />
    </Button>
  );
};

export default AnimatedThemeToggle;
