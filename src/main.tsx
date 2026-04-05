import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import PasswordProtect from './components/PasswordProtect';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PasswordProtect>
      <App />
    </PasswordProtect>
  </StrictMode>,
);
