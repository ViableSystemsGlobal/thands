import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import { Loader2 } from "lucide-react";

// Import Dashboard and Orders directly to avoid dynamic import issues
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminOrders from "@/pages/admin/Orders";

const AdminLoginPage = lazy(() => import("@/pages/admin/Login"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const AdminConsultations = lazy(() => import("@/pages/admin/Consultations"));
const AdminSales = lazy(() => import("@/pages/admin/Sales"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminCustomers = lazy(() => import("@/pages/admin/Customers"));
const AdminMessages = lazy(() => import("@/pages/admin/Messages"));
const AdminShippingRules = lazy(() => import("@/pages/admin/ShippingRules"));
const ManageGiftVoucherTypes = lazy(() => import("@/pages/admin/ManageGiftVoucherTypes"));
const IssuedGiftVouchers = lazy(() => import("@/pages/admin/IssuedGiftVouchers"));
const ProductFAQs = lazy(() => import("@/pages/admin/ProductFAQs"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const AdminCouponsPage = lazy(() => import("@/pages/admin/Coupons"));
const KnowledgeBase = lazy(() => import("@/pages/admin/KnowledgeBase"));
const Newsletter = lazy(() => import("@/pages/admin/Newsletter"));
const ChatLeads = lazy(() => import("@/pages/admin/ChatLeads"));
const ChatMonitoring = lazy(() => import("@/pages/admin/ChatMonitoring"));
const Email = lazy(() => import("@/pages/admin/Email"));
const SMS = lazy(() => import("@/pages/admin/SMS"));

// Communication pages
const NotificationSettings = lazy(() => import("@/pages/admin/communication/NotificationSettings"));

const AdminPageFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
    <div className="text-center p-10">
      <Loader2 className="animate-spin rounded-full h-16 w-16 text-sky-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-white mb-2">Loading Page...</h1>
      <p className="text-sky-300">Please wait a moment.</p>
    </div>
  </div>
);


const AdminRoutes = () => {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        
        {/* AdminLayout now wraps all protected admin routes */}
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="consultations" element={<AdminConsultations />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="shipping" element={<AdminShippingRules />} />
          <Route path="gift-voucher-types" element={<ManageGiftVoucherTypes />} />
          <Route path="issued-gift-vouchers" element={<IssuedGiftVouchers />} />
          <Route path="product-faqs" element={<ProductFAQs />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="newsletter" element={<Newsletter />} />
          <Route path="chat-leads" element={<ChatLeads />} />
          <Route path="chat-monitoring" element={<ChatMonitoring />} />
          <Route path="email" element={<Email />} />
          <Route path="sms" element={<SMS />} />
          
          {/* Communication routes */}
          <Route path="communication/notifications" element={<NotificationSettings />} />
          
          {/* Default redirect for /admin or /admin/ */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
        
        {/* Fallback for any other /admin/* routes not matched above */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
