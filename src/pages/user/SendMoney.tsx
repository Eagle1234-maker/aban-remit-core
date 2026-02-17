import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Wallet, Phone, Loader2 } from 'lucide-react';
import { useSendMoney } from '@/hooks/use-api';

const SendMoney = () => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('wallet');
  const sendMutation = useSendMoney();

  const handleSend = async () => {
    const recipientType = activeTab as 'wallet' | 'phone' | 'agent';
    sendMutation.mutate(
      { recipient, recipientType, amount: Number(amount), pin },
      { onSuccess: () => { setAmount(''); setRecipient(''); setPin(''); } }
    );
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Send Money</h1>
        <p className="text-muted-foreground">Transfer funds instantly</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                <div className="space-y-2">
                  <Label>Transaction PIN</Label>
                  <Input type="password" maxLength={4} placeholder="••••" value={pin} onChange={e => setPin(e.target.value)} />
                </div>
                <Button className="w-full" disabled={!amount || !recipient || pin.length < 4 || sendMutation.isPending} onClick={handleSend}>
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Send Money
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
