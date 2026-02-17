import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Key, Lock, Loader2 } from 'lucide-react';
import { useChangePassword, useChangePin } from '@/hooks/use-api';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useState } from 'react';

const Security = () => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');

  const pwMutation = useChangePassword();
  const pinMutation = useChangePin();

  const handleChangePassword = () => {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    pwMutation.mutate(
      { currentPassword: currentPw, newPassword: newPw },
      { onSuccess: () => { setCurrentPw(''); setNewPw(''); setConfirmPw(''); } }
    );
  };

  const handleChangePin = () => {
    pinMutation.mutate(
      { currentPin, newPin },
      { onSuccess: () => { setCurrentPin(''); setNewPin(''); } }
    );
  };

  const handle2fa = async (enabled: boolean) => {
    try {
      await api.toggle2fa(enabled);
      toast.success(enabled ? '2FA Enabled' : '2FA Disabled');
    } catch {
      toast.error('Failed to update 2FA');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Security Settings</h1>
        <p className="text-muted-foreground">Protect your account</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-5 w-5" /> Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
          <Button onClick={handleChangePassword} disabled={pwMutation.isPending}>
            {pwMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Update Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-5 w-5" /> Transaction PIN</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Current PIN</Label><Input type="password" maxLength={4} value={currentPin} onChange={e => setCurrentPin(e.target.value)} /></div>
          <div className="space-y-2"><Label>New PIN</Label><Input type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)} /></div>
          <Button onClick={handleChangePin} disabled={pinMutation.isPending}>
            {pinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Update PIN
          </Button>
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
            <Switch onCheckedChange={handle2fa} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Security;
