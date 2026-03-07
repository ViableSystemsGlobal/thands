
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, login, googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      // Redirect to the intended page or home
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleGoogleCredential = async (credential) => {
    setLoading(true);
    try {
      await googleLogin(credential);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      // error toast is shown by googleLogin
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (!result.user) {
        throw new Error("Login failed");
      }

      toast({
        title: "Success!",
        description: `Welcome back, ${result.user.first_name}!`,
        variant: "success",
      });

      setTimeout(() => {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }, 300);
    } catch (error) {
      console.error("Error logging in:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error && error.message) {
        description = error.message; 
        if (error.message.toLowerCase().includes("invalid credentials")) {
          description = "Invalid email or password. Please try again.";
        } else if (error.message.toLowerCase().includes("user not found")) {
          description = "No account found with this email address.";
        }
      }
      
      toast({
        title: "Login Error",
        description: description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-4xl font-light mb-4 text-center">Login</h1>
          
          {location.state?.message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm text-center">
                {location.state.message}
              </p>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>

              <p className="text-center text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-600 hover:underline">
                  Sign up
                </Link>
              </p>

              <GoogleSignInButton onCredential={handleGoogleCredential} />
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
