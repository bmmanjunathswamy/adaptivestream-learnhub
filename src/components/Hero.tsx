import { Button } from "@/components/ui/button";
import { Play, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-white/90 text-sm font-medium">
                Trusted by 50,000+ learners
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Master Skills with
              <span className="block text-yellow-300">
                Interactive Learning
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto lg:mx-0">
              Experience adaptive video streaming with DASH technology. Learn at your own pace 
              with high-quality courses that adjust to your connection.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90" onClick={() => navigate("/courses")}>
                <Play className="w-5 h-5 mr-2" />
                Start Learning
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                onClick={() => navigate("/courses")}
              >
                Explore Courses
              </Button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-8 mt-12 text-white/80">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50K+</div>
                <div className="text-sm">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">4.9★</div>
                <div className="text-sm">Rating</div>
              </div>
            </div>
          </div>
          
          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-video">
              <img
                src={heroImage}
                alt="Online learning platform"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-video-gradient"></div>
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="hero"
                  size="xl"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30"
                >
                  <Play className="w-6 h-6 text-white" />
                </Button>
              </div>
            </div>
            
            {/* Floating stats */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-elegant">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-foreground">2.5M+</div>
                  <div className="text-sm text-muted-foreground">Hours Watched</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;