import React, { createContext, useContext, useRef } from 'react';
import ToastManager from './ToastManager';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const toastRef = useRef(null);

  const toast = {
    success: (msg, detail) => toastRef.current?.success(msg, detail),
    warn: (msg, detail) => toastRef.current?.warn(msg, detail),
    error: (msg, detail) => toastRef.current?.error(msg, detail),
    info: (msg, detail) => toastRef.current?.info(msg, detail),
  };

  return (
    <ToastContext.Provider value={toast}>
      <ToastManager ref={toastRef} />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
