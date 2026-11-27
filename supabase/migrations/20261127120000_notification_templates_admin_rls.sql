BEGIN;

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active notification templates" ON public.notification_templates;
CREATE POLICY "Authenticated users can view active notification templates"
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can manage notification templates" ON public.notification_templates;
CREATE POLICY "Platform admins can manage notification templates"
  ON public.notification_templates
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

COMMIT;
