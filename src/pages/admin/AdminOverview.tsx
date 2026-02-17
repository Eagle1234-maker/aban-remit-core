import StatCard from '@/components/dashboard/StatCard';
import TransactionTable from '@/components/dashboard/TransactionTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Landmark, BarChart3, DollarSign, Activity, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSystemStats, useTransactions } from '@/hooks/use-api';

const AdminOverview = () => {
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: txData, isLoading: txLoading } = useTransactions({ limit: 5 });

  const s = stats ?? {};
  const transactions = txData?.transactions ?? [];
  const chartData = stats?.chartData ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and monitoring</p>
      </div>

      {statsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={(s.totalUsers ?? 0).toLocaleString()} icon={<Users className="h-5 w-5" />} />
            <StatCard title="Total Agents" value={(s.totalAgents ?? 0).toLocaleString()} icon={<Landmark className="h-5 w-5" />} />
            <StatCard title="Transaction Volume" value={`KES ${((s.totalVolume ?? 0) / 1_000_000).toFixed(1)}M`} icon={<BarChart3 className="h-5 w-5" />} />
            <StatCard title="Revenue" value={`KES ${((s.totalRevenue ?? 0) / 1_000_000).toFixed(2)}M`} icon={<DollarSign className="h-5 w-5" />} />
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg font-display">Transaction Volume (7 Days)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(214, 80%, 52%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(214, 80%, 52%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={v => `${(v / 1_000_000).toFixed(1)}M`} />
                      <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Volume']} />
                      <Area type="monotone" dataKey="volume" stroke="hsl(214, 80%, 52%)" fill="url(#volumeGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg font-display flex items-center gap-2"><Activity className="h-5 w-5" /> Live Transactions</CardTitle></CardHeader>
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

export default AdminOverview;
