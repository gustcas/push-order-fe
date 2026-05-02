import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Toast } from 'primereact/toast';

const ToastManager = forwardRef((props, ref) => {
  const toast = useRef(null);
  useImperativeHandle(ref, () => ({
    success: (msg, detail) =>
      toast.current?.show({ severity: 'success', summary: msg, detail, life: 3000 }),
    warn: (msg, detail) =>
      toast.current?.show({ severity: 'warn', summary: msg, detail, life: 4000 }),
    error: (msg, detail) =>
      toast.current?.show({ severity: 'error', summary: msg, detail, life: 5000 }),
    info: (msg, detail) =>
      toast.current?.show({ severity: 'info', summary: msg, detail, life: 3000 }),
  }));
  return <Toast ref={toast} position="top-right" />;
});

ToastManager.displayName = 'ToastManager';
export default ToastManager;
