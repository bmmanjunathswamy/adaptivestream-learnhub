import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Upload, FileVideo, Users, BookOpen, FlaskConical, Play } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import type { Database } from '@/integrations/supabase/types';

type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

interface Course {
  id: string;
  title: string;
  description: string;
  level: CourseLevel;
  price: number;
  is_published: boolean;
  created_at: string;
}

interface Section {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
}

interface Experiment {
  id: string;
  title: string;
  description: string;
  components_required: any[];
  instructions: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  processing_status: string;
  section_id: string;
  course_id: string;
  sort_order: number;
}

function AdminContent() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Edit states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Form states
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    level: 'Beginner' as CourseLevel,
    price: 0
  });

  const [newSection, setNewSection] = useState({
    course_id: '',
    title: '',
    description: '',
    sort_order: 0
  });

  const [newExperiment, setNewExperiment] = useState({
    title: '',
    description: '',
    components_required: '',
    instructions: '',
    difficulty_level: 'beginner',
    estimated_duration_minutes: 60
  });

  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    course_id: '',
    section_id: '',
    sort_order: 0
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [coursesRes, sectionsRes, experimentsRes, videosRes] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('sections').select('*').order('sort_order'),
        supabase.from('experiments').select('*').order('created_at', { ascending: false }),
        supabase.from('videos').select('*').order('sort_order')
      ]);

      if (coursesRes.data) setCourses(coursesRes.data);
      if (sectionsRes.data) setSections(sectionsRes.data);
      if (experimentsRes.data) setExperiments(experimentsRes.data as Experiment[]);
      if (videosRes.data) setVideos(videosRes.data);

      console.log('Admin data loaded successfully');
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setDataLoading(false);
    }
  };

  const createCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...newCourse,
          instructor_id: userProfile?.id
        })
        .select()
        .single();

      if (error) throw error;

      setCourses([data, ...courses]);
      setNewCourse({ title: '', description: '', level: 'Beginner' as CourseLevel, price: 0 });
      toast({
        title: "Success",
        description: "Course created successfully"
      });
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive"
      });
    }
  };

  const createSection = async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .insert(newSection)
        .select()
        .single();

      if (error) throw error;

      setSections([...sections, data]);
      setNewSection({ course_id: '', title: '', description: '', sort_order: 0 });
      toast({
        title: "Success",
        description: "Section created successfully"
      });
    } catch (error) {
      console.error('Error creating section:', error);
      toast({
        title: "Error",
        description: "Failed to create section",
        variant: "destructive"
      });
    }
  };

  const createExperiment = async () => {
    try {
      const components = newExperiment.components_required.split(',').map(c => c.trim()).filter(c => c);
      
      const { data, error } = await supabase
        .from('experiments')
        .insert({
          ...newExperiment,
          components_required: components
        })
        .select()
        .single();

      if (error) throw error;

      setExperiments([data as Experiment, ...experiments]);
      setNewExperiment({
        title: '',
        description: '',
        components_required: '',
        instructions: '',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 60
      });
      toast({
        title: "Success",
        description: "Experiment created successfully"
      });
    } catch (error) {
      console.error('Error creating experiment:', error);
      toast({
        title: "Error",
        description: "Failed to create experiment",
        variant: "destructive"
      });
    }
  };

  const toggleCoursePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.map(course => 
        course.id === courseId ? { ...course, is_published: !currentStatus } : course
      ));

      toast({
        title: "Success",
        description: `Course ${!currentStatus ? 'published' : 'unpublished'} successfully`
      });
    } catch (error) {
      console.error('Error updating course status:', error);
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive"
      });
    }
  };

  const updateCourse = async (course: Course) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: course.title,
          description: course.description,
          level: course.level,
          price: course.price
        })
        .eq('id', course.id);

      if (error) throw error;

      setCourses(courses.map(c => c.id === course.id ? course : c));
      setEditingCourse(null);
      toast({
        title: "Success",
        description: "Course updated successfully"
      });
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive"
      });
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.filter(c => c.id !== courseId));
      toast({
        title: "Success",
        description: "Course deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const updateSection = async (section: Section) => {
    try {
      const { error } = await supabase
        .from('sections')
        .update({
          title: section.title,
          description: section.description,
          sort_order: section.sort_order
        })
        .eq('id', section.id);

      if (error) throw error;

      setSections(sections.map(s => s.id === section.id ? section : s));
      setEditingSection(null);
      toast({
        title: "Success",
        description: "Section updated successfully"
      });
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive"
      });
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.filter(s => s.id !== sectionId));
      toast({
        title: "Success",
        description: "Section deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive"
      });
    }
  };

  const updateExperiment = async (experiment: Experiment) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({
          title: experiment.title,
          description: experiment.description,
          instructions: experiment.instructions,
          difficulty_level: experiment.difficulty_level,
          estimated_duration_minutes: experiment.estimated_duration_minutes,
          components_required: experiment.components_required
        })
        .eq('id', experiment.id);

      if (error) throw error;

      setExperiments(experiments.map(e => e.id === experiment.id ? experiment : e));
      setEditingExperiment(null);
      toast({
        title: "Success",
        description: "Experiment updated successfully"
      });
    } catch (error) {
      console.error('Error updating experiment:', error);
      toast({
        title: "Error",
        description: "Failed to update experiment",
        variant: "destructive"
      });
    }
  };

  const deleteExperiment = async (experimentId: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', experimentId);

      if (error) throw error;

      setExperiments(experiments.filter(e => e.id !== experimentId));
      toast({
        title: "Success",
        description: "Experiment deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting experiment:', error);
      toast({
        title: "Error",
        description: "Failed to delete experiment",
        variant: "destructive"
      });
    }
  };

  const createVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert(newVideo)
        .select()
        .single();

      if (error) throw error;

      setVideos([...videos, data]);
      setNewVideo({ title: '', description: '', course_id: '', section_id: '', sort_order: 0 });
      toast({
        title: "Success",
        description: "Video created successfully"
      });
    } catch (error) {
      console.error('Error creating video:', error);
      toast({
        title: "Error",
        description: "Failed to create video",
        variant: "destructive"
      });
    }
  };

  const updateVideo = async (video: Video) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({
          title: video.title,
          description: video.description,
          sort_order: video.sort_order
        })
        .eq('id', video.id);

      if (error) throw error;

      setVideos(videos.map(v => v.id === video.id ? video : v));
      setEditingVideo(null);
      toast({
        title: "Success",
        description: "Video updated successfully"
      });
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive"
      });
    }
  };

  const uploadAndCreateVideo = async () => {
    if (!videoFile) return;
    
    // File size validation (200MB limit)
    const maxSizeInBytes = 200 * 1024 * 1024; // 200MB
    if (videoFile.size > maxSizeInBytes) {
      toast({
        title: "File Too Large",
        description: `Video file must be smaller than 200MB. Current file size: ${(videoFile.size / (1024 * 1024)).toFixed(1)}MB`,
        variant: "destructive"
      });
      return;
    }
    
    // File type validation
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
    if (!allowedTypes.includes(videoFile.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid video file (MP4, WebM, OGG, AVI, or MOV)",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      let publicUrl = '';
      
      // Use chunked upload for files larger than 50MB
      if (videoFile.size > 50 * 1024 * 1024) {
        console.log('Using chunked upload for large file...');
        publicUrl = await uploadLargeFile(videoFile, fileName);
      } else {
        console.log('Using direct upload for small file...');
        publicUrl = await uploadSmallFile(videoFile, fileName);
      }

      setUploadProgress(80); // Upload complete

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          ...newVideo,
          original_file_url: publicUrl,
          processing_status: 'pending',
          file_size_bytes: videoFile.size
        })
        .select()
        .single();

      if (videoError) throw videoError;

      setUploadProgress(90); // Database record created

      // Start video processing
      const { error: processingError } = await supabase.functions.invoke('video-processing-ffmpeg', {
        body: {
          videoId: videoData.id,
          originalFileUrl: publicUrl
        }
      });

      if (processingError) {
        console.error('Processing error:', processingError);
        toast({
          title: "Warning",
          description: "Video uploaded but processing failed. You can retry processing later.",
          variant: "destructive"
        });
      }

      setUploadProgress(100); // All complete

      // Update videos list
      setVideos([...videos, videoData]);
      
      // Reset form
      setNewVideo({ title: '', description: '', course_id: '', section_id: '', sort_order: 0 });
      setVideoFile(null);
      
      // Clear form file input
      const fileInput = document.getElementById('video-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      toast({
        title: "Success",
        description: "Video uploaded and processing started"
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      
      let errorMessage = "Failed to upload video";
      
      if (error instanceof Error) {
        if (error.message.includes('exceeded') || error.message.includes('too large')) {
          errorMessage = "File too large for upload. Please use a smaller video file.";
        } else if (error.message.includes('quota')) {
          errorMessage = "Storage quota exceeded. Please contact administrator.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      // Reset progress after a short delay to show completion
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const uploadSmallFile = async (file: File, fileName: string): Promise<string> => {
    const filePath = `original/${fileName}`;

    setUploadProgress(20);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file);
    
    setUploadProgress(60);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      if (uploadError.message?.includes('exceeded') || uploadError.message?.includes('too large')) {
        throw new Error('File size exceeds storage limits. Please compress your video or use a smaller file.');
      } else if (uploadError.message?.includes('quota')) {
        throw new Error('Storage quota exceeded. Please contact administrator.');
      } else {
        throw uploadError;
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const uploadLargeFile = async (file: File, fileName: string): Promise<string> => {
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('fileName', fileName);
      formData.append('uploadId', uploadId);

      const { data, error } = await supabase.functions.invoke('chunked-upload', {
        body: formData
      });

      if (error) {
        throw new Error(`Failed to upload chunk ${chunkIndex + 1}: ${error.message}`);
      }

      // Update progress
      const progressPercent = Math.floor(((chunkIndex + 1) / totalChunks) * 60) + 10;
      setUploadProgress(progressPercent);

      // If this was the last chunk, return the public URL
      if (chunkIndex === totalChunks - 1) {
        if (!data?.publicUrl) {
          throw new Error('Upload completed but no public URL returned');
        }
        return data.publicUrl;
      }
    }

    throw new Error('Upload completed but no URL returned');
  };

  const deleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.filter(v => v.id !== videoId));
      toast({
        title: "Success",
        description: "Video deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage courses, sections, experiments, and video content</p>
          <p className="text-sm text-muted-foreground mt-2">Welcome, {userProfile?.first_name || 'Admin'}</p>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Course</CardTitle>
                <CardDescription>Add a new course to the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course-title">Title</Label>
                    <Input
                      id="course-title"
                      placeholder="Course title"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="course-level">Level</Label>
                    <Select value={newCourse.level} onValueChange={(value: CourseLevel) => setNewCourse({ ...newCourse, level: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="course-description">Description</Label>
                  <Textarea
                    id="course-description"
                    placeholder="Course description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="course-price">Price ($)</Label>
                  <Input
                    id="course-price"
                    type="number"
                    placeholder="0"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={createCourse} disabled={!newCourse.title || dataLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Courses ({courses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <p className="text-center text-muted-foreground py-4">Loading courses...</p>
                ) : courses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No courses found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{course.level}</TableCell>
                          <TableCell>${course.price}</TableCell>
                          <TableCell>
                            <Badge variant={course.is_published ? "default" : "secondary"}>
                              {course.is_published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setEditingCourse(course)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Course</DialogTitle>
                                    <DialogDescription>Update course information</DialogDescription>
                                  </DialogHeader>
                                  {editingCourse && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Title</Label>
                                        <Input
                                          value={editingCourse.title}
                                          onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Description</Label>
                                        <Textarea
                                          value={editingCourse.description}
                                          onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Level</Label>
                                        <Select value={editingCourse.level} onValueChange={(value: CourseLevel) => setEditingCourse({ ...editingCourse, level: value })}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Price ($)</Label>
                                        <Input
                                          type="number"
                                          value={editingCourse.price}
                                          onChange={(e) => setEditingCourse({ ...editingCourse, price: parseFloat(e.target.value) || 0 })}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button onClick={() => updateCourse(editingCourse)}>Save</Button>
                                        <Button variant="outline" onClick={() => setEditingCourse(null)}>Cancel</Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleCoursePublish(course.id, course.is_published)}
                              >
                                {course.is_published ? "Unpublish" : "Publish"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteCourse(course.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Section</CardTitle>
                <CardDescription>Add sections to organize course content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="section-course">Course</Label>
                    <Select value={newSection.course_id} onValueChange={(value) => setNewSection({ ...newSection, course_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="section-title">Title</Label>
                    <Input
                      id="section-title"
                      placeholder="Section title"
                      value={newSection.title}
                      onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="section-description">Description</Label>
                  <Textarea
                    id="section-description"
                    placeholder="Section description"
                    value={newSection.description}
                    onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="section-order">Sort Order</Label>
                  <Input
                    id="section-order"
                    type="number"
                    placeholder="0"
                    value={newSection.sort_order}
                    onChange={(e) => setNewSection({ ...newSection, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={createSection} disabled={!newSection.title || !newSection.course_id}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Section
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sections.map((section) => {
                      const course = courses.find(c => c.id === section.course_id);
                      return (
                        <TableRow key={section.id}>
                          <TableCell className="font-medium">{section.title}</TableCell>
                          <TableCell>{course?.title}</TableCell>
                          <TableCell>{section.sort_order}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setEditingSection(section)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Section</DialogTitle>
                                    <DialogDescription>Update section information</DialogDescription>
                                  </DialogHeader>
                                  {editingSection && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Title</Label>
                                        <Input
                                          value={editingSection.title}
                                          onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Description</Label>
                                        <Textarea
                                          value={editingSection.description}
                                          onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Sort Order</Label>
                                        <Input
                                          type="number"
                                          value={editingSection.sort_order}
                                          onChange={(e) => setEditingSection({ ...editingSection, sort_order: parseInt(e.target.value) || 0 })}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button onClick={() => updateSection(editingSection)}>Save</Button>
                                        <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experiments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Experiment</CardTitle>
                <CardDescription>Add practical experiments for students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experiment-title">Title</Label>
                    <Input
                      id="experiment-title"
                      placeholder="Experiment title"
                      value={newExperiment.title}
                      onChange={(e) => setNewExperiment({ ...newExperiment, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experiment-difficulty">Difficulty Level</Label>
                    <Select value={newExperiment.difficulty_level} onValueChange={(value) => setNewExperiment({ ...newExperiment, difficulty_level: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="experiment-description">Description</Label>
                  <Textarea
                    id="experiment-description"
                    placeholder="Experiment description"
                    value={newExperiment.description}
                    onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="experiment-components">Components Required (comma-separated)</Label>
                  <Input
                    id="experiment-components"
                    placeholder="Arduino, LED, Resistor, Breadboard"
                    value={newExperiment.components_required}
                    onChange={(e) => setNewExperiment({ ...newExperiment, components_required: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="experiment-instructions">Instructions</Label>
                  <Textarea
                    id="experiment-instructions"
                    placeholder="Detailed step-by-step instructions"
                    value={newExperiment.instructions}
                    onChange={(e) => setNewExperiment({ ...newExperiment, instructions: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="experiment-duration">Estimated Duration (minutes)</Label>
                  <Input
                    id="experiment-duration"
                    type="number"
                    placeholder="60"
                    value={newExperiment.estimated_duration_minutes}
                    onChange={(e) => setNewExperiment({ ...newExperiment, estimated_duration_minutes: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <Button onClick={createExperiment} disabled={!newExperiment.title}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Experiment
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Experiments ({experiments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <p className="text-center text-muted-foreground py-4">Loading experiments...</p>
                ) : experiments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No experiments found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Duration (min)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {experiments.map((experiment) => (
                        <TableRow key={experiment.id}>
                          <TableCell className="font-medium">{experiment.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{experiment.difficulty_level}</Badge>
                          </TableCell>
                          <TableCell>{experiment.estimated_duration_minutes}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setEditingExperiment(experiment)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Edit Experiment</DialogTitle>
                                    <DialogDescription>Update experiment information</DialogDescription>
                                  </DialogHeader>
                                  {editingExperiment && (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                      <div>
                                        <Label>Title</Label>
                                        <Input
                                          value={editingExperiment.title}
                                          onChange={(e) => setEditingExperiment({ ...editingExperiment, title: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Description</Label>
                                        <Textarea
                                          value={editingExperiment.description}
                                          onChange={(e) => setEditingExperiment({ ...editingExperiment, description: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Instructions</Label>
                                        <Textarea
                                          value={editingExperiment.instructions}
                                          onChange={(e) => setEditingExperiment({ ...editingExperiment, instructions: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Difficulty Level</Label>
                                        <Select 
                                          value={editingExperiment.difficulty_level} 
                                          onValueChange={(value) => setEditingExperiment({ ...editingExperiment, difficulty_level: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="beginner">Beginner</SelectItem>
                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Duration (minutes)</Label>
                                        <Input
                                          type="number"
                                          value={editingExperiment.estimated_duration_minutes}
                                          onChange={(e) => setEditingExperiment({ ...editingExperiment, estimated_duration_minutes: parseInt(e.target.value) || 0 })}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button onClick={() => updateExperiment(editingExperiment)}>Save</Button>
                                        <Button variant="outline" onClick={() => setEditingExperiment(null)}>Cancel</Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteExperiment(experiment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Video</CardTitle>
                <CardDescription>Add video content for courses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="video-course">Course</Label>
                    <Select value={newVideo.course_id} onValueChange={(value) => setNewVideo({ ...newVideo, course_id: value, section_id: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="video-section">Section</Label>
                    <Select 
                      value={newVideo.section_id} 
                      onValueChange={(value) => setNewVideo({ ...newVideo, section_id: value })}
                      disabled={!newVideo.course_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections
                          .filter(section => section.course_id === newVideo.course_id)
                          .map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="video-title">Title</Label>
                  <Input
                    id="video-title"
                    placeholder="Video title"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="video-description">Description</Label>
                  <Textarea
                    id="video-description"
                    placeholder="Video description"
                    value={newVideo.description}
                    onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="video-order">Sort Order</Label>
                  <Input
                    id="video-order"
                    type="number"
                    placeholder="0"
                    value={newVideo.sort_order}
                    onChange={(e) => setNewVideo({ ...newVideo, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="video-file">Upload Video File</Label>
                  <Input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Video will be automatically processed to DASH format for adaptive streaming
                  </p>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                    <p className="text-sm text-center mt-1">{uploadProgress}% uploaded</p>
                  </div>
                )}
                <Button 
                  onClick={() => {
                    console.log('Upload button clicked, uploadAndCreateVideo function:', typeof uploadAndCreateVideo);
                    uploadAndCreateVideo();
                  }} 
                  disabled={!newVideo.title || !newVideo.course_id || !newVideo.section_id || !videoFile || loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Uploading & Processing..." : "Upload Video"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Videos ({videos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <p className="text-center text-muted-foreground py-4">Loading videos...</p>
                ) : videos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No videos found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videos.map((video) => {
                        const course = courses.find(c => c.id === video.course_id);
                        const section = sections.find(s => s.id === video.section_id);
                        return (
                          <TableRow key={video.id}>
                            <TableCell className="font-medium">{video.title}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={video.processing_status === 'completed' ? "default" : 
                                       video.processing_status === 'processing' ? "secondary" : "destructive"}
                              >
                                {video.processing_status}
                              </Badge>
                            </TableCell>
                            <TableCell>{course?.title}</TableCell>
                            <TableCell>{section?.title}</TableCell>
                            <TableCell>{video.sort_order}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setEditingVideo(video)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Video</DialogTitle>
                                      <DialogDescription>Update video information</DialogDescription>
                                    </DialogHeader>
                                    {editingVideo && (
                                      <div className="space-y-4">
                                        <div>
                                          <Label>Title</Label>
                                          <Input
                                            value={editingVideo.title}
                                            onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                                          />
                                        </div>
                                        <div>
                                          <Label>Description</Label>
                                          <Textarea
                                            value={editingVideo.description}
                                            onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                                          />
                                        </div>
                                        <div>
                                          <Label>Sort Order</Label>
                                          <Input
                                            type="number"
                                            value={editingVideo.sort_order}
                                            onChange={(e) => setEditingVideo({ ...editingVideo, sort_order: parseInt(e.target.value) || 0 })}
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <Button onClick={() => updateVideo(editingVideo)}>Save</Button>
                                          <Button variant="outline" onClick={() => setEditingVideo(null)}>Cancel</Button>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteVideo(video.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <AdminLayout>
      <AdminContent />
    </AdminLayout>
  );
}
