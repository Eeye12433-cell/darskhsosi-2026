import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import ParentDashboard from './parent/ParentDashboard';

import { useProfile } from '@/hooks/useProfile';
import { useSubjectTheme } from '@/hooks/useSubjectTheme';
import ProfileSetup from './ProfileSetup';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import MainContent from './MainContent';
import FloatingHelper from './floatingHelper';
import OnboardingTour from './OnboardingTour';
import { Loader2 } from 'lucide-react';
import { Subject } from '@/utils/subjectColors';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
export type SidebarFeature = 'teacher' | 'upload' | 'mindmap' | 'simplify' | 'summary' | 'scientist' | 'video' | 'test' | 'questionbank' | 'moe-library' | 'progress' | 'weblink' | 'studyplan' | 'projects' | 'classroom' | 'flashcards' | 'kids-games' | 'parent-link' | 'profile' | 'about';
const LearningPlatform: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();
  const {
    profile,
    loading: profileLoading,
    isProfileComplete,
    fetchProfile,
    updateProfile
  } = useProfile();
  const { isParent, loading: roleLoading } = useUserRole();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<SidebarFeature>(() => {
    return (localStorage.getItem('lastActiveFeature') as SidebarFeature) || 'teacher';
  });
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const hasInitializedLanguage = useRef(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_completed');
  });
  const isMobile = useIsMobile();

  // Save active feature when it changes
  useEffect(() => {
    localStorage.setItem('lastActiveFeature', activeFeature);
  }, [activeFeature]);

  // Apply dynamic subject theming ONLY when profile is complete
  // This prevents CSS variable changes from interfering with ProfileSetup's Radix components
  useSubjectTheme(isProfileComplete ? profile?.subject : null);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', {
        replace: true
      });
    }
  }, [user, authLoading, navigate]);

  // Sync language from profile - only on initial load to prevent re-render loops
  useEffect(() => {
    if (profile?.preferred_language && !hasInitializedLanguage.current) {
      hasInitializedLanguage.current = true;
      const lang = profile.preferred_language === 'both' ? 'ar' : profile.preferred_language;
      setLanguage(lang);
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = profile.preferred_language;
    }
  }, [profile]);
  const handleLanguageChange = (lang: 'ar' | 'en') => {
    setLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };
  const handleProfileComplete = () => {
    fetchProfile();
  };
  const handleSubjectChange = async (subject: Subject) => {
    if (profile) {
      await updateProfile({
        subject
      });
    }
  };
  if (authLoading || profileLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>;
  }
  if (!user) {
    return null;
  }
  if (isParent) {
    return <ParentDashboard language={language} onSignOut={signOut} />;
  }
  if (!isProfileComplete) {
    return <ProfileSetup onComplete={handleProfileComplete} currentLanguage={language} setLanguage={handleLanguageChange} />;
  }

  return <div className="flex flex-col h-screen w-full overflow-hidden">
    {showOnboarding && isProfileComplete && (
      <OnboardingTour language={language} onComplete={() => setShowOnboarding(false)} onNavigate={feature => setActiveFeature(feature as SidebarFeature)} />
    )}
    <AppHeader
      profile={profile!}
      language={language}
      onSubjectChange={handleSubjectChange}
      onMenuClick={() => setMobileMenuOpen(true)}
    />
    <div className="flex flex-1 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
          profile={profile!}
          language={language}
          onSignOut={signOut}
        />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side={language === 'ar' ? 'right' : 'left'} className="p-0 w-64 border-none">
          <AppSidebar
            collapsed={false}
            onToggle={() => setMobileMenuOpen(false)}
            activeFeature={activeFeature}
            setActiveFeature={(f) => {
              setActiveFeature(f);
              setMobileMenuOpen(false);
            }}
            profile={profile!}
            language={language}
            onSignOut={signOut}
            className="w-full"
          />
        </SheetContent>
      </Sheet>

      <MainContent activeFeature={activeFeature} profile={profile!} language={language} setActiveFeature={setActiveFeature} />
      <FloatingHelper language={language} currentFeature={activeFeature} onNavigate={feature => setActiveFeature(feature as SidebarFeature)} />
    </div>
  </div>;
};
export default LearningPlatform;