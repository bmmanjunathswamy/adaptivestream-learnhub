-- Add experiments table for practical experiments
CREATE TABLE public.experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  components_required JSONB DEFAULT '[]'::jsonb,
  instructions TEXT,
  difficulty_level TEXT DEFAULT 'beginner',
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add sections table for course organization
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add course_experiments junction table
CREATE TABLE public.course_experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, experiment_id)
);

-- Update videos table for DASH support
ALTER TABLE public.videos 
ADD COLUMN dash_manifest_url TEXT,
ADD COLUMN dash_playlist_url TEXT,
ADD COLUMN processing_status TEXT DEFAULT 'pending',
ADD COLUMN original_file_url TEXT,
ADD COLUMN section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL;

-- Update user role enum to include admin
ALTER TYPE user_role ADD VALUE 'admin';

-- Enable RLS on new tables
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_experiments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiments
CREATE POLICY "Experiments are viewable by everyone" 
ON public.experiments 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage experiments" 
ON public.experiments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for sections
CREATE POLICY "Sections are viewable by everyone" 
ON public.sections 
FOR SELECT 
USING (true);

CREATE POLICY "Instructors can manage their course sections" 
ON public.sections 
FOR ALL 
USING (course_id IN (
  SELECT id FROM public.courses 
  WHERE instructor_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Admins can manage all sections" 
ON public.sections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for course_experiments
CREATE POLICY "Course experiments are viewable by everyone" 
ON public.course_experiments 
FOR SELECT 
USING (true);

CREATE POLICY "Instructors can manage their course experiments" 
ON public.course_experiments 
FOR ALL 
USING (course_id IN (
  SELECT id FROM public.courses 
  WHERE instructor_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Admins can manage all course experiments" 
ON public.course_experiments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Add timestamp triggers for new tables
CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sections_course_id ON public.sections(course_id);
CREATE INDEX idx_sections_sort_order ON public.sections(sort_order);
CREATE INDEX idx_course_experiments_course_id ON public.course_experiments(course_id);
CREATE INDEX idx_course_experiments_experiment_id ON public.course_experiments(experiment_id);
CREATE INDEX idx_course_experiments_section_id ON public.course_experiments(section_id);
CREATE INDEX idx_videos_section_id ON public.videos(section_id);
CREATE INDEX idx_videos_processing_status ON public.videos(processing_status);