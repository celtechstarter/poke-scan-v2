
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const NavbarTheme = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="w-full border-b shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-3">
        <Link to="/" className="flex items-center space-x-2">
          <div className="animate-spin-slow mr-2">
            <img 
              src="/lovable-uploads/206e6059-1061-4262-a2ef-b17a308c4d41.png" 
              alt="PokeScan Logo" 
              className="w-8 h-8"
            />
          </div>
          <span className="font-bold text-2xl text-pokeyellow">PokeScan</span>
          <span className="text-lg font-light">v2</span>
        </Link>
        
        <div className="flex items-center space-x-1">
          <Link to="/">
            <Button 
              variant={isActive('/') ? "default" : "ghost"} 
              className={isActive('/') ? "bg-pokeyellow text-black hover:bg-pokeyellow-light" : ""}
            >
              Home
            </Button>
          </Link>
          <Link to="/scan">
            <Button 
              variant={isActive('/scan') ? "default" : "ghost"} 
              className={isActive('/scan') ? "bg-pokeyellow text-black hover:bg-pokeyellow-light" : ""}
            >
              Scan
            </Button>
          </Link>
          <Link to="/about">
            <Button 
              variant={isActive('/about') ? "default" : "ghost"} 
              className={isActive('/about') ? "bg-pokeyellow text-black hover:bg-pokeyellow-light" : ""}
            >
              About Us
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default NavbarTheme;
