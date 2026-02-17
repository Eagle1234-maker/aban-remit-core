import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Download, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

const Statement = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await api.downloadStatement(fromDate, toDate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${fromDate}-${toDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Statement downloaded!');
    } catch {
      toast.error('Failed to download statement');
    } finally {
      setLoading(false);
    }
  };

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
          <Button className="w-full gap-2" disabled={!fromDate || !toDate || loading} onClick={handleDownload}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statement;
