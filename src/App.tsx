import { Routes, Route, Navigate } from 'react-router-dom';
import GameScreen from './screens/GameScreen';
import AdminLogin from './screens/AdminLogin';
import AdminDashboard from './screens/AdminDashboard';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

import type { ReactNode } from 'react';

function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    // Listen for auth state changes (session expiry, sign-out in another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="loading-screen">Checking permissions...</div>;

  return authenticated ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GameScreen />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      {/* Redirect unknown routes to Game */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
