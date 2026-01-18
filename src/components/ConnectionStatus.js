import React, { useState, useEffect } from 'react';
import { getConnectionStatus } from '../services/api';

const ConnectionStatus = () => {
  const [status, setStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Atualiza status a cada 5 segundos
    const updateStatus = () => {
      const connectionStatus = getConnectionStatus();
      setStatus(connectionStatus);
      
      // Mostra apenas em desenvolvimento
      setIsVisible(!connectionStatus.isProduction);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !status) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '70px',
      right: '20px',
      backgroundColor: status.isLocal ? '#4CAF50' : '#FF9800',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: 'white',
        animation: 'pulse 2s infinite'
      }}></span>
      {status.isLocal ? '🖥️ Backend Local' : '☁️ Backend Nuvem'}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatus;
