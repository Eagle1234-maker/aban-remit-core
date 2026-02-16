import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const users = [
  { id: '1', name: 'Laban Mwangi', email: 'laban@email.com', phone: '+254712345678', wallet: 'WLT7770001', balance: 24500, kyc: 'approved', status: 'active' },
  { id: '2', name: 'Mary Akinyi', email: 'mary@email.com', phone: '+254798765432', wallet: 'WLT7770002', balance: 8200, kyc: 'pending', status: 'active' },
  { id: '3', name: 'James Omondi', email: 'james@email.com', phone: '+254711222333', wallet: 'WLT7770003', balance: 150, kyc: 'rejected', status: 'frozen' },
  { id: '4', name: 'Sarah Njeri', email: 'sarah@email.com', phone: '+254722333444', wallet: 'WLT7770004', balance: 56000, kyc: 'approved', status: 'active' },
];

const AdminUsers = () => (
  <div className="space-y-6 animate-fade-in">
    <div><h1 className="text-2xl font-display font-bold">User Management</h1><p className="text-muted-foreground">Manage all platform users</p></div>
    <Card>
      <CardHeader>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-10" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Wallet</TableHead><TableHead>Balance</TableHead><TableHead>KYC</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div></TableCell>
                <TableCell className="font-mono text-sm">{u.wallet}</TableCell>
                <TableCell>KES {u.balance.toLocaleString()}</TableCell>
                <TableCell><Badge variant={u.kyc === 'approved' ? 'default' : u.kyc === 'pending' ? 'secondary' : 'destructive'}>{u.kyc}</Badge></TableCell>
                <TableCell><Badge variant={u.status === 'active' ? 'default' : 'destructive'}>{u.status}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.info('View profile')}>View Profile</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.success('Account frozen')}><UserX className="h-4 w-4 mr-2" /> Freeze</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.success('Promoted to agent')}><UserCheck className="h-4 w-4 mr-2" /> Promote to Agent</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default AdminUsers;
