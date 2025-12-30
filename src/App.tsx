import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes with Dashboard Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route 
                path="/empresas" 
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN_EVOLUTECH', 'ADMIN_EVOLUTECH']}>
                    <Empresas />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/usuarios" 
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN_EVOLUTECH', 'ADMIN_EVOLUTECH', 'DONO_EMPRESA']}>
                    <Usuarios />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/configuracoes" 
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN_EVOLUTECH', 'ADMIN_EVOLUTECH', 'DONO_EMPRESA']}>
                    <Configuracoes />
                  </ProtectedRoute>
                } 
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
