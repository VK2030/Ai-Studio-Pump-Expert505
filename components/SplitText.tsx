
import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words' | 'lines';
  from?: { opacity: number; y: number };
  to?: { opacity: number; y: number };
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right';
  display?: string;
  // Use React.ElementType to resolve "Cannot find namespace 'JSX'" error
  tag?: React.ElementType;
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  display = 'block',
  tag: Tag = 'p',
  onLetterAnimationComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<string[]>([]);

  useEffect(() => {
    // Manually split text to avoid dependency on GSAP SplitText (Premium)
    setElements(text.split(''));
  }, [text]);

  useEffect(() => {
    if (!containerRef.current || elements.length === 0) return;

    const chars = containerRef.current.querySelectorAll('.split-char');
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: `top bottom-=${threshold * 100}%`,
        once: true,
      },
      onComplete: onLetterAnimationComplete
    });

    tl.fromTo(
      chars,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
      }
    );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === containerRef.current) t.kill();
      });
    };
  }, [elements, delay, duration, ease, from, to, threshold, onLetterAnimationComplete]);

  return (
    <Tag
      ref={containerRef as any}
      className={`split-parent ${className}`}
      style={{ 
        textAlign, 
        overflow: 'hidden', 
        display
      }}
    >
      {elements.map((char, i) => (
        <span
          key={i}
          className="split-char"
          style={{ 
            display: 'inline-block', 
            whiteSpace: char === ' ' ? 'pre' : 'normal',
            willChange: 'transform, opacity'
          }}
        >
          {char}
        </span>
      ))}
    </Tag>
  );
};

export default SplitText;
