-- Create function to automatically assign admin role to specific email
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign admin role when the specific user signs up
CREATE TRIGGER on_admin_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role();

-- If the user already exists, update their role to admin
UPDATE public.profiles 
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'bmmanjunathswamy@gmail.com'
);