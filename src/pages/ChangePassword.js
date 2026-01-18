import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services';

const ChangePassword = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(user.id, currentPassword, newPassword);
      
      // Atualizar user no localStorage removendo flag firstLogin
      const updatedUser = { ...user, firstLogin: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      alert('Senha alterada com sucesso! Faça login novamente.');
      logout();
      navigate('/login');
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--gradient)',
      padding: '20px'
    }}>
      <Card style={{ maxWidth: '500px', width: '100%' }}>
        <CardHeader>🔐 Alterar Senha</CardHeader>
        
        <div style={{ 
          background: '#fff3cd', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #ffeaa7'
        }}>
          <div style={{ fontSize: '14px', color: '#856404', marginBottom: '8px' }}>
            ⚠️ <strong>Primeiro Acesso</strong>
          </div>
          <div style={{ fontSize: '13px', color: '#856404' }}>
            Por segurança, você precisa alterar sua senha temporária antes de continuar usando o sistema.
          </div>
        </div>

        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Senha Temporária *</label>
            <input
              type="password"
              className="input"
              placeholder="Digite a senha temporária fornecida pela ONG"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="label">Nova Senha *</label>
            <input
              type="password"
              className="input"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="label">Confirmar Nova Senha *</label>
            <input
              type="password"
              className="input"
              placeholder="Digite a nova senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ 
              background: '#f8d7da', 
              color: '#721c24', 
              padding: '12px', 
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ 
            background: '#d4edda', 
            padding: '12px', 
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb'
          }}>
            <div style={{ fontSize: '13px', color: '#155724' }}>
              ✓ Mínimo 6 caracteres<br />
              ✓ Use uma senha que você conseguirá lembrar<br />
              ✓ Não compartilhe sua senha com ninguém
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Alterando...' : '🔐 Alterar Senha e Continuar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sair
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ChangePassword;
