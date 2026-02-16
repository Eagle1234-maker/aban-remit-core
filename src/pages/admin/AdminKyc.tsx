import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, FileText, User } from 'lucide-react';

const kycRequests = [
  { id: '1', name: 'Mary Akinyi', wallet: 'WLT7770002', date: '2026-02-15', docs: ['ID Front', 'ID Back', 'Selfie'] },
  { id: '2', name: 'Peter Kamau', wallet: 'WLT7770005', date: '2026-02-14', docs: ['ID Front', 'ID Back'] },
  { id: '3', name: 'Grace Wambui', wallet: 'WLT7770006', date: '2026-02-13', docs: ['ID Front', 'ID Back', 'Selfie'] },
];

const AdminKyc = () => (
  <div className="space-y-6 animate-fade-in">
    <div><h1 className="text-2xl font-display font-bold">KYC Approvals</h1><p className="text-muted-foreground">Review identity verification requests</p></div>
    <div className="space-y-4">
      {kycRequests.map(req => (
        <Card key={req.id}>
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{req.name}</p>
                  <p className="text-sm text-muted-foreground">{req.wallet} · Submitted {req.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {req.docs.map(d => (
                  <Badge key={d} variant="secondary" className="gap-1"><FileText className="h-3 w-3" /> {d}</Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => toast.success(`${req.name} approved`)}><Check className="h-4 w-4 mr-1" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => toast.error(`${req.name} rejected`)}><X className="h-4 w-4 mr-1" /> Reject</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default AdminKyc;
