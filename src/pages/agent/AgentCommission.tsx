import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionTable from '@/components/dashboard/TransactionTable';
import { mockTransactions } from '@/data/mock';
import { DollarSign } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

const commissions = mockTransactions.filter(t => t.type === 'commission' || t.type === 'deposit').map(t => ({
  ...t, type: 'commission' as const, amount: Math.round(t.amount * 0.02), description: `Commission: ${t.description}`
}));

const AgentCommission = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold">Commission Report</h1>
      <p className="text-muted-foreground">Your earned commissions</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Total Earned" value="KES 12,450" icon={<DollarSign className="h-5 w-5" />} />
      <StatCard title="This Month" value="KES 3,200" icon={<DollarSign className="h-5 w-5" />} trend={{ value: '8%', positive: true }} />
      <StatCard title="Today" value="KES 450" icon={<DollarSign className="h-5 w-5" />} />
    </div>
    <Card>
      <CardHeader><CardTitle className="text-lg font-display">Commission History</CardTitle></CardHeader>
      <CardContent className="p-0">
        <TransactionTable transactions={commissions} />
      </CardContent>
    </Card>
  </div>
);

export default AgentCommission;
