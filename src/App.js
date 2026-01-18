import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ConnectionStatus from './components/ConnectionStatus';

// Páginas públicas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ChangePassword from './pages/ChangePassword';

// Páginas Cliente
import ClienteDashboard from './pages/Cliente/Dashboard';
import ClienteServicos from './pages/Cliente/Servicos';
import ClienteAgendamentos from './pages/Cliente/AgendamentosCompleto';

// Páginas Jovem
import JovemDashboard from './pages/Jovem/Dashboard';
import JovemServicos from './pages/Jovem/Servicos';
import JovemHistorico from './pages/Jovem/HistoricoCompleto';

// Páginas ONG
import ONGDashboard from './pages/ONG/Dashboard';
import ONGJovens from './pages/ONG/Jovens';
import ONGServicos from './pages/ONG/Servicos';

// Páginas Admin
import AdminDashboard from './pages/Admin/Dashboard';
import AdminONGs from './pages/Admin/ONGs';
import AdminUsuarios from './pages/Admin/Usuarios';
import AdminServicos from './pages/Admin/Servicos';

// Estilos globais
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ConnectionStatus />
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Rotas Cliente */}
          <Route
            path="/cliente/dashboard"
            element={
              <PrivateRoute allowedTypes={['cliente']}>
                <ClienteDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/cliente/servicos"
            element={
              <PrivateRoute allowedTypes={['cliente']}>
                <ClienteServicos />
              </PrivateRoute>
            }
          />
          <Route
            path="/cliente/agendamentos"
            element={
              <PrivateRoute allowedTypes={['cliente']}>
                <ClienteAgendamentos />
              </PrivateRoute>
            }
          />

          {/* Rotas Jovem */}
          <Route
            path="/jovem/dashboard"
            element={
              <PrivateRoute allowedTypes={['jovem']}>
                <JovemDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/jovem/servicos"
            element={
              <PrivateRoute allowedTypes={['jovem']}>
                <JovemServicos />
              </PrivateRoute>
            }
          />
          <Route
            path="/jovem/historico"
            element={
              <PrivateRoute allowedTypes={['jovem']}>
                <JovemHistorico />
              </PrivateRoute>
            }
          />

          {/* Rotas ONG */}
          <Route
            path="/ong/dashboard"
            element={
              <PrivateRoute allowedTypes={['ong']}>
                <ONGDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/ong/jovens"
            element={
              <PrivateRoute allowedTypes={['ong']}>
                <ONGJovens />
              </PrivateRoute>
            }
          />
          <Route
            path="/ong/servicos"
            element={
              <PrivateRoute allowedTypes={['ong']}>
                <ONGServicos />
              </PrivateRoute>
            }
          />

          {/* Rotas Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedTypes={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/ongs"
            element={
              <PrivateRoute allowedTypes={['admin']}>
                <AdminONGs />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <PrivateRoute allowedTypes={['admin']}>
                <AdminUsuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/servicos"
            element={
              <PrivateRoute allowedTypes={['admin']}>
                <AdminServicos />
              </PrivateRoute>
            }
          />

          {/* Rota padrão */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
