import { useEffect, useRef } from 'react';
import { getSubjectTheme, getSubjectTokens, Subject } from '@/utils/subjectColors';

/**
 * Hook that applies subject-specific CSS custom properties to the document root.
 * Every subject drives the full app palette (primary, accent, ring, header, sidebar, charts)
 * in both light and dark mode, giving each subject a distinct visual identity.
 *
 * IMPORTANT: Only call this hook when the profile is complete to avoid
 * CSS variable changes interfering with Radix UI components during mounting.
 */
export const useSubjectTheme = (subject: Subject | string | null | undefined) => {
  const appliedKeys = useRef<string[]>([]);

  useEffect(() => {
    if (!subject) return;

    const root = document.documentElement;
    const theme = getSubjectTheme(subject);

    const parseHSL = (hslString: string): string => {
      const match = hslString.match(/hsl\((\d+),?\s*(\d+)%?,?\s*(\d+)%?\)/);
      if (match) return `${match[1]} ${match[2]}% ${match[3]}%`;
      return '174 84% 32%';
    };

    let frame = 0;

    const apply = () => {
      const isDark = root.classList.contains('dark');
      const tokens = {
        '--subject-primary': parseHSL(theme.primary),
        '--subject-secondary': parseHSL(theme.secondary),
        '--subject-accent': parseHSL(theme.accent),
        ...getSubjectTokens(theme.id, isDark),
      };

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        Object.entries(tokens).forEach(([key, value]) => root.style.setProperty(key, value));
        appliedKeys.current = Object.keys(tokens);
        document.body.dataset.subject = theme.id;
      });
    };

    apply();

    // Re-apply when the light/dark class changes
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.attributeName === 'class')) apply();
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [subject]);

  // Clean up all injected tokens on unmount
  useEffect(() => {
    return () => {
      const root = document.documentElement;
      appliedKeys.current.forEach(key => root.style.removeProperty(key));
      appliedKeys.current = [];
      delete document.body.dataset.subject;
    };
  }, []);
};

export default useSubjectTheme;
