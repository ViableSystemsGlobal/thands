import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, LogIn, Mail, Lock, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { signInCustomer, sendPasswordReset, resendEmailConfirmation } from '@/lib/auth/customerAuth';
import { useAuth } from '@/hooks/useAuth';
import RecaptchaComponent from '@/components/ui/recaptcha';
import { useSettings } from '@/hooks/useSettings';

const CustomerSignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { triggerAuthentication } = useAuth();
  const { settings } = useSettings();
  
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [lastEmailUsed, setLastEmailUsed] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password && !showForgotPassword) {
      newErrors.password = 'Password is required';
    }

    if (!showForgotPassword && settings.captchaEnabled && !recaptchaToken) {
      newErrors.recaptcha = 'Please complete the reCAPTCHA verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    // Clear reCAPTCHA error if token is received
    if (token && errors.recaptcha) {
      setErrors(prev => ({ ...prev, recaptcha: '' }));
    }
  };

  const handleRecaptchaError = (error) => {
    console.error('reCAPTCHA error:', error);
    setRecaptchaToken(null);
    setErrors(prev => ({ ...prev, recaptcha: 'reCAPTCHA verification failed. Please try again.' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setLastEmailUsed(formData.email);

    try {
      const result = await signInCustomer({
        email: formData.email,
        password: formData.password,
        recaptchaToken: recaptchaToken
      });

      if (result.success) {
        toast({
          title: "Welcome Back!",
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-700",
          duration: 4000,
        });

        // Trigger auth context update and navigate
        await triggerAuthentication();
        setTimeout(() => navigate('/'), 500);

      } else {
        throw new Error(result.error || 'Sign in failed');
      }

    } catch (error) {
      console.error('Sign in error:', error);
      
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
      
      // Check if it's an email confirmation issue
      if (error.message.includes('confirm your account') || 
          error.message.includes('email not confirmed')) {
        setShowEmailConfirmation(true);
        setShowForgotPassword(false);
        toast({
          title: "Email Confirmation Required",
          description: "Please check your email and confirm your account before signing in.",
          variant: "default",
          className: "bg-amber-50 border-amber-200 text-amber-700",
          duration: 6000,
        });
      } else {
        toast({
          title: "Sign In Failed",
          description: error.message || 'An unexpected error occurred during sign in.',
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setResetLoading(true);

    try {
      const result = await sendPasswordReset(formData.email);

      if (result.success) {
        toast({
          title: "Reset Email Sent",
          description: result.message,
          className: "bg-blue-50 border-blue-200 text-blue-700",
          duration: 6000,
        });
        setShowForgotPassword(false);
      } else {
        throw new Error(result.error || 'Failed to send reset email');
      }

    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Failed",
        description: error.message || 'An unexpected error occurred sending reset email.',
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!lastEmailUsed) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);

    try {
      const result = await resendEmailConfirmation(lastEmailUsed);

      if (result.success) {
        toast({
          title: "Confirmation Email Sent",
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-700",
          duration: 6000,
        });
      } else {
        throw new Error(result.error || 'Failed to resend confirmation email');
      }

    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast({
        title: "Resend Failed",
        description: error.message || 'An unexpected error occurred resending confirmation email.',
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const resetToSignIn = () => {
    setShowForgotPassword(false);
    setShowEmailConfirmation(false);
    setErrors({});
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-12 h-12 bg-[#D2B48C] rounded-full flex items-center justify-center mb-4">
                {showEmailConfirmation ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <LogIn className="w-6 h-6 text-white" />
                )}
              </div>
              <CardTitle className="text-2xl font-light text-gray-800">
                {showEmailConfirmation 
                  ? 'Email Confirmation Required'
                  : showForgotPassword 
                    ? 'Reset Password' 
                    : 'Welcome Back'
                }
              </CardTitle>
              <CardDescription className="text-gray-600">
                {showEmailConfirmation
                  ? 'Please confirm your email before signing in'
                  : showForgotPassword 
                    ? 'Enter your email to receive a password reset link'
                    : 'Sign in to your TailoredHands account'
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Email Confirmation UI */}
              {showEmailConfirmation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-2">Account needs confirmation</h4>
                      <p className="text-sm text-amber-700 mb-3">
                        We sent a confirmation email to <strong>{lastEmailUsed}</strong>. 
                        Please check your email and click the confirmation link to activate your account.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={handleResendConfirmation}
                          disabled={resendLoading}
                          variant="outline"
                          size="sm"
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          {resendLoading ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-3 w-3" />
                          )}
                          Resend Email
                        </Button>
                        <Button
                          onClick={resetToSignIn}
                          variant="ghost"
                          size="sm"
                          className="text-amber-700 hover:bg-amber-100"
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Regular Sign In/Reset Form */}
              {!showEmailConfirmation && (
                <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  {/* Password - only show if not in forgot password mode */}
                  {!showForgotPassword && (
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                    </div>
                  )}

                  {/* reCAPTCHA - only show for normal sign in, not forgot password */}
                  {!showForgotPassword && (
                    <div>
                      <RecaptchaComponent
                        ref={recaptchaRef}
                        onChange={handleRecaptchaChange}
                        onError={handleRecaptchaError}
                        className="mt-2"
                      />
                      {errors.recaptcha && <p className="text-sm text-red-500 mt-1">{errors.recaptcha}</p>}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || resetLoading || (!showForgotPassword && !recaptchaToken)}
                    className="w-full bg-[#D2B48C] hover:bg-[#C19A6B] text-white font-medium py-3 transition-all duration-300"
                  >
                    {(loading || resetLoading) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {showForgotPassword ? 'Sending Reset Email...' : 'Signing In...'}
                      </>
                    ) : (
                      <>
                        {showForgotPassword ? (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Reset Email
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Forgot Password Toggle */}
              {!showEmailConfirmation && (
                <div className="mt-4 text-center">
                  {!showForgotPassword ? (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-[#D2B48C] hover:text-[#C19A6B] transition-colors"
                    >
                      Forgot your password?
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetToSignIn}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Back to sign in
                    </button>
                  )}
                </div>
              )}

              {/* Sign Up Link */}
              {!showForgotPassword && !showEmailConfirmation && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link
                      to="/signup"
                      className="font-medium text-[#D2B48C] hover:text-[#C19A6B] transition-colors"
                    >
                      Create account
                    </Link>
                  </p>
                </div>
              )}

              {/* Benefits of Creating Account */}
              {!showForgotPassword && !showEmailConfirmation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <UserPlus className="w-4 h-4 mr-2 text-[#D2B48C]" />
                    Why create an account?
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Track your orders and shipping</li>
                    <li>• Save your favorite items</li>
                    <li>• Faster checkout process</li>
                    <li>• Exclusive member offers</li>
                  </ul>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerSignIn; 