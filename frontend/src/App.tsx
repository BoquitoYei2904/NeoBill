
import AuthForm from "./pages/AuthForm";
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
import LicitationUpdate from "./pages/licitationsUpdate";
import Payments from "./pages/payments";
import { useAuth } from './services/AuthContext'
import { AuthProvider } from './services/AuthContext'


function SessionContent() {
  const { session, user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!session || !user) {
    return <AuthForm />;
  }

  return <App />;
}

export default function AppSession() {
  return (
    <AuthProvider>
      <SessionContent />
    </AuthProvider>
  );
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
            path="/payments" 
            element={<Payments />} />
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
          {/* update pages*/}
          <Route
            path="/Licitations/update/:id"
            element={<LicitationUpdate />}
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
