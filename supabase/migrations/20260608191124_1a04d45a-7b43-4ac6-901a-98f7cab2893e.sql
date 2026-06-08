
REVOKE EXECUTE ON FUNCTION public.user_owns_workspace(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_workspace() FROM PUBLIC, anon, authenticated;
