-- Insert sample data for categories
INSERT INTO public.categories (id, name, description, icon_url, sort_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Web Development', 'Learn modern web development technologies', 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=100&h=100&fit=crop', 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Data Science', 'Master data analysis and machine learning', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop', 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Mobile Development', 'Build mobile apps for iOS and Android', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=100&h=100&fit=crop', 3);

-- Insert sample instructor profiles
INSERT INTO public.profiles (id, user_id, first_name, last_name, role, avatar_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', 'John', 'Doe', 'instructor', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', 'Jane', 'Smith', 'instructor', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', 'Mike', 'Johnson', 'instructor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face');

-- Insert sample courses
INSERT INTO public.courses (id, title, description, instructor_id, category_id, price, duration_minutes, level, thumbnail_url, is_published) VALUES
  ('550e8400-e29b-41d4-a716-446655440020', 'Complete React Development', 'Master React from basics to advanced concepts including hooks, context, and performance optimization', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 99.99, 1200, 'Intermediate', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop', true),
  ('550e8400-e29b-41d4-a716-446655440021', 'Python Data Science Bootcamp', 'Complete guide to data science using Python, pandas, numpy, and machine learning', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 149.99, 1800, 'Beginner', 'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=400&h=300&fit=crop', true),
  ('550e8400-e29b-41d4-a716-446655440022', 'React Native Mobile Apps', 'Build cross-platform mobile applications using React Native and Expo', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 129.99, 1500, 'Intermediate', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop', true),
  ('550e8400-e29b-41d4-a716-446655440023', 'Advanced JavaScript Concepts', 'Deep dive into JavaScript closures, prototypes, async programming, and design patterns', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 79.99, 900, 'Advanced', 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=300&fit=crop', true),
  ('550e8400-e29b-41d4-a716-446655440024', 'Machine Learning Fundamentals', 'Introduction to ML algorithms, supervised and unsupervised learning with practical examples', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 119.99, 1350, 'Intermediate', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop', true),
  ('550e8400-e29b-41d4-a716-446655440025', 'Flutter Development', 'Create beautiful native mobile apps using Google''s Flutter framework', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 109.99, 1100, 'Beginner', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop', true);

-- Insert sample videos for React course
INSERT INTO public.videos (id, title, description, course_id, video_url, thumbnail_url, duration_seconds, sort_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440030', 'Introduction to React', 'Overview of React and its ecosystem', '550e8400-e29b-41d4-a716-446655440020', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop', 900, 1),
  ('550e8400-e29b-41d4-a716-446655440031', 'Components and JSX', 'Understanding React components and JSX syntax', '550e8400-e29b-41d4-a716-446655440020', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=200&fit=crop', 1200, 2),
  ('550e8400-e29b-41d4-a716-446655440032', 'State and Props', 'Managing component state and passing data with props', '550e8400-e29b-41d4-a716-446655440020', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop', 1500, 3),
  ('550e8400-e29b-41d4-a716-446655440033', 'React Hooks', 'Using useState, useEffect, and custom hooks', '550e8400-e29b-41d4-a716-446655440020', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=300&h=200&fit=crop', 1800, 4);

-- Insert sample videos for Python Data Science course
INSERT INTO public.videos (id, title, description, course_id, video_url, thumbnail_url, duration_seconds, sort_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440040', 'Python Basics for Data Science', 'Essential Python concepts for data analysis', '550e8400-e29b-41d4-a716-446655440021', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=300&h=200&fit=crop', 1000, 1),
  ('550e8400-e29b-41d4-a716-446655440041', 'Working with Pandas', 'Data manipulation and analysis with pandas library', '550e8400-e29b-41d4-a716-446655440021', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop', 1400, 2),
  ('550e8400-e29b-41d4-a716-446655440042', 'Data Visualization', 'Creating charts and graphs with matplotlib and seaborn', '550e8400-e29b-41d4-a716-446655440021', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=300&h=200&fit=crop', 1600, 3);

-- Insert sample videos for React Native course
INSERT INTO public.videos (id, title, description, course_id, video_url, thumbnail_url, duration_seconds, sort_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440050', 'React Native Setup', 'Setting up development environment for React Native', '550e8400-e29b-41d4-a716-446655440022', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop', 800, 1),
  ('550e8400-e29b-41d4-a716-446655440051', 'Navigation in React Native', 'Implementing navigation between screens', '550e8400-e29b-41d4-a716-446655440022', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=200&fit=crop', 1300, 2);