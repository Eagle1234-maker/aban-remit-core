import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Smartphone, CreditCard, Loader2 } from 'lucide-react';

const LoadWallet = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoad = async (method: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success(`KES ${Number(amount).toLocaleString()} loaded via ${method}!`);
    setAmount('');
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Load Wallet</h1>
        <p className="text-muted-foreground">Add funds to your wallet</p>
      </div>

      <Tabs defaultValue="mpesa">
        <TabsList className="w-full">
          <TabsTrigger value="mpesa" className="flex-1 gap-2"><Smartphone className="h-4 w-4" /> MPESA</TabsTrigger>
          <TabsTrigger value="card" className="flex-1 gap-2"><CreditCard className="h-4 w-4" /> Card</TabsTrigger>
        </TabsList>

        <TabsContent value="mpesa">
          <Card>
            <CardHeader><CardTitle className="text-base">Load via MPESA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>MPESA Phone Number</Label>
                <Input placeholder="+254712345678" />
              </div>
              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <Button className="w-full" disabled={!amount || loading} onClick={() => handleLoad('MPESA')}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Pay with MPESA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="card">
          <Card>
            <CardHeader><CardTitle className="text-base">Load via Card (Paystack)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              {amount && (
                <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Processing fee</span><span>KES {Math.round(Number(amount) * 0.015)}</span></div>
                  <div className="flex justify-between font-medium"><span>Total charge</span><span>KES {(Number(amount) + Math.round(Number(amount) * 0.015)).toLocaleString()}</span></div>
                </div>
              )}
              <Button className="w-full" disabled={!amount || loading} onClick={() => handleLoad('Card')}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Pay with Card
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoadWallet;
