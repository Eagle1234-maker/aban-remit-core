import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark, Smartphone, Loader2 } from 'lucide-react';
import { useWithdrawal } from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';

const Withdraw = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const withdrawMutation = useWithdrawal();

  const handleWithdraw = (method: string) => {
    withdrawMutation.mutate(
      { amount: Number(amount), currency: 'KES', phone: user?.phone || '' },
      { onSuccess: () => setAmount('') }
    );
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Withdraw</h1>
        <p className="text-muted-foreground">Cash out from your wallet</p>
      </div>
      <Tabs defaultValue="mpesa">
        <TabsList className="w-full">
          <TabsTrigger value="mpesa" className="flex-1 gap-2"><Smartphone className="h-4 w-4" /> To MPESA</TabsTrigger>
          <TabsTrigger value="agent" className="flex-1 gap-2"><Landmark className="h-4 w-4" /> To Agent</TabsTrigger>
        </TabsList>
        {['mpesa', 'agent'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader><CardTitle className="text-base">{tab === 'mpesa' ? 'Withdraw to MPESA' : 'Withdraw via Agent'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {tab === 'agent' && (
                  <div className="space-y-2">
                    <Label>Agent Code</Label>
                    <Input placeholder="AGT8880001" value={agentCode} onChange={e => setAgentCode(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Amount (KES)</Label>
                  <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <Button className="w-full" disabled={!amount || withdrawMutation.isPending} onClick={() => handleWithdraw(tab)}>
                  {withdrawMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Withdraw
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Withdraw;
