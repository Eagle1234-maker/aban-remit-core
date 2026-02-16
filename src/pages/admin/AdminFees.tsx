import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState } from 'react';

const defaultFees = {
  deposit: '0', withdraw: '50', transfer: '25', sms: '2', exchange: '150', statement: '50',
};

const AdminFees = () => {
  const [fees, setFees] = useState(defaultFees);
  const update = (k: string, v: string) => setFees(prev => ({ ...prev, [k]: v }));

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">Fee Settings</h1><p className="text-muted-foreground">Configure platform fees</p></div>
      <Card>
        <CardContent className="p-6 space-y-4">
          {Object.entries(fees).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label className="capitalize w-40">{key} Fee (KES)</Label>
              <Input type="number" value={val} onChange={e => update(key, e.target.value)} className="max-w-[200px]" />
            </div>
          ))}
          <Button onClick={() => toast.success('Fees updated!')}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFees;
