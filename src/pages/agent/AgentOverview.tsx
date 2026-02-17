import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import TransactionTable from '@/components/dashboard/TransactionTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, DollarSign, ArrowDownToLine, Loader2 } from 'lucide-react';
import { useAgentStats, useTransactions } from '@/hooks/use-api';

const AgentOverview = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAgentStats();
  const { data: txData, isLoading: txLoading } = useTransactions({ limit: 5 });

  if (!user) return null;

  const transactions = txData?.transactions ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Agent Dashboard</h1>
        <p className="text-muted-foreground">Manage your agent operations</p>
      </div>

      <Card className="fintech-gradient text-primary-foreground">
        <CardContent className="p-6">
          {statsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm opacity-80">Float Balance</p>
                <p className="text-2xl font-display font-bold mt-1">KES {(stats?.floatBalance ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Commission Balance</p>
                <p className="text-2xl font-display font-bold mt-1">KES {(stats?.commissionBalance ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Agent Code</p>
                <p className="text-2xl font-display font-bold mt-1">{user.walletNumber}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Today's Deposits" value={`KES ${(stats?.todayDeposits ?? 0).toLocaleString()}`} icon={<ArrowDownToLine className="h-5 w-5" />} />
        <StatCard title="Today's Withdrawals" value={`KES ${(stats?.todayWithdrawals ?? 0).toLocaleString()}`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Commission Earned" value={`KES ${(stats?.todayCommission ?? 0).toLocaleString()}`} subtitle="Today" icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg font-display">Recent Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : transactions.length > 0 ? (
            <TransactionTable transactions={transactions} compact />
          ) : (
            <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentOverview;
