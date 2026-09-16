ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hobbies text,
  ADD COLUMN IF NOT EXISTS goals text,
  ADD COLUMN IF NOT EXISTS strengths text,
  ADD COLUMN IF NOT EXISTS weaknesses text,
  ADD COLUMN IF NOT EXISTS learning_styles text[],
  ADD COLUMN IF NOT EXISTS openai_api_key text,
  ADD COLUMN IF NOT EXISTS gemini_api_key text,
  ADD COLUMN IF NOT EXISTS custom_api_key text,
  ADD COLUMN IF NOT EXISTS custom_base_url text,
  ADD COLUMN IF NOT EXISTS custom_model text;