import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ShopApi from "@/pages/ShopApi";
import Cart from "@/pages/Cart";
import Wishlist from "@/pages/Wishlist";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import ProductDetail from "@/pages/ProductDetail";
import ProductDetailApi from "@/pages/ProductDetailApi";
import ConsultationForm from "@/pages/Consultation";
import CustomerSignIn from "@/components/auth/CustomerSignIn";
import CustomerSignUp from "@/components/auth/CustomerSignUp";
import OrderStatus from "@/pages/OrderStatus";
import OrderDetails from "@/pages/OrderDetails";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Checkout from "@/pages/Checkout";
import Account from "@/pages/Account";
import Orders from "@/pages/Orders";
import GiftVouchers from "@/pages/GiftVouchers";
import TrackOrder from "@/pages/TrackOrder";
import OrderPaymentSuccess from "@/pages/OrderPaymentSuccess";
import ApiTest from "@/components/test/ApiTest";
import SimpleApiTest from "@/components/test/SimpleApiTest";
import AuthTest from "@/components/test/AuthTest";
import UploadTest from "@/components/test/UploadTest";
import EmailTest from "@/components/test/EmailTest";

const MainRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<ShopApi />} />
        <Route path="/shop-old" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:id" element={<ProductDetailApi />} />
        <Route path="/product-old/:id" element={<ProductDetail />} />
        <Route path="/consultation" element={<ConsultationForm />} />
        <Route path="/order-status/:orderNumber" element={<OrderStatus />} />
        {/* <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} /> */}
        <Route path="/order-payment-success/:orderNumber" element={<OrderPaymentSuccess />} />
        <Route path="/order/:id" element={<OrderDetails />} />
        <Route path="/login" element={<CustomerSignIn />} />
        <Route path="/signin" element={<CustomerSignIn />} />
        <Route path="/signup" element={<CustomerSignUp />} />
        <Route path="/account" element={<Account />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/gift-vouchers" element={<GiftVouchers />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/api-test" element={<ApiTest />} />
        <Route path="/simple-api-test" element={<SimpleApiTest />} />
        <Route path="/auth-test" element={<AuthTest />} />
        <Route path="/upload-test" element={<UploadTest />} />
        <Route path="/email-test" element={<EmailTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default MainRoutes;
