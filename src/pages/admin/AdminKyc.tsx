import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, FileText, User, Loader2 } from 'lucide-react';
import { useKycRequests, useApproveKyc, useRejectKyc } from '@/hooks/use-api';

const AdminKyc = () => {
  const { data, isLoading } = useKycRequests();
  const approveMutation = useApproveKyc();
  const rejectMutation = useRejectKyc();

  const requests = data?.requests ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">KYC Approvals</h1><p className="text-muted-foreground">Review identity verification requests</p></div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <Card key={req.id}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{req.name || req.phone}</p>
                      <p className="text-sm text-muted-foreground">{req.walletId} · Submitted {req.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(req.docs ?? []).map((d: string) => (
                      <Badge key={d} variant="secondary" className="gap-1"><FileText className="h-3 w-3" /> {d}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(req.userId)}>
                      {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} Approve
                    </Button>
                    <Button size="sm" variant="destructive" disabled={rejectMutation.isPending} onClick={() => rejectMutation.mutate({ userId: req.userId })}>
                      {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />} Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-muted-foreground">No pending KYC requests</p>
      )}
    </div>
  );
};

export default AdminKyc;
