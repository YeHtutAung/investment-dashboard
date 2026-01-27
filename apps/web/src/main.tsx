import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <OfflineIndicator />
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);
