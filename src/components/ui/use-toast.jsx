
import React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 3000;

const ToastContext = createContext({});

let count = 0;

function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }) {
  const [state, setState] = useState({
    toasts: [],
  });

  const toast = useCallback(
    function ({ ...props }) {
      const id = generateId();

      const update = (props) =>
        setState((state) => ({
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === id ? { ...t, ...props } : t
          ),
        }));

      const dismiss = () => setState((state) => ({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== id),
      }));

      setState((state) => ({
        ...state,
        toasts: [
          { ...props, id, dismiss },
          ...state.toasts,
        ].slice(0, TOAST_LIMIT),
      }));

      return {
        id,
        dismiss,
        update,
      };
    },
    []
  );

  useEffect(() => {
    const timeouts = [];

    state.toasts.forEach((toast) => {
      if (toast.duration === Infinity) {
        return;
      }

      const timeout = setTimeout(() => {
        setState((state) => ({
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toast.id),
        }));
      }, toast.duration || TOAST_REMOVE_DELAY);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [state.toasts]);

  return (
    <ToastContext.Provider value={{ ...state, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useToastContext();
}
