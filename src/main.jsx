import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";
import { ToastProvider } from "@/components/ui/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";

console.log("🚀 Main.jsx is loading...");
console.log("🔧 Environment variables:", {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api',
  PAYSTACK_KEY_SET: !!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  BACKEND_MODE: 'Custom Backend API'
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ Root element not found!");
  throw new Error("Root element not found. Make sure there is a div with id 'root' in your HTML.");
}

console.log("✅ Root element found, creating React root...");

const root = ReactDOM.createRoot(rootElement);

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});

console.log("🎯 Rendering app...");

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

console.log("✅ App render called");
