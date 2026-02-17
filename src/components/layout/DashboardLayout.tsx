import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Wallet, Send, ArrowDownToLine, Phone, ArrowLeftRight,
  List, FileText, User, Shield, Users, Settings, LogOut, Menu, X,
  DollarSign, BarChart3, MessageSquare, ClipboardList, Landmark, Percent, Globe, Bell
} from 'lucide-react';
import logo from '@/assets/logo.png';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const userNav: NavItem[] = [
  { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Load Wallet', path: '/dashboard/load', icon: <Wallet className="h-4 w-4" /> },
  { label: 'Send Money', path: '/dashboard/send', icon: <Send className="h-4 w-4" /> },
  { label: 'Withdraw', path: '/dashboard/withdraw', icon: <ArrowDownToLine className="h-4 w-4" /> },
  { label: 'Airtime', path: '/dashboard/airtime', icon: <Phone className="h-4 w-4" /> },
  { label: 'Exchange', path: '/dashboard/exchange', icon: <ArrowLeftRight className="h-4 w-4" /> },
  { label: 'Transactions', path: '/dashboard/transactions', icon: <List className="h-4 w-4" /> },
  { label: 'Statement', path: '/dashboard/statement', icon: <FileText className="h-4 w-4" /> },
  { label: 'Profile & KYC', path: '/dashboard/profile', icon: <User className="h-4 w-4" /> },
  { label: 'Security', path: '/dashboard/security', icon: <Shield className="h-4 w-4" /> },
];

const agentNav: NavItem[] = [
  { label: 'Overview', path: '/agent', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Deposit to User', path: '/agent/deposit', icon: <ArrowDownToLine className="h-4 w-4" /> },
  { label: 'Withdraw for User', path: '/agent/withdraw', icon: <Send className="h-4 w-4" /> },
  { label: 'Float', path: '/agent/float', icon: <Wallet className="h-4 w-4" /> },
  { label: 'Transactions', path: '/agent/transactions', icon: <List className="h-4 w-4" /> },
  { label: 'Commission', path: '/agent/commission', icon: <DollarSign className="h-4 w-4" /> },
  { label: 'Statement', path: '/agent/statement', icon: <FileText className="h-4 w-4" /> },
];

const adminNav: NavItem[] = [
  { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Users', path: '/admin/users', icon: <Users className="h-4 w-4" /> },
  { label: 'Agents', path: '/admin/agents', icon: <Landmark className="h-4 w-4" /> },
  { label: 'KYC Approvals', path: '/admin/kyc', icon: <ClipboardList className="h-4 w-4" /> },
  { label: 'Transactions', path: '/admin/transactions', icon: <List className="h-4 w-4" /> },
  { label: 'Fee Settings', path: '/admin/fees', icon: <Percent className="h-4 w-4" /> },
  { label: 'Commission', path: '/admin/commission', icon: <DollarSign className="h-4 w-4" /> },
  { label: 'Exchange Rates', path: '/admin/exchange', icon: <Globe className="h-4 w-4" /> },
  { label: 'SMS Mgmt', path: '/admin/sms', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'Reports', path: '/admin/reports', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Audit Logs', path: '/admin/audit', icon: <FileText className="h-4 w-4" /> },
  { label: 'Settings', path: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
];

const getNavItems = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'agent': return agentNav;
    case 'admin':
    case 'superadmin': return adminNav;
    default: return userNav;
  }
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const navItems = getNavItems(user.role);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <img src={logo} alt="Aban Remit" className="h-9" />
          <div>
            <h2 className="text-sm font-display font-bold text-sidebar-primary-foreground">ABAN REMIT</h2>
            <p className="text-xs text-sidebar-foreground/60">Wallet</p>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-1 mb-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-medium">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.fullName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.phone}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/50 backdrop-blur-sm">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
