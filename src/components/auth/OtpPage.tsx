import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

const OtpPage = () => {
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'sms' | 'email'>('sms');

  const handleVerify = async () => {
    setLoading(true);
    await verifyOtp(otp);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src={logo} alt="Aban Remit" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold">Verify Your Account</h1>
          <p className="text-muted-foreground mt-1">We sent a verification code</p>
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
              {method === 'sms' ? 'Code sent to +254•••••678' : 'Code sent to l•••n@abanremit.com'}
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

            <Button className="w-full" disabled={otp.length < 6 || loading} onClick={handleVerify}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn't receive code?{' '}
              <button className="text-primary hover:underline font-medium">Resend</button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OtpPage;
