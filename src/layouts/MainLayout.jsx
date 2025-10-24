
import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchDialog from "@/components/ui/search-dialog";
import BottomMobileNav from "@/components/navbar/BottomMobileNav";
import ChatbotWebSocket from "@/components/ChatbotWebSocket";
import CookieConsent from "@/components/CookieConsent";
import NewsletterPopup from "@/components/NewsletterPopup";

const NAVBAR_HEIGHT_APPROX = "80px"; 
const BOTTOM_NAV_HEIGHT_APPROX = "72px";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <SearchDialog />
      <main 
        className="flex-1 w-full"
        style={{ 
          paddingTop: NAVBAR_HEIGHT_APPROX,
          paddingBottom: `calc(${BOTTOM_NAV_HEIGHT_APPROX} + 1rem)` 
        }} 
      >
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[calc(100vh-160px)]"> 
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <BottomMobileNav />
      <ChatbotWebSocket />
      <CookieConsent />
      <NewsletterPopup />
    </div>
  );
};

export default MainLayout;
