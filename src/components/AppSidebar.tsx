import React, { useLayoutEffect, useRef } from 'react';
import { Profile } from '@/hooks/useProfile';
import { SidebarFeature } from './LearningPlatform';
import { cn } from '@/lib/utils';
import { GraduationCap, Upload, Network, Lightbulb, FileText, Users, Video, ClipboardCheck, TrendingUp, ChevronLeft, ChevronRight, LogOut, Link, Calendar, Rocket, Heart, User, Presentation, Layers, Puzzle , ShieldCheck, HelpCircle, Library} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import gsap from 'gsap';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeFeature: SidebarFeature;
  setActiveFeature: (feature: SidebarFeature) => void;
  profile: Profile;
  language: 'ar' | 'en';
  onSignOut: () => void;
  className?: string;
}

export const features: {
  id: SidebarFeature;
  icon: React.ElementType;
}[] = [{
  id: 'teacher',
  icon: GraduationCap
}, {
  id: 'upload',
  icon: Upload
}, {
  id: 'mindmap',
  icon: Network
}, {
  id: 'simplify',
  icon: Lightbulb
}, {
  id: 'summary',
  icon: FileText
}, {
  id: 'scientist',
  icon: Users
}, {
  id: 'video',
  icon: Video
}, {
  id: 'test',
  icon: ClipboardCheck
}, {
  id: 'questionbank',
  icon: HelpCircle
}, {
  id: 'moe-library',
  icon: Library
}, {
  id: 'progress',
  icon: TrendingUp
}, {
  id: 'weblink',
  icon: Link
}, {
  id: 'studyplan',
  icon: Calendar
}, {
  id: 'projects',
  icon: Rocket
}, {
  id: 'classroom',
  icon: Presentation
}, {
  id: 'flashcards',
  icon: Layers
}, {
  id: 'kids-games',
  icon: Puzzle
}, {
  id: 'parent-link',
  icon: ShieldCheck
}, {
  id: 'profile',
  icon: User
}, {
  id: 'about',
  icon: Heart
}];

const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onToggle,
  activeFeature,
  setActiveFeature,
  profile,
  language,
  onSignOut,
  className
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLUListElement>(null);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  // GSAP entrance animation using context for better reliability
  useLayoutEffect(() => {
    if (!sidebarRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(sidebarRef.current, {
        x: dir === 'rtl' ? 50 : -50,
        opacity: 0
      }, {
        x: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      });

      if (navItemsRef.current) {
        const items = navItemsRef.current.querySelectorAll('li');
        gsap.fromTo(items, {
          x: dir === 'rtl' ? 20 : -20,
          opacity: 0
        }, {
          x: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.03,
          delay: 0.2,
          ease: 'power2.out'
        });
      }
    }, sidebarRef);

    return () => ctx.revert();
  }, [dir]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      ar: {
        'app.name': 'درس خصوصي',
        'sidebar.teacher': 'المعلم الذكي',
        'sidebar.upload': 'رفع المواد',
        'sidebar.mindmap': 'الخريطة الذهنية',
        'sidebar.simplify': 'تبسيط المفاهيم',
        'sidebar.summary': 'الملخص',
        'sidebar.scientist': 'حديث مع عالم',
        'sidebar.video': 'التعلم بالفيديو',
        'sidebar.test': 'اختبار الفهم',
        'sidebar.questionbank': 'بنك الأسئلة',
        'sidebar.moe-library': 'مكتبة كتب الوزارة',
        'sidebar.progress': 'تقدم التعلم',
        'sidebar.weblink': 'شرح الروابط',
        'sidebar.studyplan': 'خطة دراسية',
        'sidebar.projects': 'مشاريع عملية',
        'sidebar.classroom': 'القاعة الافتراضية',
        'sidebar.flashcards': 'البطاقات التعليمية',
        'sidebar.kids-games': 'ألعاب تعليمية للأطفال',
        'sidebar.parent-link': 'ربط ولي الأمر',
        'sidebar.profile': 'الملف الشخصي',
        'sidebar.about': 'عن التطبيق',
        'action.signout': 'تسجيل الخروج'
      },
      en: {
        'app.name': 'Dars Khusoosi',
        'sidebar.teacher': 'Intelligent Teacher',
        'sidebar.upload': 'Upload Materials',
        'sidebar.mindmap': 'Mind Map',
        'sidebar.simplify': 'Simplify Concept',
        'sidebar.summary': 'Summary',
        'sidebar.scientist': 'Talk to Scientist',
        'sidebar.video': 'Learn with Video',
        'sidebar.test': 'Understanding Test',
        'sidebar.questionbank': 'Question Bank',
        'sidebar.moe-library': 'Ministry Library',
        'sidebar.progress': 'Learning Progress',
        'sidebar.weblink': 'Explain Links',
        'sidebar.studyplan': 'Study Plan',
        'sidebar.projects': 'Projects',
        'sidebar.classroom': 'Virtual Classroom',
        'sidebar.flashcards': 'Flashcards',
        'sidebar.kids-games': 'Kids Learning Games',
        'sidebar.parent-link': 'Parent Link',
        'sidebar.profile': 'Profile',
        'sidebar.about': 'About',
        'action.signout': 'Sign Out'
      }
    };
    return translations[language][key] || key;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const educationLabels: Record<string, Record<string, string>> = {
    ar: {
      elementary: 'ابتدائي',
      middle: 'متوسط',
      high: 'ثانوي',
      university: 'جامعي',
      professional: 'مهني'
    },
    en: {
      elementary: 'Elementary',
      middle: 'Middle School',
      high: 'High School',
      university: 'University',
      professional: 'Professional'
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'h-full bg-sidebar flex flex-col transition-all duration-300 border-e border-sidebar-border gsap-theme-animate',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-accent">
            <GraduationCap className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="heading-4 text-sidebar-foreground leading-tight">
              {t('app.name')}
            </h1>
          </div>
        </div>}
        <Button variant="ghost" size="icon" onClick={onToggle} className="text-sidebar-foreground hover:bg-sidebar-accent shrink-0">
          {dir === 'rtl' ? collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" /> : collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        <ul ref={navItemsRef} className="space-y-1 px-2">
          {features.map(feature => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            const button = <button data-helper-target={`sidebar-${feature.id}`} onClick={() => setActiveFeature(feature.id)} className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200', isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-accent' : 'text-sidebar-foreground hover:bg-sidebar-accent')}>
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="body-sm font-medium truncate">
                {t(`sidebar.${feature.id}`)}
              </span>}
            </button>;
            return <li key={feature.id}>
              {collapsed ? <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side={dir === 'rtl' ? 'left' : 'right'}>
                  {t(`sidebar.${feature.id}`)}
                </TooltipContent>
              </Tooltip> : button}
            </li>;
          })}
        </ul>
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl transition-all duration-200 cursor-pointer hover:bg-sidebar-accent',
            activeFeature === 'profile' && 'bg-sidebar-primary text-sidebar-primary-foreground shadow-accent',
            collapsed && 'justify-center'
          )}
          onClick={() => setActiveFeature('profile')}
        >
          <Avatar className={cn('w-10 h-10 border-2', activeFeature === 'profile' ? 'border-white' : 'border-sidebar-primary')}>
            <AvatarFallback className={cn(activeFeature === 'profile' ? 'bg-primary-foreground text-primary' : 'bg-sidebar-accent text-sidebar-foreground', 'font-semibold')}>
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && <div className="flex-1 min-w-0">
            <p className={cn('body-sm font-medium truncate', activeFeature === 'profile' ? 'text-white' : 'text-sidebar-foreground')}>
              {profile.name}
            </p>
            <p className={cn('caption truncate opacity-80', activeFeature === 'profile' ? 'text-white' : 'text-muted-foreground')}>
              {profile.education_level && educationLabels[language][profile.education_level]}
            </p>
          </div>}
          {!collapsed && <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                className={cn('shrink-0', activeFeature === 'profile' ? 'text-white hover:bg-white/20' : 'text-sidebar-foreground hover:bg-sidebar-accent')}
                onClick={(e) => {
                  e.stopPropagation();
                  onSignOut();
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('action.signout')}</TooltipContent>
          </Tooltip>}
        </div>
        {collapsed && <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Sign out" className="w-full mt-2 text-sidebar-foreground hover:bg-sidebar-accent" onClick={onSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={dir === 'rtl' ? 'left' : 'right'}>
            {t('action.signout')}
          </TooltipContent>
        </Tooltip>}
      </div>
    </aside>
  );
};

export default AppSidebar;