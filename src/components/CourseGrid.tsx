import CourseCard from "./CourseCard";
import { Button } from "@/components/ui/button";
import webDevImage from "@/assets/course-web-dev.jpg";
import dataScienceImage from "@/assets/course-data-science.jpg";
import mobileDevImage from "@/assets/course-mobile-dev.jpg";

const CourseGrid = () => {
  const courses = [
    {
      id: "1",
      title: "Complete Web Development Bootcamp",
      description: "Learn HTML, CSS, JavaScript, React, Node.js and become a full-stack developer",
      instructor: "Sarah Johnson",
      duration: "45 hours",
      students: 12580,
      rating: 4.9,
      price: 89,
      thumbnail: webDevImage,
      category: "Web Development",
      level: "Beginner" as const,
    },
    {
      id: "2", 
      title: "Data Science & Machine Learning",
      description: "Master Python, pandas, NumPy, scikit-learn, and build real-world ML projects",
      instructor: "Dr. Michael Chen",
      duration: "60 hours",
      students: 8950,
      rating: 4.8,
      price: 149,
      thumbnail: dataScienceImage,
      category: "Data Science",
      level: "Intermediate" as const,
    },
    {
      id: "3",
      title: "Mobile App Development with React Native",
      description: "Build cross-platform mobile apps for iOS and Android using React Native",
      instructor: "Alex Rodriguez",
      duration: "35 hours",
      students: 6742,
      rating: 4.7,
      price: 119,
      thumbnail: mobileDevImage,
      category: "Mobile Development",
      level: "Intermediate" as const,
    },
    {
      id: "4",
      title: "Advanced JavaScript & TypeScript",
      description: "Deep dive into modern JavaScript features, TypeScript, and advanced patterns",
      instructor: "Emma Thompson",
      duration: "40 hours",
      students: 9850,
      rating: 4.9,
      price: 99,
      thumbnail: webDevImage,
      category: "Programming",
      level: "Advanced" as const,
    },
    {
      id: "5",
      title: "Python for Data Analysis",
      description: "Learn Python fundamentals and data analysis with pandas, matplotlib, and seaborn",
      instructor: "Dr. James Wilson",
      duration: "30 hours",
      students: 15250,
      rating: 4.8,
      price: 79,
      thumbnail: dataScienceImage,
      category: "Data Science",
      level: "Beginner" as const,
    },
    {
      id: "6",
      title: "iOS Development with Swift",
      description: "Create native iOS apps with Swift, UIKit, and learn Apple's development ecosystem",
      instructor: "David Park",
      duration: "50 hours",
      students: 5630,
      rating: 4.7,
      price: 139,
      thumbnail: mobileDevImage,
      category: "Mobile Development", 
      level: "Intermediate" as const,
    },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Featured Courses
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our most popular courses designed by industry experts to help you 
            advance your career and master new skills.
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {courses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button variant="outline" size="lg" className="min-w-48">
            View All Courses
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CourseGrid;