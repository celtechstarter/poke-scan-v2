
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavbarTheme from "@/components/NavbarTheme";
import Index from "./pages/Index";
import Scan from "./pages/Scan";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NavbarTheme />
          <main className="min-h-screen pt-4">
            <div className="content-container container mx-auto p-4 my-4">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <footer className="app-footer mt-8">
              <div className="footer-logo-container">
                <img src="/lovable-uploads/8533bc26-7219-490e-aa30-08759e7c4f10.png" alt="Rotierendes Logo" className="rotating-logo-footer" />
              </div>
              <p className="text-sm font-bold text-gray-500">
                © 2025 PokeScan Technologies
              </p>
              <p className="text-sm text-gray-500">
                Powered by Marcel Welk
              </p>
            </footer>
          </main>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
