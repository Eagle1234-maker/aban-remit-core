import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PlaceholderPage from "@/components/PlaceholderPage";
import LoginPage from "@/components/auth/LoginPage";
import RegisterPage from "@/components/auth/RegisterPage";
import OtpPage from "@/components/auth/OtpPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

// User pages
import UserOverview from "@/pages/user/UserOverview";
import SendMoney from "@/pages/user/SendMoney";
import LoadWallet from "@/pages/user/LoadWallet";
import Withdraw from "@/pages/user/Withdraw";
import Airtime from "@/pages/user/Airtime";
import Exchange from "@/pages/user/Exchange";
import Transactions from "@/pages/user/Transactions";
import Statement from "@/pages/user/Statement";
import Profile from "@/pages/user/Profile";
import Security from "@/pages/user/Security";

// Agent pages
import AgentOverview from "@/pages/agent/AgentOverview";
import AgentDeposit from "@/pages/agent/AgentDeposit";
import AgentWithdraw from "@/pages/agent/AgentWithdraw";
import AgentCommission from "@/pages/agent/AgentCommission";

// Admin pages
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminKyc from "@/pages/admin/AdminKyc";
import AdminFees from "@/pages/admin/AdminFees";
import AdminExchange from "@/pages/admin/AdminExchange";
import AdminSms from "@/pages/admin/AdminSms";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, pendingVerification, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (pendingVerification && !isAuthenticated) return <Navigate to="/verify-otp" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated && user) {
    const dashPath = user.role === 'admin' || user.role === 'superadmin' ? '/admin' : user.role === 'agent' ? '/agent' : '/dashboard';
    return <Navigate to={dashPath} replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Auth */}
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
    <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
    <Route path="/verify-otp" element={<OtpPage />} />
    <Route path="/forgot-password" element={<AuthRoute><PlaceholderPage title="Forgot Password" description="Reset your password" /></AuthRoute>} />

    {/* User Dashboard */}
    <Route path="/dashboard" element={<ProtectedRoute><UserOverview /></ProtectedRoute>} />
    <Route path="/dashboard/load" element={<ProtectedRoute><LoadWallet /></ProtectedRoute>} />
    <Route path="/dashboard/send" element={<ProtectedRoute><SendMoney /></ProtectedRoute>} />
    <Route path="/dashboard/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
    <Route path="/dashboard/airtime" element={<ProtectedRoute><Airtime /></ProtectedRoute>} />
    <Route path="/dashboard/exchange" element={<ProtectedRoute><Exchange /></ProtectedRoute>} />
    <Route path="/dashboard/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
    <Route path="/dashboard/statement" element={<ProtectedRoute><Statement /></ProtectedRoute>} />
    <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/dashboard/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />

    {/* Agent Dashboard */}
    <Route path="/agent" element={<ProtectedRoute><AgentOverview /></ProtectedRoute>} />
    <Route path="/agent/deposit" element={<ProtectedRoute><AgentDeposit /></ProtectedRoute>} />
    <Route path="/agent/withdraw" element={<ProtectedRoute><AgentWithdraw /></ProtectedRoute>} />
    <Route path="/agent/float" element={<ProtectedRoute><PlaceholderPage title="Agent Float" description="Manage your float balance" /></ProtectedRoute>} />
    <Route path="/agent/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
    <Route path="/agent/commission" element={<ProtectedRoute><AgentCommission /></ProtectedRoute>} />
    <Route path="/agent/statement" element={<ProtectedRoute><Statement /></ProtectedRoute>} />

    {/* Admin Dashboard */}
    <Route path="/admin" element={<ProtectedRoute><AdminOverview /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/agents" element={<ProtectedRoute><PlaceholderPage title="Agent Management" description="Manage all agents" /></ProtectedRoute>} />
    <Route path="/admin/kyc" element={<ProtectedRoute><AdminKyc /></ProtectedRoute>} />
    <Route path="/admin/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
    <Route path="/admin/fees" element={<ProtectedRoute><AdminFees /></ProtectedRoute>} />
    <Route path="/admin/commission" element={<ProtectedRoute><PlaceholderPage title="Commission Settings" description="Configure agent commissions" /></ProtectedRoute>} />
    <Route path="/admin/exchange" element={<ProtectedRoute><AdminExchange /></ProtectedRoute>} />
    <Route path="/admin/sms" element={<ProtectedRoute><AdminSms /></ProtectedRoute>} />
    <Route path="/admin/reports" element={<ProtectedRoute><PlaceholderPage title="Reports" description="Analytics and reports" /></ProtectedRoute>} />
    <Route path="/admin/audit" element={<ProtectedRoute><PlaceholderPage title="Audit Logs" description="System audit trail" /></ProtectedRoute>} />
    <Route path="/admin/settings" element={<ProtectedRoute><PlaceholderPage title="System Settings" description="Global system configuration" /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
