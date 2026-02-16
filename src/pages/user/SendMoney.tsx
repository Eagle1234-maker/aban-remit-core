import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Wallet, Phone, Loader2 } from 'lucide-react';

const SendMoney = () => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success(`KES ${Number(amount).toLocaleString()} sent successfully!`);
    setAmount(''); setRecipient(''); setPin('');
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Send Money</h1>
        <p className="text-muted-foreground">Transfer funds instantly</p>
      </div>

      <Tabs defaultValue="wallet">
        <TabsList className="w-full">
          <TabsTrigger value="wallet" className="flex-1 gap-2"><Wallet className="h-4 w-4" /> To Wallet</TabsTrigger>
          <TabsTrigger value="phone" className="flex-1 gap-2"><Phone className="h-4 w-4" /> To Phone</TabsTrigger>
          <TabsTrigger value="agent" className="flex-1 gap-2"><Send className="h-4 w-4" /> To Agent</TabsTrigger>
        </TabsList>

        {['wallet', 'phone', 'agent'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {tab === 'wallet' ? 'Send to Wallet' : tab === 'phone' ? 'Send to Phone' : 'Send to Agent'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{tab === 'wallet' ? 'Wallet Number' : tab === 'phone' ? 'Phone Number' : 'Agent Code'}</Label>
                  <Input
                    placeholder={tab === 'wallet' ? 'WLT7770001' : tab === 'phone' ? '+254712345678' : 'AGT8880001'}
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (KES)</Label>
                  <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                {amount && (
                  <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span>KES 25</span></div>
                    <div className="flex justify-between font-medium"><span>Total</span><span>KES {(Number(amount) + 25).toLocaleString()}</span></div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Transaction PIN</Label>
                  <Input type="password" maxLength={4} placeholder="••••" value={pin} onChange={e => setPin(e.target.value)} />
                </div>
                <Button className="w-full" disabled={!amount || !recipient || pin.length < 4 || loading} onClick={handleSend}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Send Money
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SendMoney;
