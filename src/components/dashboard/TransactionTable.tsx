import { Transaction } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownToLine, ArrowUpRight, Phone, ArrowLeftRight, DollarSign, Wallet } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  deposit: <ArrowDownToLine className="h-4 w-4 text-success" />,
  withdrawal: <ArrowUpRight className="h-4 w-4 text-warning" />,
  transfer: <ArrowUpRight className="h-4 w-4 text-primary" />,
  airtime: <Phone className="h-4 w-4 text-accent-foreground" />,
  exchange: <ArrowLeftRight className="h-4 w-4 text-chart-4" />,
  commission: <DollarSign className="h-4 w-4 text-success" />,
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  completed: 'default',
  pending: 'secondary',
  failed: 'destructive',
};

const TransactionTable = ({ transactions, compact }: { transactions: Transaction[]; compact?: boolean }) => {
  const items = compact ? transactions.slice(0, 5) : transactions;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            {!compact && <TableHead>Reference</TableHead>}
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(tx => (
            <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>{typeIcons[tx.type] || <Wallet className="h-4 w-4" />}</TableCell>
              <TableCell className="font-medium">{tx.description}</TableCell>
              {!compact && <TableCell className="text-muted-foreground text-xs">{tx.reference}</TableCell>}
              <TableCell className="text-muted-foreground text-sm">{tx.date}</TableCell>
              <TableCell className="text-right font-medium">
                {tx.type === 'deposit' || tx.type === 'commission' ? '+' : '-'}
                {tx.amount.toLocaleString()} {tx.currency}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionTable;
