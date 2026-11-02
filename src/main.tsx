import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';

import './index.css';

/*
 * All routes (public website, CRM login and the protected portal)
 * live in App.tsx. A second route table here used to render the
 * dashboard outside the portal layout.
 */
createRoot(
  document.getElementById('root')!
).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
