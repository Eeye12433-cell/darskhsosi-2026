import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { Profile } from '@/hooks/useProfile';
import ChatInterface from './ChatInterface';
import UploadMaterials from './UploadMaterials';
import LearningProgress from './LearningProgress';
import SimplifyFeature from './SimplifyFeature';
import SummaryFeature from './SummaryFeature';
import MindMapFeature from './MindMapFeature';
import ScientistChat from './ScientistChat';
import UnderstandingTest from './UnderstandingTest';
import VideoLearning from './VideoLearning';
import WebLinkExplainer from './WebLinkExplainer';
import StudyPlanGenerator from './StudyPlanGenerator';
import ProjectSuggestions from './ProjectSuggestions';
import VirtualClassroom from './VirtualClassroom';
import FlashcardFeature from './FlashcardFeature';
import AboutPage from './AboutPage';
import KidsLearningGames from './KidsLearningGames';
import ProfilePage from './ProfilePage';
import ParentLinkCard from './parent/ParentLinkCard';
import QuestionBank from './QuestionBank';
import MoeLibrary from './MoeLibrary';
import gsap from 'gsap';

import { SidebarFeature } from './LearningPlatform';
import { cn } from '@/lib/utils';

interface MainContentProps {
  activeFeature: SidebarFeature;
  profile: Profile;
  language: 'ar' | 'en';
  setActiveFeature: (feature: SidebarFeature) => void;
}

const MainContent: React.FC<MainContentProps> = ({ activeFeature, profile, language, setActiveFeature }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const [visitedFeatures, setVisitedFeatures] = React.useState<Set<SidebarFeature>>(new Set([activeFeature]));

  React.useEffect(() => {
    setVisitedFeatures(prev => {
      if (prev.has(activeFeature)) return prev;
      const next = new Set(prev);
      next.add(activeFeature);
      return next;
    });
  }, [activeFeature]);

  const handleNavigateToUpload = () => {
    setActiveFeature('upload');
  };

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    gsap.killTweensOf(element);
    gsap.fromTo(
      element,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
  }, [activeFeature]);

  const features = useMemo(() => [
    { id: 'teacher' as SidebarFeature, component: <ChatInterface profile={profile} language={language} onNavigateToUpload={handleNavigateToUpload} /> },
    { id: 'upload' as SidebarFeature, component: <UploadMaterials language={language} /> },
    { id: 'progress' as SidebarFeature, component: <LearningProgress language={language} /> },
    { id: 'mindmap' as SidebarFeature, component: <MindMapFeature language={language} /> },
    { id: 'simplify' as SidebarFeature, component: <SimplifyFeature language={language} /> },
    { id: 'summary' as SidebarFeature, component: <SummaryFeature language={language} /> },
    { id: 'scientist' as SidebarFeature, component: <ScientistChat language={language} /> },
    { id: 'video' as SidebarFeature, component: <VideoLearning language={language} /> },
    { id: 'test' as SidebarFeature, component: <UnderstandingTest language={language} /> },
    { id: 'questionbank' as SidebarFeature, component: <QuestionBank language={language} /> },
    { id: 'moe-library' as SidebarFeature, component: <MoeLibrary language={language} /> },
    { id: 'weblink' as SidebarFeature, component: <WebLinkExplainer language={language} profile={profile} /> },
    { id: 'studyplan' as SidebarFeature, component: <StudyPlanGenerator language={language} profile={profile} /> },
    { id: 'projects' as SidebarFeature, component: <ProjectSuggestions language={language} /> },
    { id: 'classroom' as SidebarFeature, component: <VirtualClassroom language={language} /> },
    { id: 'flashcards' as SidebarFeature, component: <FlashcardFeature language={language} /> },
    { id: 'kids-games' as SidebarFeature, component: <KidsLearningGames language={language} /> },
    { id: 'parent-link' as SidebarFeature, component: (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto"><ParentLinkCard language={language} /></div>
      </div>
    ) },
    { id: 'about' as SidebarFeature, component: <AboutPage language={language} /> },
    { id: 'profile' as SidebarFeature, component: <ProfilePage profile={profile} language={language} /> }
  ], [profile, language]);

  return (
    <main className="flex-1 h-full overflow-hidden bg-background gsap-theme-animate">
      <div ref={contentRef} className="h-full relative">
        {features.map((feature) => (
          visitedFeatures.has(feature.id) && (
            <div
              key={feature.id}
              className={cn(
                "h-full w-full absolute inset-0 overflow-hidden",
                activeFeature === feature.id ? "z-10 opacity-100 pointer-events-auto" : "z-0 opacity-0 pointer-events-none"
              )}
            >
              {feature.component}
            </div>
          )
        ))}

        {/* Fallback for undefined features */}
        {!features.find(f => f.id === activeFeature) && (
          <div className="h-full w-full flex items-center justify-center">
            <ChatInterface profile={profile} language={language} onNavigateToUpload={handleNavigateToUpload} />
          </div>
        )}
      </div>
    </main>
  );
};

export default MainContent;
