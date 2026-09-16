import React, { useLayoutEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Heart, Lightbulb, Users, GraduationCap, Sparkles,
    Bot, Upload, Network, BookOpen, FileText, FlaskConical,
    Video, ClipboardCheck, TrendingUp, Link2, CalendarClock,
    Layers, Presentation, Gamepad2, Globe, ShieldCheck, Rocket
} from 'lucide-react';
import gsap from 'gsap';

interface AboutPageProps {
    language: 'ar' | 'en';
}

const AboutPage: React.FC<AboutPageProps> = ({ language }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);
    const dir = language === 'ar' ? 'rtl' : 'ltr';

    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            gsap.from('.about-hero-animate', {
                y: 20,
                opacity: 0,
                duration: 0.8,
                ease: 'power2.out',
                stagger: 0.1
            });

            if (cardsRef.current) {
                gsap.from(cardsRef.current.children, {
                    y: 30,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out',
                    delay: 0.3
                });
            }
        }, containerRef);

        return () => ctx.revert();
    }, [language]);

    const IconWrapper = ({ children, colorClass }: { children: React.ReactNode, colorClass: string }) => (
        <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center mb-4 shadow-sm`}>
            {children}
        </div>
    );

    const features = [
        { icon: Bot, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30', ar: 'المعلم الذكي', arDesc: 'مساعد تعليمي بالذكاء الاصطناعي يشرح ويجيب على أسئلتك بأسلوب مبسّط وحواري على مدار الساعة.', en: 'AI Teacher', enDesc: 'A 24/7 AI tutor that explains and answers your questions in a simple, conversational way.' },
        { icon: Upload, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', ar: 'رفع المواد', arDesc: 'ارفع ملفاتك ومستنداتك (PDF، صور، نصوص) ليتعلم منها المعلم الذكي ويشرحها لك.', en: 'Upload Materials', enDesc: 'Upload your files (PDF, images, text) so the AI can learn from and explain them to you.' },
        { icon: Network, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30', ar: 'الخرائط الذهنية', arDesc: 'حوّل أي موضوع إلى خريطة ذهنية تفاعلية قابلة للتكبير والتصدير كصورة لتنظيم أفكارك.', en: 'Mind Maps', enDesc: 'Turn any topic into an interactive mind map you can zoom and export as an image.' },
        { icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', ar: 'تبسيط المفاهيم', arDesc: 'اشرح لي كأنني في الخامسة — تبسيط المفاهيم الصعبة إلى كلمات سهلة وأمثلة قريبة.', en: 'Simplify Concepts', enDesc: 'Explain Like I\'m 5 — breaks down complex ideas into easy words and relatable examples.' },
        { icon: FileText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', ar: 'الملخصات', arDesc: 'ملخصات ذكية وسريعة لأي درس أو مادة لتراجع أهم النقاط في دقائق.', en: 'Summaries', enDesc: 'Smart, fast summaries of any lesson so you can review the key points in minutes.' },
        { icon: FlaskConical, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', ar: 'حوار مع العلماء', arDesc: 'تحدّث مع شخصيات علمية وتاريخية بأسلوب تمثيلي ممتع يجعل التعلم مغامرة.', en: 'Scientist Roleplay', enDesc: 'Chat with scientific & historical figures in a fun roleplay that turns learning into an adventure.' },
        { icon: Video, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', ar: 'التعلم بالفيديو', arDesc: 'شرح مدعوم بمقاطع يوتيوب تعليمية مختارة بعناية حسب موضوعك.', en: 'Video Learning', enDesc: 'Learning enhanced with carefully selected YouTube videos relevant to your topic.' },
        { icon: ClipboardCheck, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30', ar: 'اختبارات الفهم', arDesc: 'اختبارات اختيار من متعدد وأسئلة مقالية مع إجابات نموذجية لقياس استيعابك.', en: 'Understanding Tests', enDesc: 'MCQ and written quizzes with model answers to measure how well you understood.' },
        { icon: Layers, color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', ar: 'البطاقات التعليمية', arDesc: 'بطاقات مراجعة (Flashcards) تفاعلية تولّد تلقائياً لتثبيت المعلومات في ذاكرتك.', en: 'Flashcards', enDesc: 'Auto-generated interactive flashcards to lock information into your memory.' },
        { icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', ar: 'متابعة التقدّم', arDesc: 'لوحة تتابع إنجازك ونشاطك التعليمي وتحفزك على الاستمرار.', en: 'Progress Tracking', enDesc: 'A dashboard that tracks your achievements and keeps you motivated.' },
        { icon: Link2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', ar: 'شرح الروابط', arDesc: 'الصق أي رابط ويقوم النظام بقراءته وشرح محتواه لك بشكل مبسّط.', en: 'Web Link Explainer', enDesc: 'Paste any link and the system reads and explains its content in simple terms.' },
        { icon: CalendarClock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', ar: 'خطة الدراسة', arDesc: 'مولّد خطط دراسية مخصصة حسب أهدافك ووقتك المتاح لتنظيم رحلتك.', en: 'Study Plan', enDesc: 'A personalized study-plan generator based on your goals and available time.' },
        { icon: Rocket, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/30', ar: 'اقتراح المشاريع', arDesc: 'أفكار مشاريع عملية وإبداعية مقترحة لتطبيق ما تعلمته على أرض الواقع.', en: 'Project Suggestions', enDesc: 'Practical, creative project ideas to apply what you\'ve learned in real life.' },
        { icon: Presentation, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30', ar: 'القاعة الافتراضية', arDesc: 'أنشئ وأدر جلسات مباشرة عبر Zoom وGoogle Meet وTeams وشاركها بسهولة.', en: 'Virtual Classroom', enDesc: 'Create and manage live sessions over Zoom, Google Meet & Teams and share them easily.' },
        { icon: Gamepad2, color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-100 dark:bg-lime-900/30', ar: 'ألعاب تعليمية للأطفال', arDesc: 'ألعاب وبازل تفاعلية للجمع والطرح والحروف تجعل الأطفال يتعلمون وهم يلعبون ويلوّنون.', en: 'Kids Learning Games', enDesc: 'Interactive puzzles for math & letters that let kids learn while they play and color.' },
        { icon: Globe, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', ar: 'دعم لغتين كامل', arDesc: 'واجهة ومحتوى بالعربية والإنجليزية مع دعم كامل للكتابة من اليمين لليسار.', en: 'Full Bilingual Support', enDesc: 'Full Arabic & English interface and content with complete right-to-left support.' },
        { icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', ar: 'حساب آمن ومحادثات محفوظة', arDesc: 'تسجيل دخول آمن مع حفظ محادثاتك المنفصلة لكل ميزة والعودة إليها في أي وقت.', en: 'Secure Account & Saved Chats', enDesc: 'Secure sign-in with separate saved conversations per feature you can return to anytime.' },
    ];

    return (
        <div
            ref={containerRef}
            className="h-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col"
            dir={dir}
        >
            <ScrollArea className="flex-1 px-4 py-8 md:py-12 lg:py-16" dir={dir}>
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12 md:mb-16 space-y-4 about-hero-animate">
                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
                            <GraduationCap className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white">
                            {t('عن "درس خصوصي"', 'About "Dars Khusoosi"')}
                        </h1>
                        <p className="text-xl md:text-2xl font-bold text-primary flex items-center justify-center gap-2">
                            <Heart className="w-6 h-6 fill-current" />
                            {t('رحلة تعليم بتبدأ من القلب', 'A Learning Journey from the Heart')}
                        </p>
                    </div>

                    {/* Main Story Card */}
                    <div className="about-hero-animate mb-12">
                        <Card className="p-6 md:p-10 lg:p-12 border-none shadow-xl bg-white dark:bg-slate-900 relative overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 rounded-[2rem]">
                            <div className={`absolute top-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-2 h-full bg-primary`} />
                            <p className="text-lg md:text-2xl leading-relaxed text-slate-700 dark:text-slate-300 font-medium text-start" style={{ textAlign: 'justify' }}>
                                {t(
                                    'التطبيق ده مش مجرد منصة تعليمية، ده حلم ورسالة. الفكرة اتولدت من أب (EMS) كان بيدور على أحسن وأمتع طريقة يعلم بيها ولاده، وقرر يحول الحلم ده لواقع. "درس خصوصي" هو إهداء خاص جداً وغالي من الوالد لـ "عمر" و "عبد الله"، وعشان الخير بيعم، الإهداء ده كبر عشان يشمل كل طالب وكل إنسان شغوف بيدور على طريقة مختلفة ومبتكرة للتعلم.',
                                    'This app is not just a learning platform; it is a dream and a mission. Born from a father\'s (EMS) search for the best way to teach his children, "Dars Khusoosi" is a precious gift to "Omar" and "Abdullah". This gift has grown to include every student seeking an innovative, heart-led way to learn.'
                                )}
                            </p>
                        </Card>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" ref={cardsRef} style={{ display: 'grid' }}>
                        {/* Why */}
                        <Card className="flex flex-col h-full p-8 border-none shadow-lg bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 rounded-3xl transition-transform hover:-translate-y-1 text-start">
                            <IconWrapper colorClass="bg-amber-100 dark:bg-amber-900/30">
                                <Lightbulb className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                            </IconWrapper>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 text-start">
                                {t('لماذا هذا التطبيق؟', 'Why Dars Khusoosi?')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-start">
                                {t(
                                    'أسلوب بيكسر الملل وبيخاطب الفضول، عشان تستمتع بكل معلومة جديدة بتعرفها وبطرق بتحترم ذكاءك.',
                                    'Breaking boredom through curiousity. We respect your intelligence by teaching through discovery.'
                                )}
                            </p>
                        </Card>

                        {/* Charity */}
                        <Card className="flex flex-col h-full p-8 border-none shadow-lg bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 rounded-3xl transition-transform hover:-translate-y-1 text-start">
                            <IconWrapper colorClass="bg-rose-100 dark:bg-rose-900/30">
                                <Heart className="w-7 h-7 text-rose-600 dark:text-rose-400" />
                            </IconWrapper>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 text-start">
                                {t('عمل خيري 100%', '100% Charitable')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-start">
                                {t(
                                    'المنصة مجانية بالكامل. هدفنا مساعدة كل عقل عايز يتعلم ويوصل لحلمه بدون أي حواجز مادية.',
                                    'Completely free of charge. Our goal is to break all financial barriers between you and your education.'
                                )}
                            </p>
                        </Card>

                        {/* Legacy */}
                        <Card className="flex flex-col h-full p-8 border-none shadow-lg bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 rounded-3xl transition-transform hover:-translate-y-1 text-start">
                            <IconWrapper colorClass="bg-emerald-100 dark:bg-emerald-900/30">
                                <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                            </IconWrapper>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 text-start">
                                {t('إرث يكبر بكم', 'A Growing Legacy')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-start">
                                {t(
                                    'من عمر وعبد الله إلى كل العالم. نبني مجتمعاً يشجع بعضه البعض لنترك أثراً جميلاً.',
                                    'From Omar & Abdullah to the world. Building a supportive community to leave a lasting positive impact.'
                                )}
                            </p>
                        </Card>
                    </div>

                    {/* Full Features Showcase (Marketing) */}
                    <div className="about-hero-animate mb-6 text-center space-y-3">
                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10">
                            <Sparkles className="w-7 h-7 text-primary" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                            {t('كل ما يقدمه التطبيق', 'Everything the App Offers')}
                        </h2>
                        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                            {t(
                                'منظومة تعليمية متكاملة مدعومة بالذكاء الاصطناعي تجمع كل ما تحتاجه للتعلم والمراجعة والإبداع في مكان واحد.',
                                'A complete AI-powered learning ecosystem bringing everything you need to learn, review and create in one place.'
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                        {features.map((f, idx) => {
                            const Icon = f.icon;
                            return (
                                <Card
                                    key={idx}
                                    className="flex flex-col h-full p-6 border-none shadow-md bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl text-start"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 shadow-sm`}>
                                        <Icon className={`w-6 h-6 ${f.color}`} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 text-start">
                                        {t(f.ar, f.en)}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-start">
                                        {t(f.arDesc, f.enDesc)}
                                    </p>
                                </Card>
                            );
                        })}
                    </div>



                    {/* Personal Message */}
                    <div className="about-hero-animate mb-8">
                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-8 md:p-10 rounded-[2.5rem] text-center relative overflow-hidden">
                            <Sparkles className="w-10 h-10 text-primary mx-auto mb-6 opacity-80" />
                            <p className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-200 italic leading-snug">
                                {t(
                                    '"وزي ما احنا متفقين دايماً، لو في أي وقت حسيت إنك محتاج تعدل أي حاجة أو في جزء مش عاجبك، أنا دايماً موجود هنا في الشات عشان أظبطلك الدنيا."',
                                    '"As we always agree, if you ever feel something needs adjustment or isn\'t to your liking, I am always here to set things right for you."'
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="about-hero-animate">
                        <Card className="p-6 border-none shadow-md bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center gap-4 text-center">
                            <div className="flex items-center gap-3 text-primary font-bold text-lg">
                                <Heart className="w-5 h-5 fill-current" />
                                <span>{t('تواصل معنا', 'Contact Us')}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                                {t(
                                    'إذا كنت بحاجة إلى أي تعديلات أو لديك اقتراحات لتحسين التجربة، يسعدنا تواصلك معنا عبر البريد الإلكتروني:',
                                    'If you need any edits or have suggestions to improve the experience, we would love to hear from you via email:'
                                )}
                            </p>
                            <a
                                href="mailto:eeye12433@gmail.com"
                                className="text-xl md:text-2xl font-black text-primary hover:underline transition-all"
                            >
                                eeye12433@gmail.com
                            </a>
                        </Card>
                    </div>

                    <div className="h-20" />
                </div>
            </ScrollArea>
        </div>
    );
};


export default AboutPage;
