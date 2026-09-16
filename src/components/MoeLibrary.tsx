import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUploadedMaterials } from '@/hooks/useUploadedMaterials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Folder, FileText, Download, ArrowUpRight, Library, ExternalLink } from 'lucide-react';

interface Props {
  language: 'ar' | 'en';
}

interface Entry { name: string; url: string }

const ROOT = 'https://studentbooks.moe.gov.eg/books/';

const SHORTCUTS: { ar: string; en: string; url: string }[] = [
  { ar: 'رياض الأطفال', en: 'Kindergarten', url: 'https://studentbooks.moe.gov.eg/books/Books-Kindergarten/' },
  { ar: 'المرحلة الابتدائية', en: 'Primary', url: 'https://studentbooks.moe.gov.eg/books/Books-Primary/' },
  { ar: 'المرحلة الإعدادية', en: 'Preparatory', url: 'https://studentbooks.moe.gov.eg/books/Books-Preparatory/' },
  { ar: 'المرحلة الثانوية', en: 'Secondary', url: 'https://studentbooks.moe.gov.eg/books/Books-Secondary/' },
];

const MoeLibrary: React.FC<Props> = ({ language }) => {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const { fetchMaterials, extractDocumentContent } = useUploadedMaterials();

  const [currentUrl, setCurrentUrl] = useState(ROOT);
  const [history, setHistory] = useState<string[]>([]);
  const [folders, setFolders] = useState<Entry[]>([]);
  const [files, setFiles] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');

  const browse = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('moe-books', {
        body: { action: 'list', url },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setFolders(data.folders || []);
      setFiles(data.files || []);
      if ((data.folders || []).length === 0 && (data.files || []).length === 0) {
        setError(t('لم يتم العثور على كتب في هذا القسم.', 'No books found in this section.'));
      }
    } catch (e) {
      console.error(e);
      setFolders([]);
      setFiles([]);
      setError(t(
        'تعذّر الوصول إلى مكتبة الوزارة الآن. يمكنك نسخ رابط الكتاب (PDF) من موقع الوزارة ولصقه بالأسفل لاستيراده مباشرة.',
        'Could not reach the ministry library right now. Paste a direct PDF book link below to import it.'
      ));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { browse(currentUrl); }, [currentUrl, browse]);

  const openFolder = (url: string) => {
    setHistory(prev => [...prev, currentUrl]);
    setCurrentUrl(url);
  };

  const goBack = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop()!;
      setCurrentUrl(last);
      return next;
    });
  };

  const importBook = async (url: string, name: string) => {
    setImporting(url);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('moe-books', {
        body: { action: 'import', url },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const material = data.material;
      toast({ title: t(`تم تحميل «${name}» وإضافته إلى موادك`, `"${name}" added to your materials`) });
      await fetchMaterials();

      toast({ title: t('جارٍ استخراج محتوى الكتاب...', 'Extracting book content...') });
      const result = await extractDocumentContent(material.id, material.storage_path, 'application/pdf');
      toast({
        title: result.success
          ? t('أصبح الكتاب جاهزًا للاستخدام مع كل خصائص التطبيق', 'The book is ready to use across the app')
          : t('تم حفظ الكتاب، لكن تعذّر استخراج نصه الآن', 'Book saved, but text extraction failed'),
        variant: result.success ? undefined : 'destructive',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: t('تعذّر استيراد الكتاب، حاول مرة أخرى', 'Could not import the book, try again'),
        variant: 'destructive',
      });
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-primary to-accent text-white shadow-lg">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Library className="w-6 h-6" />
            {t('مكتبة كتب وزارة التربية والتعليم', 'Ministry of Education Book Library')}
          </h1>
          <p className="text-sm opacity-90 mt-1">
            {t(
              'اختر كتابك من كتب الوزارة ليُحمَّل تلقائيًا ويصبح مادة داخل التطبيق تستخدمها مع المعلم الذكي والملخصات والاختبارات.',
              'Pick a ministry book and it is downloaded automatically and becomes a material you can use across the app.'
            )}
          </p>
          <a
            href="https://studentbooks.moe.gov.eg/books/Books-Kindergarten/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs mt-3 underline opacity-90"
          >
            {t('فتح موقع المكتبة', 'Open the library site')} <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex flex-wrap gap-2">
          {SHORTCUTS.map(s => (
            <Button
              key={s.url}
              variant={currentUrl === s.url ? 'default' : 'outline'}
              size="sm"
              onClick={() => openFolder(s.url)}
            >
              {language === 'ar' ? s.ar : s.en}
            </Button>
          ))}
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowUpRight className="w-4 h-4 me-1" />{t('رجوع', 'Back')}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {error && (
              <Card><CardContent className="py-4 text-sm text-muted-foreground">{error}</CardContent></Card>
            )}
            {folders.map(f => (
              <button
                key={f.url}
                onClick={() => openFolder(f.url)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted text-start"
              >
                <Folder className="w-5 h-5 text-primary shrink-0" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
            {files.map(f => (
              <div key={f.url} className="flex items-center gap-3 p-3 rounded-xl border">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="flex-1 truncate text-sm">{f.name}</span>
                <Button size="sm" onClick={() => importBook(f.url, f.name)} disabled={importing !== null}>
                  {importing === f.url ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span className="ms-1 hidden sm:inline">{t('استيراد', 'Import')}</span>
                </Button>
              </div>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="pt-5 space-y-3">
            <p className="text-sm font-medium">
              {t('أو الصق رابط الكتاب (PDF) من موقع الوزارة', 'Or paste a direct ministry PDF link')}
            </p>
            <div className="flex gap-2">
              <Input
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                placeholder="https://studentbooks.moe.gov.eg/books/.../book.pdf"
                dir="ltr"
              />
              <Button
                onClick={() => manualUrl.trim() && importBook(manualUrl.trim(), manualUrl.split('/').pop() || 'book.pdf')}
                disabled={importing !== null || !manualUrl.trim()}
              >
                {importing === manualUrl.trim() ? <Loader2 className="w-4 h-4 animate-spin" /> : t('استيراد', 'Import')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MoeLibrary;
