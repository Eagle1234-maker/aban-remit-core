import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { useExchangeRates, useExchangeCurrency } from '@/hooks/use-api';

const Exchange = () => {
  const [from, setFrom] = useState('KES');
  const [to, setTo] = useState('USD');
  const [amount, setAmount] = useState('');
  const { data: ratesData, isLoading: ratesLoading } = useExchangeRates();
  const exchangeMutation = useExchangeCurrency();

  const rates = ratesData?.rates ?? {};
  const currencies = Object.keys(rates);

  const rate = from === 'KES' && rates[to]
    ? rates[to].sell
    : to === 'KES' && rates[from]
      ? rates[from].buy
      : 1;

  const converted = from === 'KES' ? Number(amount) / rate : Number(amount) * rate;

  const handleExchange = () => {
    exchangeMutation.mutate(
      { from, to, amount: Number(amount) },
      { onSuccess: () => setAmount('') }
    );
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Currency Exchange</h1>
        <p className="text-muted-foreground">Convert between currencies</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Exchange</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {ratesLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select value={from} onValueChange={setFrom}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Select value={to} onValueChange={setTo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount ({from})</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              {amount && Number(amount) > 0 && rate > 0 && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-lg font-display font-bold">
                    <span>{Number(amount).toLocaleString()} {from}</span>
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    <span>{converted.toFixed(2)} {to}</span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Rate: 1 {from === 'KES' ? to : from} = {rate.toFixed(2)} KES</p>
                </div>
              )}
              <Button className="w-full" disabled={!amount || exchangeMutation.isPending} onClick={handleExchange}>
                {exchangeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Exchange
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Exchange;
