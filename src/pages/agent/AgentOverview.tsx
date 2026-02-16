import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import TransactionTable from '@/components/dashboard/TransactionTable';
import { mockTransactions } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, DollarSign, ArrowDownToLine, Users } from 'lucide-react';

const AgentOverview = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Agent Dashboard</h1>
        <p className="text-muted-foreground">Manage your agent operations</p>
      </div>

      <Card className="fintech-gradient text-primary-foreground">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-80">Float Balance</p>
              <p className="text-2xl font-display font-bold mt-1">KES {(user.floatBalance || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Commission Balance</p>
              <p className="text-2xl font-display font-bold mt-1">KES {(user.commissionBalance || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Agent Code</p>
              <p className="text-2xl font-display font-bold mt-1">{user.walletNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Today's Deposits" value="KES 85,000" icon={<ArrowDownToLine className="h-5 w-5" />} trend={{ value: '15%', positive: true }} />
        <StatCard title="Today's Withdrawals" value="KES 42,000" icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Commission Earned" value="KES 1,250" subtitle="Today" icon={<DollarSign className="h-5 w-5" />} trend={{ value: '5%', positive: true }} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg font-display">Recent Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <TransactionTable transactions={mockTransactions} compact />
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentOverview;
