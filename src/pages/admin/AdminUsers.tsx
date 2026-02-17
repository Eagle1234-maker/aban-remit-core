import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, UserCheck, UserX, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUsers } from '@/hooks/use-api';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const AdminUsers = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useUsers({ search });
  const qc = useQueryClient();

  const users = data?.users ?? [];

  const handleAction = async (action: string, userId: string, userName: string) => {
    try {
      if (action === 'freeze') {
        await api.updateUserStatus(userId, 'frozen');
        toast.success(`${userName} account frozen`);
      } else if (action === 'promote') {
        await api.updateUserStatus(userId, 'agent');
        toast.success(`${userName} promoted to agent`);
      }
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch {
      toast.error(`Failed to ${action} ${userName}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">User Management</h1><p className="text-muted-foreground">Manage all platform users</p></div>
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Wallet</TableHead><TableHead>Balance</TableHead><TableHead>KYC</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell><div><p className="font-medium">{u.fullName || u.phone}</p><p className="text-xs text-muted-foreground">{u.email || u.phone}</p></div></TableCell>
                    <TableCell className="font-mono text-sm">{u.walletId}</TableCell>
                    <TableCell>KES {(u.balance ?? 0).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={u.kycStatus === 'VERIFIED' ? 'default' : u.kycStatus === 'PENDING' ? 'secondary' : 'destructive'}>{u.kycStatus?.toLowerCase()}</Badge></TableCell>
                    <TableCell><Badge variant={u.status === 'active' ? 'default' : 'destructive'}>{u.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAction('freeze', u.id, u.fullName || u.phone)}><UserX className="h-4 w-4 mr-2" /> Freeze</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('promote', u.id, u.fullName || u.phone)}><UserCheck className="h-4 w-4 mr-2" /> Promote to Agent</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
