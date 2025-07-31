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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Upload, FileVideo } from 'lucide-react';
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
  sort_order: number;
}

export default function Admin() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      loadData();
    }
  }, [userProfile]);

  const loadData = async () => {
    setLoading(true);
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive"
      });
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage courses, sections, experiments, and video content</p>
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
                <Button onClick={createCourse} disabled={!newCourse.title}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Courses</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCoursePublish(course.id, course.is_published)}
                          >
                            {course.is_published ? "Unpublish" : "Publish"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
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
                <CardTitle>Experiments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Components</TableHead>
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
                        <TableCell>{experiment.estimated_duration_minutes}m</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(experiment.components_required) && experiment.components_required.slice(0, 3).map((component, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {component}
                              </Badge>
                            ))}
                            {Array.isArray(experiment.components_required) && experiment.components_required.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{experiment.components_required.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Processing</CardTitle>
                <CardDescription>Upload and process videos for DASH streaming</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="video-upload">Select Video File</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Button disabled={!selectedFile}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Process
                    </Button>
                  </div>
                </div>
                {uploadProgress > 0 && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Processing Status</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.map((video) => {
                      const section = sections.find(s => s.id === video.section_id);
                      return (
                        <TableRow key={video.id}>
                          <TableCell className="font-medium">{video.title}</TableCell>
                          <TableCell>{section?.title}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                video.processing_status === 'completed' ? 'default' :
                                video.processing_status === 'processing' ? 'secondary' : 'destructive'
                              }
                            >
                              {video.processing_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{video.sort_order}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <FileVideo className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
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
        </Tabs>
      </div>
    </div>
  );
}