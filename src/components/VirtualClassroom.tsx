import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Users,
    Video,
    ExternalLink,
    Plus,
    Calendar,
    Clock,
    Shield,
    Presentation,
    CheckCircle2,
    Loader2,
    PlusCircle,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useVirtualMeetings, VirtualMeeting } from '@/hooks/useVirtualMeetings';
import { useProfile } from '@/hooks/useProfile';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';

interface VirtualClassroomProps {
    language: 'ar' | 'en';
}

const VirtualClassroom: React.FC<VirtualClassroomProps> = ({ language }) => {
    const { profile } = useProfile();
    const { meetings, loading, createMeeting, deleteMeeting } = useVirtualMeetings();
    const [meetingLink, setMeetingLink] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newMeeting, setNewMeeting] = useState({
        title: '',
        meeting_link: '',
        start_time: '',
        duration: '45m'
    });
    const [creating, setCreating] = useState(false);

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            ar: {
                'title': 'القاعة الافتراضية',
                'subtitle': 'تواصل مع المعلمين والزملاء في بث مباشر',
                'enterLink': 'أدخل رابط الاجتماع (Zoom, Meet, Teams)',
                'joinNow': 'انضم الآن',
                'scheduleTitle': 'اللقاءات القادمة',
                'noMeetings': 'لا توجد اجتماعات مجدولة حالياً',
                'createMeeting': 'إنشاء جلسة جديدة',
                'placeholder': 'https://zoom.us/j/...',
                'recommendTeachers': 'معلمون متاحون الآن',
                'platformSupport': 'المنصات المدعومة',
                'teamsDesc': 'مثالي للدراسة الجماعية',
                'zoomDesc': 'محاضرات المعلمين المباشرة',
                'meetDesc': 'سهل وسريع للمراجعة',
                'invalidLink': 'الرجاء إدخال رابط صحيح',
                'copied': 'تم النسخ!',
                'meetingTitle': 'عنوان الجلسة',
                'startTime': 'وقت البدء',
                'duration': 'المدة',
                'cancel': 'إلغاء',
                'save': 'حفظ الجلسة',
                'successCreate': 'تم إنشاء الجلسة بنجاح',
                'errorCreate': 'حدث خطأ أثناء إنشاء الجلسة',
                'deleteConfirm': 'حذف الجلسة',
            },
            en: {
                'title': 'Virtual Classroom',
                'subtitle': 'Connect with teachers and peers in real-time',
                'enterLink': 'Enter meeting link (Zoom, Meet, Teams)',
                'joinNow': 'Join Now',
                'scheduleTitle': 'Upcoming Sessions',
                'noMeetings': 'No scheduled meetings yet',
                'createMeeting': 'Create New Session',
                'placeholder': 'https://zoom.us/j/...',
                'recommendTeachers': 'Teachers Available Now',
                'platformSupport': 'Supported Platforms',
                'teamsDesc': 'Great for study groups',
                'zoomDesc': 'Direct teacher lectures',
                'meetDesc': 'Quick and easy review',
                'invalidLink': 'Please enter a valid link',
                'copied': 'Copied!',
                'meetingTitle': 'Session Title',
                'startTime': 'Start Time',
                'duration': 'Duration',
                'cancel': 'Cancel',
                'save': 'Save Session',
                'successCreate': 'Session created successfully',
                'errorCreate': 'Error creating session',
                'deleteConfirm': 'Delete Session',
            }
        };
        return translations[language][key] || key;
    };

    const platforms = [
        { name: 'Zoom', icon: Video, color: 'bg-blue-500', desc: t('zoomDesc') },
        { name: 'Google Meet', icon: Users, color: 'bg-green-500', desc: t('meetDesc') },
        { name: 'MS Teams', icon: Shield, color: 'bg-indigo-500', desc: t('teamsDesc') },
    ];

    const handleJoin = (linkToJoin?: string) => {
        const link = linkToJoin || meetingLink;
        if (!link.trim() || !link.startsWith('http')) {
            toast.error(t('invalidLink'));
            return;
        }
        window.open(link, '_blank');
    };

    const handleCreateMeeting = async () => {
        if (!newMeeting.title || !newMeeting.meeting_link || !newMeeting.start_time) {
            toast.error(t('invalidLink'));
            return;
        }

        setCreating(true);
        const { error } = await createMeeting({
            ...newMeeting,
            teacher_name: profile?.name || 'Teacher'
        });

        setCreating(false);
        if (error) {
            toast.error(t('errorCreate'));
        } else {
            toast.success(t('successCreate'));
            setIsCreateOpen(false);
            setNewMeeting({ title: '', meeting_link: '', start_time: '', duration: '45m' });
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const { error } = await deleteMeeting(id);
        if (!error) toast.success(language === 'ar' ? 'تم حذف الجلسة' : 'Session deleted');
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 custom-scrollbar gsap-theme-animate">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Presentation className="w-8 h-8 text-primary" />
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground">{t('subtitle')}</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gradient-primary shadow-glow h-12 px-6 rounded-xl">
                                <Plus className="w-5 h-5 me-2" />
                                {t('createMeeting')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{t('createMeeting')}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">{t('meetingTitle')}</Label>
                                    <Input
                                        id="title"
                                        value={newMeeting.title}
                                        onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                                        placeholder={language === 'ar' ? 'مثلاً: مراجعة العلوم' : 'e.g. Science Review'}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="link">{t('enterLink')}</Label>
                                    <Input
                                        id="link"
                                        value={newMeeting.meeting_link}
                                        onChange={e => setNewMeeting({ ...newMeeting, meeting_link: e.target.value })}
                                        placeholder="https://zoom.us/..."
                                        dir="ltr"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="start">{t('startTime')}</Label>
                                        <Input
                                            id="start"
                                            type="datetime-local"
                                            value={newMeeting.start_time}
                                            onChange={e => setNewMeeting({ ...newMeeting, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration">{t('duration')}</Label>
                                        <Input
                                            id="duration"
                                            value={newMeeting.duration}
                                            onChange={e => setNewMeeting({ ...newMeeting, duration: e.target.value })}
                                            placeholder="45m"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('cancel')}</Button>
                                <Button onClick={handleCreateMeeting} disabled={creating} className="gradient-primary">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <PlusCircle className="w-4 h-4 me-2" />}
                                    {t('save')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Join Card */}
                    <Card className="lg:col-span-2 p-6 border-primary/20 bg-primary/5/30 backdrop-blur-sm overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-500"></div>

                        <div className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="meeting-link" className="text-base font-semibold">{t('enterLink')}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="meeting-link"
                                        placeholder={t('placeholder')}
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        className="h-14 bg-background/80 text-lg border-2 focus:border-primary transition-all duration-300"
                                        dir="ltr"
                                    />
                                    <Button
                                        onClick={() => handleJoin()}
                                        className="h-14 px-8 gradient-primary shadow-lg hover:shadow-primary/20 transition-all duration-300"
                                    >
                                        <ExternalLink className="w-5 h-5 me-2" />
                                        {t('joinNow')}
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4">{t('platformSupport')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {platforms.map((p) => (
                                        <div key={p.name} className="flex flex-col p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-help">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={cn("w-2 h-2 rounded-full", p.color)}></div>
                                                <span className="font-medium text-sm">{p.name}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Schedule */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            {t('scheduleTitle')}
                        </h2>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : meetings.length > 0 ? (
                                meetings.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => handleJoin(session.meeting_link)}
                                        className="p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors cursor-pointer group relative"
                                    >
                                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors pr-6">{session.title}</h3>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {session.teacher_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(session.start_time).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {profile?.id === session.user_id && (
                                            <button
                                                onClick={(e) => handleDelete(session.id, e)}
                                                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">{t('noMeetings')}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VirtualClassroom;
