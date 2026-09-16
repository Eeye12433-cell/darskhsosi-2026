import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, Users } from 'lucide-react';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);


  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      }
      setCheckingAuth(false);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('بيانات الدخول غير صحيحة');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('الرجاء تأكيد البريد الإلكتروني أولاً');
          } else {
            toast.error('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('هذا البريد الإلكتروني مسجل بالفعل');
          } else if (error.message.includes('Password should be')) {
            toast.error('كلمة المرور ضعيفة جداً');
          } else {
            toast.error('حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.');
          }
        } else {
          if (data.user) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({ user_id: data.user.id, role });
            if (roleError) console.error('Role assignment failed:', roleError);
          }
          toast.success('تم إنشاء الحساب بنجاح!');
        }

      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };


  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm geometric-pattern flex items-center justify-center p-4">
      <Seo
        title="تسجيل الدخول — منصة درس خصوصي"
        description="سجّل الدخول أو أنشئ حساباً مجانياً في منصة درس خصوصي للوصول إلى المعلم الذكي وأدوات التعلم بالذكاء الاصطناعي."
        path="/auth"
      />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary shadow-glow mb-6">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">درس خصوصي</h1>
          <p className="text-muted-foreground">منصة التعلم المفتوح بالذكاء الاصطناعي</p>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-2xl shadow-soft border border-border p-8 animate-slide-up">
          <h2 className="text-xl font-semibold text-center mb-6">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>

          {/* Email Auth Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  نوع الحساب
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'student' as const, label: 'طالب', hint: 'تعلّم بالذكاء الاصطناعي' },
                    { value: 'parent' as const, label: 'ولي أمر', hint: 'متابعة تقدّم المتعلم' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      disabled={loading}
                      className={`rounded-xl border p-3 text-center transition-colors ${
                        role === opt.value
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <span className="block font-semibold">{opt.label}</span>
                      <span className="block text-xs mt-1">{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="h-12"
                dir="ltr"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 pe-12"
                  dir="ltr"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 gradient-primary"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                'تسجيل الدخول'
              ) : (
                'إنشاء حساب'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخولك'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
