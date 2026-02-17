import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionTable from '@/components/dashboard/TransactionTable';
import { DollarSign, Loader2 } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { useCommissions } from '@/hooks/use-api';

const AgentCommission = () => {
  const { data, isLoading } = useCommissions();

  const commissions = data?.commissions ?? [];
  const totalEarned = data?.totalEarned ?? 0;
  const thisMonth = data?.thisMonth ?? 0;
  const today = data?.today ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Commission Report</h1>
        <p className="text-muted-foreground">Your earned commissions</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Earned" value={`KES ${totalEarned.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="This Month" value={`KES ${thisMonth.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Today" value={`KES ${today.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg font-display">Commission History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : commissions.length > 0 ? (
            <TransactionTable transactions={commissions} />
          ) : (
            <p className="text-center py-8 text-muted-foreground">No commissions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentCommission;
