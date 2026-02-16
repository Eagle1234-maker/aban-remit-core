import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockExchangeRates } from '@/data/mock';
import { toast } from 'sonner';
import { useState } from 'react';

const AdminExchange = () => {
  const [rates, setRates] = useState(mockExchangeRates);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">Exchange Rate Settings</h1><p className="text-muted-foreground">Set buy/sell rates</p></div>
      {Object.entries(rates).map(([currency, { buy, sell }]) => (
        <Card key={currency}>
          <CardContent className="p-5">
            <h3 className="font-display font-bold mb-3">{currency}/KES</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Buy Rate</Label>
                <Input type="number" value={buy} onChange={e => setRates(prev => ({ ...prev, [currency]: { ...prev[currency as keyof typeof prev], buy: Number(e.target.value) } }))} />
              </div>
              <div className="space-y-2">
                <Label>Sell Rate</Label>
                <Input type="number" value={sell} onChange={e => setRates(prev => ({ ...prev, [currency]: { ...prev[currency as keyof typeof prev], sell: Number(e.target.value) } }))} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={() => toast.success('Rates updated!')}>Save All Rates</Button>
    </div>
  );
};

export default AdminExchange;
