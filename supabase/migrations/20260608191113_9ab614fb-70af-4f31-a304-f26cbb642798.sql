
-- WORKSPACES
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Workspace',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workspaces" ON public.workspaces
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX workspaces_user_id_idx ON public.workspaces(user_id);

-- Security definer helper to avoid recursive policies
CREATE OR REPLACE FUNCTION public.user_owns_workspace(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = _workspace_id AND user_id = auth.uid()
  )
$$;

-- DATASETS
CREATE TABLE public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  raw_data jsonb NOT NULL,
  schema jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datasets TO authenticated;
GRANT ALL ON public.datasets TO service_role;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage datasets in own workspaces" ON public.datasets
  FOR ALL TO authenticated
  USING (public.user_owns_workspace(workspace_id))
  WITH CHECK (public.user_owns_workspace(workspace_id));

CREATE INDEX datasets_workspace_id_idx ON public.datasets(workspace_id);

-- CHARTS
CREATE TABLE public.charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  chart_type text NOT NULL,
  x_axis text NOT NULL,
  y_axis text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.charts TO authenticated;
GRANT ALL ON public.charts TO service_role;
ALTER TABLE public.charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage charts in own workspaces" ON public.charts
  FOR ALL TO authenticated
  USING (public.user_owns_workspace(workspace_id))
  WITH CHECK (public.user_owns_workspace(workspace_id));

CREATE INDEX charts_workspace_id_idx ON public.charts(workspace_id);

-- Auto-create default workspace on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspaces (user_id, name) VALUES (NEW.id, 'My Workspace');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_workspace();
