import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import TransactionTable from '@/components/dashboard/TransactionTable';
import { mockTransactions, mockAdminStats, mockChartData } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Landmark, BarChart3, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminOverview = () => {
  const s = mockAdminStats;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={s.totalUsers.toLocaleString()} icon={<Users className="h-5 w-5" />} trend={{ value: '12%', positive: true }} />
        <StatCard title="Total Agents" value={s.totalAgents.toLocaleString()} icon={<Landmark className="h-5 w-5" />} trend={{ value: '5%', positive: true }} />
        <StatCard title="Transaction Volume" value={`KES ${(s.totalVolume / 1_000_000).toFixed(1)}M`} icon={<BarChart3 className="h-5 w-5" />} trend={{ value: '18%', positive: true }} />
        <StatCard title="Revenue" value={`KES ${(s.totalRevenue / 1_000_000).toFixed(2)}M`} icon={<DollarSign className="h-5 w-5" />} trend={{ value: '9%', positive: true }} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg font-display">Transaction Volume (7 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
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

      <Card>
        <CardHeader><CardTitle className="text-lg font-display flex items-center gap-2"><Activity className="h-5 w-5" /> Live Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <TransactionTable transactions={mockTransactions} compact />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
