import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Landmark, Smartphone, Loader2 } from 'lucide-react';

const Withdraw = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async (method: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success(`KES ${Number(amount).toLocaleString()} withdrawal via ${method} initiated!`);
    setAmount('');
    setLoading(false);
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
                    <Input placeholder="AGT8880001" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Amount (KES)</Label>
                  <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                {amount && (
                  <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span>KES {tab === 'mpesa' ? 50 : 30}</span></div>
                    <div className="flex justify-between font-medium"><span>You receive</span><span>KES {(Number(amount) - (tab === 'mpesa' ? 50 : 30)).toLocaleString()}</span></div>
                  </div>
                )}
                <Button className="w-full" disabled={!amount || loading} onClick={() => handleWithdraw(tab)}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Withdraw
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
