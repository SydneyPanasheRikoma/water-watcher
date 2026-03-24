import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import Index from "./pages/Index.tsx";
import CompaniesPage from "./pages/Companies.tsx";
import CommunityPage from "./pages/Community.tsx";
import TransparencyPage from "./pages/Transparency.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:id" element={<CompaniesPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/transparency" element={<TransparencyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="border-t py-6 text-center text-sm text-muted-foreground">
            © 2026 The Blue Ledger · Public Water Transparency Initiative
          </footer>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
