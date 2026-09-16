// Subject color system for visual differentiation
export type Subject = 
  | 'physics' 
  | 'chemistry' 
  | 'math' 
  | 'biology' 
  | 'history' 
  | 'arabic' 
  | 'english' 
  | 'general';

export interface SubjectTheme {
  id: Subject;
  nameAr: string;
  nameEn: string;
  icon: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
}

export const subjectThemes: Record<Subject, SubjectTheme> = {
  physics: {
    id: 'physics',
    nameAr: 'الفيزياء',
    nameEn: 'Physics',
    icon: '⚛️',
    primary: 'hsl(220, 90%, 50%)',
    secondary: 'hsl(220, 85%, 95%)',
    accent: 'hsl(220, 90%, 60%)',
    gradient: 'linear-gradient(135deg, hsl(220, 90%, 50%), hsl(200, 90%, 55%))',
  },
  chemistry: {
    id: 'chemistry',
    nameAr: 'الكيمياء',
    nameEn: 'Chemistry',
    icon: '🧪',
    primary: 'hsl(160, 84%, 39%)',
    secondary: 'hsl(160, 80%, 95%)',
    accent: 'hsl(160, 84%, 49%)',
    gradient: 'linear-gradient(135deg, hsl(160, 84%, 39%), hsl(140, 80%, 45%))',
  },
  math: {
    id: 'math',
    nameAr: 'الرياضيات',
    nameEn: 'Mathematics',
    icon: '📐',
    primary: 'hsl(270, 70%, 55%)',
    secondary: 'hsl(270, 65%, 95%)',
    accent: 'hsl(270, 70%, 65%)',
    gradient: 'linear-gradient(135deg, hsl(270, 70%, 55%), hsl(290, 70%, 60%))',
  },
  biology: {
    id: 'biology',
    nameAr: 'الأحياء',
    nameEn: 'Biology',
    icon: '🌿',
    primary: 'hsl(120, 60%, 45%)',
    secondary: 'hsl(120, 55%, 95%)',
    accent: 'hsl(120, 60%, 55%)',
    gradient: 'linear-gradient(135deg, hsl(120, 60%, 45%), hsl(100, 60%, 50%))',
  },
  history: {
    id: 'history',
    nameAr: 'التاريخ',
    nameEn: 'History',
    icon: '📜',
    primary: 'hsl(35, 80%, 45%)',
    secondary: 'hsl(35, 75%, 95%)',
    accent: 'hsl(35, 80%, 55%)',
    gradient: 'linear-gradient(135deg, hsl(35, 80%, 45%), hsl(25, 80%, 50%))',
  },
  arabic: {
    id: 'arabic',
    nameAr: 'اللغة العربية',
    nameEn: 'Arabic',
    icon: '📖',
    primary: 'hsl(350, 70%, 50%)',
    secondary: 'hsl(350, 65%, 95%)',
    accent: 'hsl(350, 70%, 60%)',
    gradient: 'linear-gradient(135deg, hsl(350, 70%, 50%), hsl(330, 70%, 55%))',
  },
  english: {
    id: 'english',
    nameAr: 'اللغة الإنجليزية',
    nameEn: 'English',
    icon: '🔤',
    primary: 'hsl(210, 80%, 55%)',
    secondary: 'hsl(210, 75%, 95%)',
    accent: 'hsl(210, 80%, 65%)',
    gradient: 'linear-gradient(135deg, hsl(210, 80%, 55%), hsl(190, 80%, 50%))',
  },
  general: {
    id: 'general',
    nameAr: 'عام',
    nameEn: 'General',
    icon: '📚',
    primary: 'hsl(174, 84%, 32%)',
    secondary: 'hsl(174, 80%, 95%)',
    accent: 'hsl(174, 84%, 42%)',
    gradient: 'linear-gradient(135deg, hsl(174, 84%, 32%), hsl(154, 84%, 37%))',
  },
};

export const getSubjectTheme = (subject: string): SubjectTheme => {
  return subjectThemes[subject as Subject] || subjectThemes.general;
};

export const getSubjectName = (subject: string, language: 'ar' | 'en'): string => {
  const theme = getSubjectTheme(subject);
  return language === 'ar' ? theme.nameAr : theme.nameEn;
};

export const getAllSubjects = (): SubjectTheme[] => {
  return Object.values(subjectThemes);
};

/* ---------------------------------------------------------------
 * Subject visual identity tokens
 * Each subject drives the whole app palette (light + dark).
 * ------------------------------------------------------------- */

interface SubjectHue {
  hue: number;
  sat: number;
  hue2: number; // secondary hue used for gradients
}

const subjectHues: Record<Subject, SubjectHue> = {
  physics: { hue: 220, sat: 90, hue2: 200 },
  chemistry: { hue: 160, sat: 84, hue2: 140 },
  math: { hue: 270, sat: 70, hue2: 290 },
  biology: { hue: 120, sat: 60, hue2: 100 },
  history: { hue: 35, sat: 80, hue2: 25 },
  arabic: { hue: 350, sat: 70, hue2: 330 },
  english: { hue: 210, sat: 80, hue2: 190 },
  general: { hue: 174, sat: 84, hue2: 154 },
};

export type SubjectTokens = Record<string, string>;

export const getSubjectTokens = (subject: string, isDark: boolean): SubjectTokens => {
  const s = (subjectThemes[subject as Subject] ? subject : 'general') as Subject;
  const { hue, sat, hue2 } = subjectHues[s];
  const h = `${hue}`;
  const sa = `${sat}%`;

  if (isDark) {
    return {
      '--primary': `${h} ${sa} 62%`,
      '--primary-foreground': `${h} 60% 10%`,
      '--accent': `${h} 45% 18%`,
      '--accent-foreground': `${h} ${sa} 70%`,
      '--ring': `${h} ${sa} 62%`,
      '--header-bg': `${h} 45% 12%`,
      '--header-foreground': `${h} 25% 96%`,
      '--header-muted': `${h} 15% 75%`,
      '--sidebar-background': `${h} 20% 9%`,
      '--sidebar-primary': `${h} ${sa} 62%`,
      '--sidebar-primary-foreground': `${h} 60% 10%`,
      '--sidebar-accent': `${h} 30% 18%`,
      '--sidebar-accent-foreground': `${h} 40% 92%`,
      '--sidebar-ring': `${h} ${sa} 62%`,
      '--chart-1': `${h} ${sa} 62%`,
      '--chart-2': `${hue2} ${sa} 60%`,
      '--chart-3': `${(hue + 40) % 360} 70% 60%`,
      '--chart-4': `${(hue + 320) % 360} 65% 60%`,
      '--subject-gradient': `linear-gradient(135deg, hsl(${hue}, ${sat}%, 52%), hsl(${hue2}, ${sat}%, 45%))`,
      '--shadow-glow': `0 0 30px hsl(${hue} ${sat}% 55% / 0.35)`,
    };
  }

  return {
    '--primary': `${h} ${sa} 42%`,
    '--primary-foreground': `${h} 40% 98%`,
    '--accent': `${h} 60% 94%`,
    '--accent-foreground': `${h} ${sa} 30%`,
    '--ring': `${h} ${sa} 42%`,
    '--header-bg': `${h} 45% 18%`,
    '--header-foreground': `${h} 25% 96%`,
    '--header-muted': `${h} 18% 82%`,
    '--sidebar-background': `${h} 30% 95%`,
    '--sidebar-primary': `${h} ${sa} 42%`,
    '--sidebar-primary-foreground': `${h} 40% 98%`,
    '--sidebar-accent': `${h} 40% 88%`,
    '--sidebar-accent-foreground': `${h} ${sa} 22%`,
    '--sidebar-ring': `${h} ${sa} 42%`,
    '--chart-1': `${h} ${sa} 45%`,
    '--chart-2': `${hue2} ${sat}% 45%`,
    '--chart-3': `${(hue + 40) % 360} 70% 50%`,
    '--chart-4': `${(hue + 320) % 360} 65% 50%`,
    '--subject-gradient': `linear-gradient(135deg, hsl(${hue}, ${sat}%, 42%), hsl(${hue2}, ${sat}%, 38%))`,
    '--shadow-glow': `0 0 30px hsl(${hue} ${sat}% 42% / 0.25)`,
  };
};
