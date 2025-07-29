import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  price: number;
  thumbnail: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}

const CourseCard = ({
  id,
  title,
  description,
  instructor,
  duration,
  students,
  rating,
  price,
  thumbnail,
  category,
  level,
}: CourseCardProps) => {
  const navigate = useNavigate();
  const levelColors = {
    Beginner: "bg-success/10 text-success",
    Intermediate: "bg-warning/10 text-warning",
    Advanced: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="group bg-card rounded-lg shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-105 overflow-hidden border border-border/50">
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-video-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button variant="hero" size="icon" className="bg-white/20 backdrop-blur-sm border border-white/30">
            <Play className="w-4 h-4 text-white" />
          </Button>
        </div>
        
        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-primary text-primary-foreground font-semibold">
            ${price}
          </Badge>
        </div>
        
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={levelColors[level]}>
            {level}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">{rating}</span>
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="text-sm text-muted-foreground mb-4">
          By <span className="font-medium text-foreground">{instructor}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{students.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/course/${id}`)}>
            Preview
          </Button>
          <Button variant="hero" size="sm" className="flex-1" onClick={() => navigate(`/course/${id}`)}>
            Enroll Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;