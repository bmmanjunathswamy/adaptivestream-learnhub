-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if the new user's email is the admin email
  IF NEW.email = 'bmmanjunathswamy@gmail.com' THEN
    -- Update the profile role to admin
    UPDATE public.profiles 
    SET role = 'admin'
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;