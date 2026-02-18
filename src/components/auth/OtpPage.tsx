import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const OtpPage = () => {
  const { verifyOtp, requestOtp, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [method, setMethod] = useState<'sms' | 'email'>('sms');
  const [error, setError] = useState('');

  // If already authenticated, go to dashboard
  if (isAuthenticated && user) {
    const dashPath = user.role === 'admin' || user.role === 'superadmin' ? '/admin' : user.role === 'agent' ? '/agent' : '/dashboard';
    navigate(dashPath, { replace: true });
    return null;
  }

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const success = await verifyOtp(otp);
      if (success) {
        toast.success('Verification successful!');
        // Navigation will happen automatically via the isAuthenticated check above on re-render
      } else {
        setError('Invalid OTP code. Please try again.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const success = await requestOtp(method);
      if (success) {
        toast.success(`OTP sent via ${method.toUpperCase()}`);
      } else {
        toast.error('Failed to resend OTP');
      }
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src={logo} alt="Aban Remit" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold">Verify Your Account</h1>
          <p className="text-muted-foreground mt-1">Enter the verification code we sent you</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-4" />
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Button
                variant={method === 'sms' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setMethod('sms')}
              >
                <Smartphone className="h-4 w-4" /> SMS
              </Button>
              <Button
                variant={method === 'email' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setMethod('email')}
              >
                <Mail className="h-4 w-4" /> Email
              </Button>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Enter the 6-digit code sent to your {method === 'sms' ? 'phone' : 'email'}
            </p>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button className="w-full" disabled={otp.length < 6 || loading} onClick={handleVerify}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn't receive code?{' '}
              <button
                className="text-primary hover:underline font-medium"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OtpPage;
