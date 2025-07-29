import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoPlayer from "@/components/VideoPlayer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, Star, Play, BookOpen, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level: string;
  duration_minutes: number;
  thumbnail_url: string;
  instructor: {
    first_name: string;
    last_name: string;
  };
  category: {
    name: string;
  };
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  sort_order: number;
}

const Course = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id, user]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(first_name, last_name),
          category:categories(name)
        `)
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch course videos
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("course_id", id)
        .order("sort_order");

      if (videosError) throw videosError;
      setVideos(videosData);
      
      if (videosData.length > 0) {
        setCurrentVideo(videosData[0]);
      }

      // Check if user is enrolled
      if (user) {
        const { data: enrollmentData } = await supabase
          .from("course_enrollments")
          .select("id")
          .eq("course_id", id)
          .eq("user_id", user.id)
          .single();
        
        setIsEnrolled(!!enrollmentData);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      toast({
        title: "Error",
        description: "Could not load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in courses",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          course_id: id,
          user_id: user.id,
        });

      if (error) throw error;

      setIsEnrolled(true);
      toast({
        title: "Success",
        description: "You have successfully enrolled in this course!",
      });
    } catch (error) {
      console.error("Error enrolling:", error);
      toast({
        title: "Error",
        description: "Could not enroll in course",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            {currentVideo ? (
              <div className="space-y-4">
                <VideoPlayer
                  src={currentVideo.video_url}
                  title={currentVideo.title}
                  poster={currentVideo.thumbnail_url}
                />
                <div>
                  <h2 className="text-xl font-semibold mb-2">{currentVideo.title}</h2>
                  <p className="text-muted-foreground">{currentVideo.description}</p>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No videos available for this course</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Course Info Sidebar */}
          <div className="space-y-6">
            {/* Course Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{course.category.name}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
                <CardTitle className="text-2xl">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{course.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.round(course.duration_minutes / 60)}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{videos.length} videos</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-medium">
                    {course.instructor.first_name} {course.instructor.last_name}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ${course.price}
                  </span>
                  {isEnrolled ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Enrolled
                    </Badge>
                  ) : (
                    <Button onClick={handleEnroll} size="lg">
                      Enroll Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video List */}
            {videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {videos.map((video, index) => (
                      <div
                        key={video.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          currentVideo?.id === video.id
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                        onClick={() => setCurrentVideo(video)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{video.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(video.duration_seconds / 60)}:
                              {(video.duration_seconds % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                          {currentVideo?.id === video.id && (
                            <Play className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Course;