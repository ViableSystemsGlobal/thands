
import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ShopProvider } from "@/context/ShopContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { BranchProvider } from "@/context/BranchContext";
import DynamicFavicon from "@/components/DynamicFavicon";
import MainRoutes from "@/routes/MainRoutes";
import AdminRoutes from "@/routes/AdminRoutes";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      {/*
        The ToastProvider from @/components/ui/use-toast.js (or .jsx) is the one that provides the
        toast dispatch function via context. Components that use the useToast() hook (like AuthContext)
        need to be descendants of this provider.
        The Toaster component from @/components/ui/toaster.jsx is responsible for rendering the toasts.
        It typically includes Radix UI's Toast.Provider internally.

        The main.jsx file already wraps the <App /> component with CustomToastProvider
        (which is an alias for the ToastProvider from @/components/ui/use-toast.js).
        Therefore, we do not need to add another ToastProvider here in App.jsx.
        The necessary provider is already at a higher level.
      */}
      <AuthProvider>
        <BranchProvider>
          <CurrencyProvider>
            <DynamicFavicon />
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-purple-500"></div>
              <p className="ml-4 text-xl font-semibold">Loading Tailored Hands...</p>
            </div>
          }>
            <Routes>
              <Route path="/admin/*" element={
                <AdminAuthProvider>
                  <AdminRoutes />
                </AdminAuthProvider>
              } />
              <Route path="/*" element={
                <MainRoutes />
              } />
            </Routes>
            <Toaster />
          </Suspense>
          </CurrencyProvider>
        </BranchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
