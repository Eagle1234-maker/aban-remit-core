import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, User, MapPin, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const handleKycUpload = async (docType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', docType);
        await api.submitKyc(formData);
        toast.success(`${docType} uploaded successfully`);
        await refreshUser();
      } catch {
        toast.error(`Failed to upload ${docType}`);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleUpdateProfile = async () => {
    try {
      await api.updateProfile({ country, city });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Profile & KYC</h1>
        <p className="text-muted-foreground">Manage your identity verification</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><User className="h-5 w-5" /> Personal Info</CardTitle>
            <Badge variant={user.kycStatus === 'approved' ? 'default' : user.kycStatus === 'pending' ? 'secondary' : 'destructive'}>
              KYC: {user.kycStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={user.fullName} readOnly /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={user.email} readOnly /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={user.phone} readOnly /></div>
            <div className="space-y-2"><Label>Wallet Number</Label><Input value={user.walletNumber} readOnly /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5" /> Location</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Country</Label><Input placeholder="Kenya" value={country} onChange={e => setCountry(e.target.value)} /></div>
            <div className="space-y-2"><Label>City/Location</Label><Input placeholder="Nairobi" value={city} onChange={e => setCity(e.target.value)} /></div>
          </div>
          <Button onClick={handleUpdateProfile}>Save Location</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-5 w-5" /> KYC Documents</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {['ID Front', 'ID Back', 'Selfie'].map(doc => (
            <div key={doc} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border">
              <span className="text-sm">{doc}</span>
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => handleKycUpload(doc)}>
                {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />} Upload
              </Button>
            </div>
          ))}
          <Button className="w-full" onClick={() => toast.info('All documents must be uploaded first')}>Submit for Verification</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
