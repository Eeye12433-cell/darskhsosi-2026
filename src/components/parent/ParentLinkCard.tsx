import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Loader2, RefreshCw, ShieldCheck, Trash2, Users } from 'lucide-react';

interface Props {
  language: 'ar' | 'en';
}

interface InviteCode {
  id: string;
  code: string;
  used_by: string | null;
  expires_at: string;
}

interface LinkRow {
  id: string;
  parent_id: string;
  created_at: string;
}

const t = (language: 'ar' | 'en') => ({
  title: language === 'ar' ? 'ربط ولي الأمر' : 'Parent Link',
  desc:
    language === 'ar'
      ? 'أنشئ كود دعوة وأعطه لولي أمرك ليتابع تقدمك للقراءة فقط. الكود صالح لسبعة أيام ويُستخدم مرة واحدة.'
      : 'Generate an invite code for your parent to follow your progress in read-only mode. Valid for 7 days, single use.',
  generate: language === 'ar' ? 'إنشاء كود دعوة' : 'Generate invite code',
  copy: language === 'ar' ? 'نسخ' : 'Copy',
  copied: language === 'ar' ? 'تم نسخ الكود' : 'Code copied',
  active: language === 'ar' ? 'أكواد نشطة' : 'Active codes',
  used: language === 'ar' ? 'مستخدم' : 'Used',
  linked: language === 'ar' ? 'أولياء الأمور المرتبطون' : 'Linked parents',
  none: language === 'ar' ? 'لا يوجد ارتباط حالياً' : 'No links yet',
  unlink: language === 'ar' ? 'فك الارتباط' : 'Unlink',
  unlinked: language === 'ar' ? 'تم فك الارتباط' : 'Link removed',
  error: language === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, try again',
});

const randomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const buf = new Uint32Array(8);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 8; i++) out += chars[buf[i] % chars.length];
  return out;
};

const ParentLinkCard: React.FC<Props> = ({ language }) => {
  const { user } = useAuth();
  const txt = t(language);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: codeRows }, { data: linkRows }] = await Promise.all([
      supabase
        .from('parent_invite_codes')
        .select('id, code, used_by, expires_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('parent_links')
        .select('id, parent_id, created_at')
        .eq('student_id', user.id),
    ]);
    setCodes((codeRows as InviteCode[]) ?? []);
    setLinks((linkRows as LinkRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    if (!user) return;
    setCreating(true);
    const { error } = await supabase
      .from('parent_invite_codes')
      .insert({ student_id: user.id, code: randomCode() });
    setCreating(false);
    if (error) {
      toast.error(txt.error);
      return;
    }
    load();
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success(txt.copied);
  };

  const handleUnlink = async (id: string) => {
    const { error } = await supabase.from('parent_links').delete().eq('id', id);
    if (error) {
      toast.error(txt.error);
      return;
    }
    toast.success(txt.unlinked);
    load();
  };

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{txt.title}</h3>
          <p className="text-sm text-muted-foreground">{txt.desc}</p>
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={creating} className="gradient-primary">
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        <span className="ms-2">{txt.generate}</span>
      </Button>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-4">
          {codes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{txt.active}</p>
              {codes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
                >
                  <span className="font-mono tracking-widest" dir="ltr">
                    {c.code}
                  </span>
                  <div className="flex items-center gap-2">
                    {c.used_by && <Badge variant="secondary">{txt.used}</Badge>}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={txt.copy}
                      onClick={() => handleCopy(c.code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> {txt.linked}
            </p>
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground">{txt.none}</p>
            ) : (
              links.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground" dir="ltr">
                    {l.parent_id.slice(0, 8)}…
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => handleUnlink(l.id)}>
                    <Trash2 className="w-4 h-4 me-1" />
                    {txt.unlink}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ParentLinkCard;
