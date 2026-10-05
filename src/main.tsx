import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import App from './App.tsx';
import Login from './pages/portal/login.tsx';
import Dashboard from './pages/portal/Dashboard.tsx';

import { pb } from './lib/pocketbase';

import { supabase } from './lib/supabase';

import './index.css';

function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  if (!pb.authStore.isValid) {
    return <Navigate to="/portal/login" replace />;
  }

  return children;
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>

    <Routes>

      {/* PUBLIC WEBSITE */}
      <Route
        path="*"
        element={<App />}
      />

      {/* CRM LOGIN */}
      <Route
        path="/portal/login"
        element={<Login />}
      />

      {/* PROTECTED CRM */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>

  </BrowserRouter>
);