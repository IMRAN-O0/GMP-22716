import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Override global fetch to attach Authorization header
const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
    configurable: true,
    writable: true,
    value: async (...args: any[]) => {
        let [resource, config] = args;
        if (typeof resource === 'string' && resource.startsWith('/api/')) {
            config = config || {};
            const token = localStorage.getItem('token');
            if (token) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
        }
        return originalFetch(resource, config);
    }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
