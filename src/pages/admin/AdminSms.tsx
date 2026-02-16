import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';

const AdminSms = () => {
  const [bulkTarget, setBulkTarget] = useState('all_users');
  const [message, setMessage] = useState('');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">SMS Management</h1><p className="text-muted-foreground">Configure SMS and send bulk messages</p></div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5" /> SMS Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="font-medium text-sm">Transaction SMS</p><p className="text-xs text-muted-foreground">Send SMS on every transaction</p></div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="font-medium text-sm">OTP SMS</p><p className="text-xs text-muted-foreground">Send OTP via SMS</p></div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label>SMS Charge (KES)</Label>
            <Input type="number" defaultValue="2" className="max-w-[120px]" />
          </div>
          <Button onClick={() => toast.success('SMS settings saved!')}>Save Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-5 w-5" /> Bulk SMS</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Send To</Label>
            <Select value={bulkTarget} onValueChange={setBulkTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_users">All Users</SelectItem>
                <SelectItem value="all_agents">All Agents</SelectItem>
                <SelectItem value="all">Everyone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea placeholder="Type your message..." value={message} onChange={e => setMessage(e.target.value)} rows={4} />
            <p className="text-xs text-muted-foreground">{message.length}/160 characters</p>
          </div>
          <Button disabled={!message} onClick={() => { toast.success('Bulk SMS sent!'); setMessage(''); }}>Send Bulk SMS</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSms;
