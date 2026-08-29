import { useEffect, useState} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./services/supabaseClient";
import AuthForm from "./services/AuthForm";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import MainLayout from './layout/mainLayout'
import Home from './pages/home'
import Dashboard from './pages/dashboard'
import Clients from './pages/clients'
import Settings from './pages/settings'
import Products from './pages/products'
import LicitationDetail from "./pages/licitationsPage";
import ClientDetail from "./pages/clientPage";
import ProductDetail from "./pages/productPage";

export default function AppSession() {
  const [session, setSession] = useState<Session | null>(null);
  console.log(session?.access_token);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (sessionLoading) return null;
  if (!session) return <AuthForm />;

  return <App />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route 
            path="/" 
            element={<Home/>} />
          <Route 
            path="/dashboard" 
            element={<Dashboard />} />
          <Route 
            path="/clients" 
            element={<Clients />} />
          <Route 
            path="/settings" 
            element={<Settings />} />
          <Route 
            path="/products" 
            element={<Products />} />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
          {/* Detail pages */}
          <Route
            path="/Licitations/:id"
            element={<LicitationDetail />}
          />
          <Route
            path="/Clients/:id"
            element={<ClientDetail />}
          />
          <Route
            path="/Products/:id"
            element={<ProductDetail />}
          />
          {/* create pages*/}
          <Route
            path="/Licitations/create"
            element={<LicitationDetail />}
          />
          {/* update pages*/}
          <Route
            path="/Licitations/update/:id"
            element={<LicitationDetail />}
          />
          <Route
            path="/Clients/update/:id"
            element={<ClientDetail />}
          />
          <Route
            path="/Products/update/:id"
            element={<ProductDetail />}
          />
          
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

interface ComingSoonProps {
  title: string
}

function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-700">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Esta página estará disponible próximamente.
        </p>
      </div>
    </div>
  )
}
