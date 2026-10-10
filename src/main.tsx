import { createRoot } from 'react-dom/client';
import React, { type ReactNode } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import App from './App.tsx';
import Login from './pages/portal/login.tsx';
import Dashboard from './pages/portal/Dashboard.tsx';

import { supabase } from './lib/supabase';

import './index.css';

function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    React.useState<any>(undefined);

  React.useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setSession(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Supabase session is still being checked.
   */
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#C5832B] text-sm font-semibold tracking-wider uppercase">
            Loading CRM...
          </div>
        </div>
      </div>
    );
  }

  /*
   * No Supabase session = not authenticated.
   */
  if (!session) {
    return (
      <Navigate
        to="/portal/login"
        replace
      />
    );
  }

  return children;
}

createRoot(
  document.getElementById('root')!
).render(
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
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>

  </BrowserRouter>
);