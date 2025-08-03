-- Add foreign key constraints for better data integrity
ALTER TABLE courses 
ADD CONSTRAINT fk_courses_instructor 
FOREIGN KEY (instructor_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE courses
ADD CONSTRAINT fk_courses_category
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE sections
ADD CONSTRAINT fk_sections_course
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE videos
ADD CONSTRAINT fk_videos_course
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE videos
ADD CONSTRAINT fk_videos_section
FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE;

ALTER TABLE course_experiments
ADD CONSTRAINT fk_course_experiments_course
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE course_experiments
ADD CONSTRAINT fk_course_experiments_experiment
FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE;

ALTER TABLE course_experiments
ADD CONSTRAINT fk_course_experiments_section
FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE;

-- Fix RLS policies for user_progress table to use proper profile lookup
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;

CREATE POLICY "Users can update their own progress"
ON user_progress
FOR ALL
USING (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = user_progress.user_id))
WITH CHECK (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = user_progress.user_id));

-- Fix RLS policies for course_enrollments table
DROP POLICY IF EXISTS "Users can enroll themselves" ON course_enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON course_enrollments;

CREATE POLICY "Users can enroll themselves"
ON course_enrollments
FOR INSERT
WITH CHECK (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = course_enrollments.user_id));

CREATE POLICY "Users can view their own enrollments"
ON course_enrollments
FOR SELECT
USING (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = course_enrollments.user_id));

-- Fix RLS policies for video_comments table
DROP POLICY IF EXISTS "Authenticated users can create comments" ON video_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON video_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON video_comments;

CREATE POLICY "Authenticated users can create comments"
ON video_comments
FOR INSERT
WITH CHECK (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = video_comments.user_id));

CREATE POLICY "Users can delete their own comments"
ON video_comments
FOR DELETE
USING (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = video_comments.user_id));

CREATE POLICY "Users can update their own comments"
ON video_comments
FOR UPDATE
USING (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = video_comments.user_id));

-- Fix RLS policies for video_improvements table
DROP POLICY IF EXISTS "Authenticated users can submit improvements" ON video_improvements;

CREATE POLICY "Authenticated users can submit improvements"
ON video_improvements
FOR INSERT
WITH CHECK (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = video_improvements.user_id));

-- Fix RLS policies for video_ratings table
DROP POLICY IF EXISTS "Authenticated users can rate videos" ON video_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON video_ratings;

CREATE POLICY "Authenticated users can rate videos"
ON video_ratings
FOR INSERT
WITH CHECK (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = video_ratings.user_id));

CREATE POLICY "Users can update their own ratings"
ON video_ratings
FOR UPDATE
USING (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = video_ratings.user_id));