import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useFeeSettings, useUpdateFees } from '@/hooks/use-api';
import { useState, useEffect } from 'react';

const AdminFees = () => {
  const { data, isLoading } = useFeeSettings();
  const updateMutation = useUpdateFees();
  const [fees, setFees] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.fees) {
      const mapped: Record<string, string> = {};
      Object.entries(data.fees).forEach(([k, v]) => { mapped[k] = String(v); });
      setFees(mapped);
    }
  }, [data]);

  const update = (k: string, v: string) => setFees(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    const numFees: Record<string, number> = {};
    Object.entries(fees).forEach(([k, v]) => { numFees[k] = Number(v); });
    updateMutation.mutate(numFees);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

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
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFees;
