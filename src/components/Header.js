import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

const Header = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-title">{title || 'Impulso Jovem'}</div>
        {user && (
          <button 
            onClick={handleLogout} 
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Sair
          </button>
        )}
      </div>
      {user && (
        <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.9 }}>
          {user.name} • {user.userType.toUpperCase()}
        </div>
      )}
    </header>
  );
};

export default Header;
