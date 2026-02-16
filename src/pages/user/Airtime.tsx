import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const carriers = ['Safaricom', 'Airtel', 'Telkom'];

const Airtime = () => {
  const [carrier, setCarrier] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success(`KES ${amount} airtime sent to ${phone}!`);
    setAmount(''); setPhone('');
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Buy Airtime</h1>
        <p className="text-muted-foreground">Purchase airtime for any number</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Airtime Purchase</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Network</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
              <SelectContent>
                {carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input placeholder="+254712345678" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount (KES)</Label>
            <Input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[50, 100, 200, 500, 1000].map(v => (
              <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))}>{v}</Button>
            ))}
          </div>
          <Button className="w-full" disabled={!carrier || !phone || !amount || loading} onClick={handleBuy}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Buy Airtime
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Airtime;
