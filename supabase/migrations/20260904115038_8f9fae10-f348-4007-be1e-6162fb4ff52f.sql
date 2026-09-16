CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'general',
  topic TEXT NOT NULL DEFAULT '',
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_wrong INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_bank TO authenticated;
GRANT ALL ON public.question_bank TO service_role;

ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own questions" ON public.question_bank FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own questions" ON public.question_bank FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own questions" ON public.question_bank FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own questions" ON public.question_bank FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents can view linked student questions" ON public.question_bank FOR SELECT TO authenticated USING (public.is_parent_of(auth.uid(), user_id));

CREATE INDEX idx_question_bank_user_subject ON public.question_bank (user_id, subject, created_at DESC);

CREATE TRIGGER update_question_bank_updated_at BEFORE UPDATE ON public.question_bank FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();