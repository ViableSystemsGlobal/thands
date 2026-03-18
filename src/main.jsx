import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";
import { ToastProvider } from "@/components/ui/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";


const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ Root element not found!");
  throw new Error("Root element not found. Make sure there is a div with id 'root' in your HTML.");
}

const root = ReactDOM.createRoot(rootElement);

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
