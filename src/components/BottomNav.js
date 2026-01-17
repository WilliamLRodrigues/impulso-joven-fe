import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BottomNav = () => {
  const { user } = useAuth();

  const getNavItems = () => {
    switch (user?.userType) {
      case 'admin':
        return [
          { path: '/admin/dashboard', label: '📊 Dashboard', icon: '📊' },
          { path: '/admin/servicos', label: '💼 Serviços', icon: '💼' },
          { path: '/admin/ongs', label: '🏢 ONGs', icon: '🏢' },
          { path: '/admin/usuarios', label: '👥 Usuários', icon: '👥' }
        ];
      case 'ong':
        return [
          { path: '/ong/dashboard', label: '📊 Dashboard', icon: '📊' },
          { path: '/ong/jovens', label: '👨‍🎓 Jovens', icon: '👨‍🎓' },
          { path: '/ong/servicos', label: '💼 Serviços', icon: '💼' }
        ];
      case 'jovem':
        return [
          { path: '/jovem/dashboard', label: '🏠 Início', icon: '🏠' },
          { path: '/jovem/servicos', label: '💼 Serviços', icon: '💼' },
          { path: '/jovem/historico', label: '📜 Histórico', icon: '📜' }
        ];
      case 'cliente':
        return [
          { path: '/cliente/dashboard', label: '🏠 Início', icon: '🏠' },
          { path: '/cliente/servicos', label: '🔍 Buscar', icon: '🔍' },
          { path: '/cliente/agendamentos', label: '📅 Agendamentos', icon: '📅' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  if (!user || navItems.length === 0) return null;

  return (
    <nav className="nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div style={{ fontSize: '24px' }}>{item.icon}</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            {item.label.split(' ')[1]}
          </div>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
