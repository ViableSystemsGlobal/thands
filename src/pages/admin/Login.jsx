import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, LogIn, Mail, KeyRound } from 'lucide-react';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, loading, user } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = location.state?.from?.pathname || "/admin/dashboard";

  useEffect(() => {
    try {
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      const userRole = user?.role || null;
      const isAdmin = userRole ? adminRoles.includes(userRole) : false;
      console.log(`AdminLoginPage Effect: IsAuthenticated: ${isAuthenticated}, UserRole: ${userRole}, IsAdmin: ${isAdmin}`);
      // If user is authenticated and has admin privileges, redirect from login page
      if (isAuthenticated && isAdmin) {
        console.log("AdminLoginPage: User has admin privileges and is authenticated, navigating to dashboard from effect.");
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('AdminLoginPage: Error in useEffect:', error);
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Login Error", description: "Email and password are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error("AdminLoginPage:handleSubmit - Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or an unknown error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loader if authentication is in progress
  if (loading || isSubmitting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center p-10 max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500 mx-auto mb-6"></div>
          <h1 className="text-3xl font-bold text-white mb-2">Authenticating...</h1>
          <p className="text-sky-300 mb-6">Please wait...</p>
          
          {/* Show reset button after loading for a while */}
          <div className="mt-8">
            <p className="text-sm text-slate-400 mb-4">Taking too long?</p>
            <Button 
              onClick={() => {
                localStorage.removeItem('auth_token');
                window.location.reload();
              }}
              variant="outline" 
              className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Reset & Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated and admin, useEffect will navigate away.
  // Otherwise, render the login form.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl bg-white/5 backdrop-blur-md border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-slate-100">Admin Login</CardTitle>
          <CardDescription className="text-slate-400">
            Access your dashboard with your administrator credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-sky-400" /> Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 flex items-center">
                <KeyRound className="h-4 w-4 mr-2 text-sky-400" /> Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-sky-500 focus:border-sky-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-sky-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn size={18} className="mr-2"/> Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center mt-4">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} Tailored Hands. All rights reserved.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
