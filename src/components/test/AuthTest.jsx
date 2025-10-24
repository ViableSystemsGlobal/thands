import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

const AuthTest = () => {
  const { user, loading, isAuthenticated, login, register, logout } = useAuth();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      });
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pt-16 pb-16"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* API Indicator Banner */}
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
            <p className="font-bold">Testing New Auth API</p>
            <p className="text-sm">Authentication: http://localhost:3003/api/auth</p>
          </div>

          {isAuthenticated ? (
            // User is logged in
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">✅ Authentication Working!</CardTitle>
                <CardDescription>
                  You are successfully logged in with the new JWT authentication system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">User Information:</h3>
                  <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>User ID:</strong> {user.id}</p>
                </div>
                
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          ) : (
            // User is not logged in
            <Card>
              <CardHeader>
                <CardTitle>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </CardTitle>
                <CardDescription>
                  Test the new JWT authentication system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required={!isLogin}
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required={!isLogin}
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your password"
                      minLength={6}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"
                    }
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AuthTest;
