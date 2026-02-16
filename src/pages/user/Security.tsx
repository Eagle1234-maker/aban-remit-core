import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Shield, Key, Lock } from 'lucide-react';

const Security = () => (
  <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold">Security Settings</h1>
      <p className="text-muted-foreground">Protect your account</p>
    </div>

    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-5 w-5" /> Change Password</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Current Password</Label><Input type="password" /></div>
        <div className="space-y-2"><Label>New Password</Label><Input type="password" /></div>
        <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" /></div>
        <Button onClick={() => toast.success('Password updated!')}>Update Password</Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-5 w-5" /> Transaction PIN</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Current PIN</Label><Input type="password" maxLength={4} /></div>
        <div className="space-y-2"><Label>New PIN</Label><Input type="password" maxLength={4} /></div>
        <Button onClick={() => toast.success('PIN updated!')}>Update PIN</Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5" /> Two-Factor Authentication</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Enable 2FA</p>
            <p className="text-xs text-muted-foreground">Add extra security to your account</p>
          </div>
          <Switch onCheckedChange={(v) => toast.success(v ? '2FA Enabled' : '2FA Disabled')} />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default Security;
