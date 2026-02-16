import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';

const Statement = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Download Statement</h1>
        <p className="text-muted-foreground">Get your transaction statement</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5" /> Statement Request</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Statement fee</span><span>KES 50</span></div>
          </div>
          <Button className="w-full gap-2" disabled={!fromDate || !toDate} onClick={() => toast.success('Statement downloaded!')}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statement;
