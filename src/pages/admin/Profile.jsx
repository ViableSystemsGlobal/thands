import React, { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authApi } from '@/lib/services/authApi';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  support: 'Support',
};

const AdminProfile = () => {
  const { user, updateProfile } = useAdminAuth();
  const { toast } = useToast();

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || 'AD';

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({ fullName: profileForm.fullName.trim(), phone: profileForm.phone });
      toast({ title: 'Profile updated' });
    } catch {
      // toast is shown by updateProfile on error
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setPasswordSaving(true);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast({ title: 'Password changed successfully' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: 'Password change failed',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account details and password</p>
      </div>

      {/* Identity card */}
      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${initials}`}
              alt={user?.fullName || 'Admin'}
            />
            <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-slate-800">{user?.fullName || user?.email}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              {ROLE_LABELS[user?.role] || user?.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Profile details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription>Update your display name and phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-gray-50" />
              <p className="text-xs text-slate-400">Email cannot be changed here</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+233 ..."
              />
            </div>
            <Button type="submit" disabled={profileSaving}>
              {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Use a strong password you don't use elsewhere</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;
