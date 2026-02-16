import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import TransactionTable from '@/components/dashboard/TransactionTable';
import { mockTransactions } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Send, ArrowDownToLine, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const UserOverview = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Welcome, {user.fullName.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Here's your wallet overview</p>
      </div>

      {/* Wallet Card */}
      <Card className="fintech-gradient text-primary-foreground overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80">Wallet Balance</p>
              <p className="text-3xl font-display font-bold mt-1">KES {user.walletBalance.toLocaleString()}</p>
              <p className="text-sm opacity-70 mt-2">{user.walletNumber}</p>
            </div>
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
              {user.kycStatus === 'approved' ? '✓ Verified' : user.kycStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Load Wallet', icon: <Wallet className="h-5 w-5" />, path: '/dashboard/load' },
          { label: 'Send Money', icon: <Send className="h-5 w-5" />, path: '/dashboard/send' },
          { label: 'Withdraw', icon: <ArrowDownToLine className="h-5 w-5" />, path: '/dashboard/withdraw' },
          { label: 'Exchange', icon: <ArrowLeftRight className="h-5 w-5" />, path: '/dashboard/exchange' },
        ].map(action => (
          <Link key={action.path} to={action.path}>
            <Card className="stat-card-hover cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {action.icon}
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Sent" value="KES 45,200" icon={<Send className="h-5 w-5" />} trend={{ value: '12%', positive: true }} />
        <StatCard title="Total Received" value="KES 62,800" icon={<ArrowDownToLine className="h-5 w-5" />} trend={{ value: '8%', positive: true }} />
        <StatCard title="Transactions" value="24" subtitle="This month" icon={<ArrowLeftRight className="h-5 w-5" />} />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-display">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <TransactionTable transactions={mockTransactions} compact />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOverview;
