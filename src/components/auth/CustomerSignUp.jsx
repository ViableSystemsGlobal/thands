import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone } from 'lucide-react';
import { signUpCustomer, getCustomerHistoryByEmail } from '@/lib/auth/customerAuth';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/hooks/useAuth';
import RecaptchaComponent from '@/components/ui/recaptcha';
import { useSettings } from '@/hooks/useSettings';

const CustomerSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessionId } = useShop();
  const { triggerAuthentication } = useAuth();
  const { settings } = useSettings();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (settings.captchaEnabled && !recaptchaToken) {
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

  const handleEmailBlur = async () => {
    if (formData.email && /\S+@\S+\.\S+/.test(formData.email) && !emailChecked) {
      try {
        const result = await getCustomerHistoryByEmail(formData.email);
        if (result.success && result.history) {
          setCustomerHistory(result.history);
        }
        setEmailChecked(true);
      } catch (error) {
        console.log('Could not fetch customer history:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await signUpCustomer({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        sessionId: sessionId,
        recaptchaToken: recaptchaToken
      });

      if (result.success) {
        // Show success message with transfer info if applicable
        let toastMessage = result.message;
        
        if (result.transferResults) {
          const { orders_transferred, cart_items_transferred, wishlist_items_transferred } = result.transferResults;
          const transferred = [];
          if (orders_transferred > 0) transferred.push(`${orders_transferred} order${orders_transferred > 1 ? 's' : ''}`);
          if (cart_items_transferred > 0) transferred.push(`${cart_items_transferred} cart item${cart_items_transferred > 1 ? 's' : ''}`);
          if (wishlist_items_transferred > 0) transferred.push(`${wishlist_items_transferred} wishlist item${wishlist_items_transferred > 1 ? 's' : ''}`);
          
          if (transferred.length > 0) {
            toastMessage += ` We've linked your previous ${transferred.join(', ')} to your new account.`;
          }
        }

        toast({
          title: "Account Created Successfully!",
          description: toastMessage,
          className: "bg-green-50 border-green-200 text-green-700",
          duration: 6000,
        });

        // If auto-logged in, trigger auth context update and navigate
        if (result.isAutoLoggedIn) {
          await triggerAuthentication();
          setTimeout(() => navigate('/'), 1000);
        } else {
          // Email confirmation required
          setTimeout(() => navigate('/login'), 2000);
        }

      } else {
        throw new Error(result.error || 'Account creation failed');
      }

    } catch (error) {
      console.error('Sign up error:', error);
      
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
      
      toast({
        title: "Sign Up Failed",
        description: error.message || 'An unexpected error occurred during account creation.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-light text-gray-800">Create Your Account</CardTitle>
              <CardDescription className="text-gray-600">
                Join TailoredHands to track orders and save preferences
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Customer History Preview */}
              {customerHistory && (customerHistory.orders_count > 0 || customerHistory.cart_items_count > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-[#D2B48C]/10 border border-[#D2B48C]/20 rounded-lg"
                >
                  <h4 className="font-medium text-[#C19A6B] mb-2">Welcome back!</h4>
                  <p className="text-sm text-gray-600">
                    We found your shopping history. Creating an account will link:
                  </p>
                  <ul className="text-sm text-gray-700 mt-2 space-y-1">
                    {customerHistory.orders_count > 0 && (
                      <li>• {customerHistory.orders_count} previous order{customerHistory.orders_count > 1 ? 's' : ''}</li>
                    )}
                    {customerHistory.cart_items_count > 0 && (
                      <li>• {customerHistory.cart_items_count} cart item{customerHistory.cart_items_count > 1 ? 's' : ''}</li>
                    )}
                    {customerHistory.wishlist_items_count > 0 && (
                      <li>• {customerHistory.wishlist_items_count} wishlist item{customerHistory.wishlist_items_count > 1 ? 's' : ''}</li>
                    )}
                  </ul>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                        placeholder="John"
                      />
                    </div>
                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.lastName ? 'border-red-500' : ''}`}
                        placeholder="Doe"
                      />
                    </div>
                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

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
                      onBlur={handleEmailBlur}
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="john@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Password */}
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
                      placeholder="At least 6 characters"
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

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      placeholder="Confirm your password"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* reCAPTCHA */}
                <div>
                  <RecaptchaComponent
                    ref={recaptchaRef}
                    onChange={handleRecaptchaChange}
                    onError={handleRecaptchaError}
                    className="mt-2"
                  />
                  {errors.recaptcha && <p className="text-sm text-red-500 mt-1">{errors.recaptcha}</p>}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !recaptchaToken}
                  className="w-full bg-[#D2B48C] hover:bg-[#C19A6B] text-white font-medium py-3 transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              {/* Sign In Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-[#D2B48C] hover:text-[#C19A6B] transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerSignUp; 