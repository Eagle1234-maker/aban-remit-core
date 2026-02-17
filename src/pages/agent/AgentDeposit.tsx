import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAgentDepositMutation } from '@/hooks/use-api';

const AgentDeposit = () => {
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const depositMutation = useAgentDepositMutation();

  const handleDeposit = () => {
    depositMutation.mutate(
      { walletNumber: wallet, amount: Number(amount) },
      { onSuccess: () => { setWallet(''); setAmount(''); } }
    );
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Deposit to User</h1>
        <p className="text-muted-foreground">Load funds into a user's wallet</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2"><Label>User Wallet Number</Label><Input placeholder="WLT7770001" value={wallet} onChange={e => setWallet(e.target.value)} /></div>
          <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <Button className="w-full" disabled={!wallet || !amount || depositMutation.isPending} onClick={handleDeposit}>
            {depositMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Deposit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDeposit;
