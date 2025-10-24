
import { useState, useEffect, createContext, useContext, useCallback } from "react";

const TOAST_LIMIT = 3; 
const TOAST_REMOVE_DELAY = 5000;

const ToastContext = createContext(undefined);

let count = 0;

function generateId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

export function useToastProvider() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(
    ({ title, description, variant, duration, action }) => {
      const id = generateId();
      const newToast = {
        id,
        title,
        description,
        variant,
        duration: duration || TOAST_REMOVE_DELAY,
        action,
        open: true,
      };

      setToasts((prevToasts) => [newToast, ...prevToasts].slice(0, TOAST_LIMIT));

      return {
        id,
        dismiss: () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        update: (props) =>
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...props } : t))
          ),
      };
    },
    []
  );

  useEffect(() => {
    const timers = toasts.map((t) => {
      if (t.duration === Infinity) return null;
      return setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((toastItem) => toastItem.id !== t.id));
      }, t.duration);
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [toasts]);

  return { toasts, toast };
}


export function ToastProvider({ children }) {
  const toastState = useToastProvider();
  return (
    <ToastContext.Provider value={toastState}>
      {children}
    </ToastContext.Provider>
  );
}


export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
