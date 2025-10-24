
import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, UserCheck, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const UserManagement = () => {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading User Information...</CardTitle>
            <CardDescription>Please wait while we fetch the user details.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is admin and extract profile data
  const isAdmin = user?.role === 'admin';
  const profile = {
    full_name: user?.full_name || user?.email?.split('@')[0] || 'Admin User',
    role: user?.role || 'admin',
    avatar_url: null
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-full">
      <Card className="shadow-lg border-t-4 border-indigo-600">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">User Management</CardTitle>
              <CardDescription className="text-slate-500">
                Overview of the current administrative user. Full user listing requires server-side implementation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <AlertTitle className="font-semibold">Limited View</AlertTitle>
            <AlertDescription>
              Currently, this page only displays information for the logged-in administrator.
              Managing multiple users requires backend API implementation for secure user management.
            </AlertDescription>
          </Alert>

          {user && isAdmin ? (
            <Card className="border-slate-200 shadow-md">
              <CardHeader className="bg-slate-50 rounded-t-lg">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 border-2 border-indigo-500">
                    <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name || user.email}`} alt={profile.full_name || user.email} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                      {profile.full_name ? profile.full_name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl text-slate-700">{profile.full_name || "N/A"}</CardTitle>
                    <CardDescription className="text-slate-500">{user.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">User ID:</span>
                  <span className="text-sm text-slate-800 font-mono bg-slate-100 px-2 py-1 rounded">{user.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Role:</span>
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white capitalize">
                    <UserCheck className="h-4 w-4 mr-1.5" />
                    {profile.role || "Admin"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Account Created:</span>
                  <span className="text-sm text-slate-800">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Last Sign In:</span>
                  <span className="text-sm text-slate-800">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Could not load administrator information. Please ensure you are logged in with an admin account.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Future Enhancements</h2>
          <p className="text-sm text-slate-600">
            To enable full user management capabilities, such as listing all users, editing roles, or deleting users,
            additional backend API endpoints must be implemented. These endpoints will handle these administrative tasks securely
            on the server-side.
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
            <li>Implement backend API endpoint to list all users.</li>
            <li>Implement backend API endpoints for updating user roles.</li>
            <li>Implement backend API endpoint for deleting users.</li>
            <li>Update this page to interact with these backend endpoints.</li>
          </ul>
      </div>

    </div>
  );
};

export default UserManagement;
