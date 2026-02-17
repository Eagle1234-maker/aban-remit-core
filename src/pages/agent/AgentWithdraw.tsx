import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAgentWithdrawMutation } from '@/hooks/use-api';

const AgentWithdraw = () => {
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const withdrawMutation = useAgentWithdrawMutation();

  const handleWithdraw = () => {
    withdrawMutation.mutate(
      { walletNumber: wallet, amount: Number(amount), pin },
      { onSuccess: () => { setWallet(''); setAmount(''); setPin(''); } }
    );
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Withdraw for User</h1>
        <p className="text-muted-foreground">Process user cash withdrawal</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2"><Label>User Wallet Number</Label><Input placeholder="WLT7770001" value={wallet} onChange={e => setWallet(e.target.value)} /></div>
          <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div className="space-y-2"><Label>Confirm PIN</Label><Input type="password" maxLength={4} placeholder="••••" value={pin} onChange={e => setPin(e.target.value)} /></div>
          <Button className="w-full" disabled={!wallet || !amount || pin.length < 4 || withdrawMutation.isPending} onClick={handleWithdraw}>
            {withdrawMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Process Withdrawal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentWithdraw;
