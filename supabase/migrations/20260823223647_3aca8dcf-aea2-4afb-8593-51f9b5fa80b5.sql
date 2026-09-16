-- 1. Roles enum + table
CREATE TYPE public.app_role AS ENUM ('student', 'parent');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Parent links
CREATE TABLE public.parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

GRANT SELECT, DELETE ON public.parent_links TO authenticated;
GRANT ALL ON public.parent_links TO service_role;

ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own links"
  ON public.parent_links FOR SELECT TO authenticated
  USING (auth.uid() = parent_id OR auth.uid() = student_id);

CREATE POLICY "Participants can remove links"
  ON public.parent_links FOR DELETE TO authenticated
  USING (auth.uid() = parent_id OR auth.uid() = student_id);

CREATE OR REPLACE FUNCTION public.is_parent_of(_parent_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_links
    WHERE parent_id = _parent_id AND student_id = _student_id
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) TO authenticated, service_role;

-- 3. Invite codes
CREATE TABLE public.parent_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.parent_invite_codes TO authenticated;
GRANT ALL ON public.parent_invite_codes TO service_role;

ALTER TABLE public.parent_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own invite codes select"
  ON public.parent_invite_codes FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students create own invite codes"
  ON public.parent_invite_codes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students delete own invite codes"
  ON public.parent_invite_codes FOR DELETE TO authenticated
  USING (auth.uid() = student_id);

-- Redeem function (parents never read the codes table directly)
CREATE OR REPLACE FUNCTION public.redeem_parent_invite(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.parent_invite_codes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.parent_invite_codes
  WHERE code = upper(trim(_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;
  IF v_row.used_by IS NOT NULL THEN
    RAISE EXCEPTION 'code_already_used';
  END IF;
  IF v_row.expires_at < now() THEN
    RAISE EXCEPTION 'code_expired';
  END IF;
  IF v_row.student_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_link_self';
  END IF;

  UPDATE public.parent_invite_codes
    SET used_by = auth.uid(), used_at = now()
    WHERE id = v_row.id;

  INSERT INTO public.parent_links (parent_id, student_id)
  VALUES (auth.uid(), v_row.student_id)
  ON CONFLICT (parent_id, student_id) DO NOTHING;

  RETURN v_row.student_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_parent_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_parent_invite(text) TO authenticated;

-- 4. Parent read access to student data
CREATE POLICY "Parents can view linked student profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));

CREATE POLICY "Parents can view linked student study plans"
  ON public.study_plans FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));

CREATE POLICY "Parents can view linked student flashcards"
  ON public.flashcard_sets FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));

CREATE POLICY "Parents can view linked student conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));
