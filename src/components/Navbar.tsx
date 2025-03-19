
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Home, Camera, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-sm shadow-sm" aria-label="Hauptnavigation">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/placeholder.svg" 
              alt="PokeScan Logo" 
              className="w-8 h-8" 
              aria-hidden="true"
            />
            <span className="text-xl font-bold text-pokeblue-dark">PokeScan v2</span>
          </Link>
          
          <div className="flex space-x-1 md:space-x-4">
            <Button 
              variant={isActive('/') ? "default" : "ghost"} 
              size="sm"
              className={cn(
                "flex items-center gap-2",
                isActive('/') && "bg-pokeblue text-white"
              )}
              asChild
            >
              <Link to="/" aria-current={isActive('/') ? "page" : undefined}>
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">Home</span>
              </Link>
            </Button>
            
            <Button 
              variant={isActive('/scan') ? "default" : "ghost"} 
              size="sm"
              className={cn(
                "flex items-center gap-2",
                isActive('/scan') && "bg-pokered text-white"
              )}
              asChild
            >
              <Link to="/scan" aria-current={isActive('/scan') ? "page" : undefined}>
                <Camera className="h-4 w-4" />
                <span className="hidden md:inline">Scan</span>
              </Link>
            </Button>
            
            <Button 
              variant={isActive('/about') ? "default" : "ghost"} 
              size="sm"
              className={cn(
                "flex items-center gap-2",
                isActive('/about') && "bg-pokeyellow text-black"
              )}
              asChild
            >
              <Link to="/about" aria-current={isActive('/about') ? "page" : undefined}>
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">About Us</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
