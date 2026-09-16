-- 1. Separate, stricter table for sensitive AI credentials
CREATE TABLE public.user_api_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_api_key text,
  custom_base_url text,
  custom_model text,
  openai_api_key text,
  gemini_api_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Grants: owner-only access; edge functions use service_role. No anon access.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_api_credentials TO authenticated;
GRANT ALL ON public.user_api_credentials TO service_role;

ALTER TABLE public.user_api_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api credentials"
  ON public.user_api_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api credentials"
  ON public.user_api_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api credentials"
  ON public.user_api_credentials FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own api credentials"
  ON public.user_api_credentials FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_api_credentials_updated_at
  BEFORE UPDATE ON public.user_api_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Migrate any existing credentials from profiles into the new table
INSERT INTO public.user_api_credentials
  (user_id, custom_api_key, custom_base_url, custom_model, openai_api_key, gemini_api_key)
SELECT user_id, custom_api_key, custom_base_url, custom_model, openai_api_key, gemini_api_key
FROM public.profiles
WHERE custom_api_key IS NOT NULL
   OR custom_base_url IS NOT NULL
   OR custom_model IS NOT NULL
   OR openai_api_key IS NOT NULL
   OR gemini_api_key IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Remove sensitive key columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS custom_api_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS custom_base_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS custom_model;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS openai_api_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS gemini_api_key;

-- 4. Restrict Realtime channel subscriptions to authenticated users only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can receive realtime messages"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can send realtime messages"
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK (true);