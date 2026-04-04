
-- Allow authenticated users to create companies (onboarding self-service)
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow company owners to insert themes
CREATE POLICY "Dono empresa pode criar tema"
ON public.company_themes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to insert their own role (self-provisioning during onboarding)
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
