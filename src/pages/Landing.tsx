import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Sparkles, 
  Bot, 
  Network, 
  FileText, 
  ClipboardCheck, 
  Lightbulb,
  Video,
  Users,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Globe,
  ChevronDown,
  Star
} from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/app', { replace: true });
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, [navigate]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'hero.title': { ar: 'تعلم بذكاء مع', en: 'Learn Smarter with' },
      'hero.name': { ar: 'درس خصوصي', en: 'Dars Khsosy' },
      'hero.subtitle': { ar: 'مدرسك الذكي المدعوم بخصائص الذكاء الاصطناعي', en: 'Your Smart Learning Assistant' },
      'hero.description': { ar: 'منصتك التعليمية الشخصية المدعومة بالذكاء الاصطناعي لتجربة تعلم فريدة ومخصصة', en: 'Your personal AI-powered learning platform for a unique and customized learning experience' },
      'hero.cta': { ar: 'ابدأ رحلة التعلم مجاناً', en: 'Start Learning for Free' },
      'hero.login': { ar: 'تسجيل الدخول', en: 'Sign In' },
      'features.title': { ar: 'مميزات تجعل التعلم أسهل', en: 'Features That Make Learning Easier' },
      'features.subtitle': { ar: 'أدوات تعليمية متطورة مصممة خصيصاً لك', en: 'Advanced learning tools designed specifically for you' },
      'feature.ai': { ar: 'معلم ذكي تفاعلي', en: 'Interactive AI Teacher' },
      'feature.ai.desc': { ar: 'محادثة تفاعلية مع معلم ذكي يفهم مستواك وأسلوب تعلمك', en: 'Interactive conversation with an AI teacher that understands your level and learning style' },
      'feature.mindmap': { ar: 'خرائط ذهنية بصرية', en: 'Visual Mind Maps' },
      'feature.mindmap.desc': { ar: 'حوّل أي موضوع إلى خريطة ذهنية تساعدك على الفهم والحفظ', en: 'Transform any topic into a mind map that helps you understand and remember' },
      'feature.summary': { ar: 'تلخيص ذكي للمحتوى', en: 'Smart Content Summaries' },
      'feature.summary.desc': { ar: 'احصل على ملخصات شاملة ومنظمة لأي نص أو مادة دراسية', en: 'Get comprehensive and organized summaries of any text or study material' },
      'feature.test': { ar: 'اختبارات مخصصة', en: 'Personalized Tests' },
      'feature.test.desc': { ar: 'اختبر فهمك مع أسئلة مولدة تلقائياً حسب مستواك', en: 'Test your understanding with auto-generated questions based on your level' },
      'feature.simplify': { ar: 'تبسيط المفاهيم المعقدة', en: 'Simplify Complex Concepts' },
      'feature.simplify.desc': { ar: 'اشرح لي كأنني طفل - تبسيط أي مفهوم بطريقة سهلة الفهم', en: 'Explain Like I\'m 5 - Simplify any concept in an easy-to-understand way' },
      'feature.video': { ar: 'تعلم من الفيديو', en: 'Learn from Video' },
      'feature.video.desc': { ar: 'اسأل أسئلة عن أي فيديو يوتيوب واحصل على إجابات فورية', en: 'Ask questions about any YouTube video and get instant answers' },
      'feature.scientist': { ar: 'حوار مع العلماء', en: 'Chat with Scientists' },
      'feature.scientist.desc': { ar: 'تحدث مع شخصيات علمية تاريخية كأينشتاين ونيوتن', en: 'Talk to historical scientific figures like Einstein and Newton' },
      'feature.studyplan': { ar: 'خطة دراسية ذكية', en: 'Smart Study Plan' },
      'feature.studyplan.desc': { ar: 'خطة دراسية مخصصة بناءً على أهدافك ووقتك المتاح', en: 'A personalized study plan based on your goals and available time' },
      'cta.title': { ar: 'جاهز لتغيير طريقة تعلمك؟', en: 'Ready to Transform Your Learning?' },
      'cta.subtitle': { ar: 'انضم إلى آلاف الطلاب الذين يتعلمون بذكاء مع درس خصوصي', en: 'Join thousands of students learning smarter with Dars Khsosy' },
      'cta.button': { ar: 'أنشئ حسابك مجاناً', en: 'Create Your Free Account' },
      'footer.rights': { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
    };
    return translations[key]?.[language] || key;
  };

  const features = [
    { icon: Bot, title: t('feature.ai'), desc: t('feature.ai.desc'), colorClass: 'bg-feature-ai' },
    { icon: Network, title: t('feature.mindmap'), desc: t('feature.mindmap.desc'), colorClass: 'bg-feature-mindmap' },
    { icon: FileText, title: t('feature.summary'), desc: t('feature.summary.desc'), colorClass: 'bg-feature-summary' },
    { icon: ClipboardCheck, title: t('feature.test'), desc: t('feature.test.desc'), colorClass: 'bg-feature-test' },
    { icon: Lightbulb, title: t('feature.simplify'), desc: t('feature.simplify.desc'), colorClass: 'bg-feature-simplify' },
    { icon: Video, title: t('feature.video'), desc: t('feature.video.desc'), colorClass: 'bg-feature-video' },
    { icon: Users, title: t('feature.scientist'), desc: t('feature.scientist.desc'), colorClass: 'bg-feature-scientist' },
    { icon: Calendar, title: t('feature.studyplan'), desc: t('feature.studyplan.desc'), colorClass: 'bg-feature-studyplan' },
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full gradient-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden" dir={dir}>
      <Seo
        title="منصة درس خصوصي — تعلّم مجاني بالذكاء الاصطناعي"
        description="منصة تعليمية مجانية بالكامل تعتمد على الذكاء الاصطناعي: معلم ذكي، خرائط ذهنية، تبسيط الدروس، بطاقات مراجعة، واختبارات فهم لكل طالب."
        path="/"
      />
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="heading-4 text-foreground">{t('hero.name')}</span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {language === 'ar' ? 'EN' : 'عربي'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth')}>
              {t('hero.login')}
            </Button>
            <Button className="gradient-primary" onClick={() => navigate('/auth')}>
              {t('hero.cta').split(' ').slice(0, 2).join(' ')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 geometric-pattern opacity-50" />
        <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {language === 'ar' ? 'منصة تعليمية مدعومة بالذكاء الاصطناعي' : 'AI-Powered Learning Platform'}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="heading-display text-foreground mb-6 animate-slide-up">
              {t('hero.title')}
              <span className="block mt-2 bg-gradient-to-r from-primary via-teal-glow to-accent-foreground bg-clip-text text-transparent">
                {t('hero.name')}
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="heading-3 text-primary mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {t('hero.subtitle')}
            </p>
            
            {/* Description */}
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {t('hero.description')}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Button 
                size="lg" 
                className="gradient-primary text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={() => navigate('/auth')}
              >
                {t('hero.cta')}
                <ArrowIcon className="w-5 h-5 ms-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 rounded-2xl"
                onClick={() => navigate('/auth')}
              >
                {t('hero.login')}
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-16 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="text-center">
                <div className="heading-2 text-foreground">8+</div>
                <div className="caption">{language === 'ar' ? 'أداة تعليمية' : 'Learning Tools'}</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="heading-2 text-foreground flex items-center justify-center gap-1">
                  <Star className="w-6 h-6 text-accent-foreground fill-accent-foreground" />
                  AI
                </div>
                <div className="caption">{language === 'ar' ? 'مدعوم بالذكاء' : 'Powered'}</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="heading-2 text-foreground">24/7</div>
                <div className="caption">{language === 'ar' ? 'متاح دائماً' : 'Available'}</div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/30 relative">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="heading-1 text-foreground mb-4">
              {t('features.title')}
            </h2>
            <p className="body-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-card rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="heading-4 text-foreground mb-2">{feature.title}</h3>
                <p className="body-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-8 shadow-glow animate-float">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="heading-1 text-foreground mb-4">
              {t('cta.title')}
            </h2>
            <p className="body-lg text-muted-foreground mb-10">
              {t('cta.subtitle')}
            </p>
            <Button 
              size="lg" 
              className="gradient-accent text-lg px-10 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              {t('cta.button')}
              <ArrowIcon className="w-5 h-5 ms-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">{t('hero.name')}</span>
            </div>
            <p className="caption">
              © {new Date().getFullYear()} {t('hero.name')}. {t('footer.rights')}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {language === 'ar' ? 'English' : 'العربية'}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
