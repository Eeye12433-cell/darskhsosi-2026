import React, { useLayoutEffect, useRef } from 'react';
import { Profile } from '@/hooks/useProfile';
import { getSubjectTheme, getAllSubjects, Subject } from '@/utils/subjectColors';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Sparkles, Languages, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedThemeToggle from '@/components/ui/AnimatedThemeToggle';
import gsap from 'gsap';

interface AppHeaderProps {
  profile: Profile;
  language: 'ar' | 'en';
  onSubjectChange: (subject: Subject) => void;
  onMenuClick?: () => void;
}
const AppHeader: React.FC<AppHeaderProps> = ({
  profile,
  language,
  onSubjectChange,
  onMenuClick
}) => {
  const {
    updateProfile
  } = useProfile();
  const subjectTheme = getSubjectTheme(profile.subject || 'general');
  const subjects = getAllSubjects();
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // GSAP entrance animation - run once on mount
  useLayoutEffect(() => {
    if (!headerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;
    gsap.fromTo(headerRef.current, {
      y: -50,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    });
    if (logoRef.current) {
      gsap.fromTo(logoRef.current, {
        scale: 0.5,
        opacity: 0
      }, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        delay: 0.2,
        ease: 'back.out(1.7)'
      });
    }
    return () => {
      if (headerRef.current) gsap.killTweensOf(headerRef.current);
      if (logoRef.current) gsap.killTweensOf(logoRef.current);
    };
  }, []);
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const toggleLanguage = async () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    await updateProfile({
      preferred_language: newLang
    });
  };
  const getEducationLevelText = () => {
    const levels: Record<string, {
      ar: string;
      en: string;
    }> = {
      elementary: {
        ar: 'ابتدائي',
        en: 'Elementary'
      },
      middle: {
        ar: 'متوسط',
        en: 'Middle School'
      },
      high: {
        ar: 'ثانوي',
        en: 'High School'
      },
      university: {
        ar: 'جامعي',
        en: 'University'
      },
      professional: {
        ar: 'متخصص',
        en: 'Professional'
      }
    };
    return levels[profile.education_level || 'high']?.[language] || '';
  };
  return <header ref={headerRef} className="w-full border-b bg-card/95 backdrop-blur-sm shadow-sm gsap-theme-animate" style={{
    borderColor: subjectTheme.primary,
    borderBottomWidth: '2px'
  }}>
    <div
      className="relative overflow-hidden flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-4 header-banner rounded-2xl mx-2 sm:mx-4 my-1 sm:my-2 shadow-lg"
      style={{ background: subjectTheme.gradient }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -start-10 w-40 h-40 rounded-full opacity-20 blur-2xl"
        style={{ background: subjectTheme.accent }}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-black/25" />
      {/* Logo & Platform Name */}
      <div className="relative z-10 flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="md:hidden text-header-foreground hover:bg-header-foreground/10"
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6" />
        </Button>
        <div ref={logoRef} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform duration-300" style={{
          background: subjectTheme.gradient
        }}>
          <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex flex-col header-animate-item">
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-1 sm:gap-2 text-header-foreground">
            {t('درس خصوصي', 'Private Tutor')}
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary animate-pulse" />
          </h1>
          <span className="text-[10px] sm:text-xs text-header-muted whitespace-nowrap">
            {t('مساعدك التعليمي الذكي', 'Your Smart Learning Assistant')}
          </span>
        </div>
      </div>

      {/* Subject Selector */}
      <div className="relative z-10 flex-1 max-w-xs header-animate-item">
        <Select value={profile.subject || 'general'} onValueChange={value => onSubjectChange(value as Subject)}>
          <SelectTrigger className="w-full border-2 font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-black" style={{
            borderColor: subjectTheme.primary,
            backgroundColor: subjectTheme.secondary
          }}>
            <SelectValue>
              <span className="flex items-center gap-2">
                <span>{subjectTheme.icon}</span>
                <span>{language === 'ar' ? subjectTheme.nameAr : subjectTheme.nameEn}</span>
              </span>
            </SelectValue>
          </SelectTrigger>

          <SelectContent className="gsap-theme-animate">
            {subjects.map(subject => <SelectItem key={subject.id} value={subject.id}>
              <span className="flex items-center gap-2">
                <span>{subject.icon}</span>
                <span>{language === 'ar' ? subject.nameAr : subject.nameEn}</span>
              </span>
            </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Actions & Student Info */}
      <div className="relative z-10 flex items-center gap-3 text-header-foreground header-animate-item">
        <AnimatedThemeToggle className="text-header-foreground hover:text-header-foreground/80" />

        <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-full flex items-center gap-1 px-2 w-auto transition-all duration-300 hover:scale-110 text-header-foreground hover:text-header-foreground/80 hover:bg-header-foreground/10">
          <Languages className="w-5 h-5" />
          <span className="text-xs font-bold">{language === 'ar' ? 'EN' : 'AR'}</span>
        </Button>

        <div className="text-end hidden xs:block sm:block">
          <p className="font-bold text-sm sm:text-base leading-tight text-header-foreground tracking-tight">
            {profile.name}
          </p>
          <p className="text-[11px] sm:text-xs flex items-center gap-1.5 justify-end font-semibold text-header-muted">
            <span>{subjectTheme.icon}</span>
            <span className="text-header-foreground/90">
              {language === 'ar' ? subjectTheme.nameAr : subjectTheme.nameEn}
            </span>
            <span className="opacity-60">•</span>
            <span>{getEducationLevelText()}</span>
          </p>
        </div>
        <Avatar className="w-10 h-10 sm:w-11 sm:h-11 border-2 shadow-md" style={{
          borderColor: subjectTheme.primary
        }}>
          <AvatarImage src={profile.avatar_url || ''} alt={profile.name} />
          <AvatarFallback className="text-primary-foreground font-bold" style={{
            background: subjectTheme.gradient
          }}>
            {profile.name?.charAt(0)?.toUpperCase() || 'م'}
          </AvatarFallback>
        </Avatar>

      </div>
    </div>
  </header>;
};
export default AppHeader;