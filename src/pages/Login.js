import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../styles/global.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login({ email, password });
      
      // Redirecionar baseado no tipo de usuário
      switch (data.user.userType) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'ong':
          navigate('/ong/dashboard');
          break;
        case 'jovem':
          navigate('/jovem/servicos');
          break;
        case 'cliente':
          navigate('/cliente/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMessage(response.data.message);
      setForgotEmail('');
      
      // Fechar modal após 3 segundos
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotMessage('');
      }, 5000);
    } catch (err) {
      setForgotMessage(err.response?.data?.error || 'Erro ao processar recuperação de senha');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient)', padding: '20px' }}>
      <div className="container" style={{ maxWidth: '400px', paddingTop: '60px' }}>
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '10px' }}>
              Impulso Jovem
            </h1>
            <p style={{ color: 'var(--gray)' }}>Faça login para continuar</p>
          </div>

          {error && (
            <div style={{
              background: '#FFEBEE',
              color: '#C62828',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Senha</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div style={{ textAlign: 'right', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-blue)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '20px' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: 'var(--gray)' }}>
              Não tem uma conta?{' '}
              <Link to="/register" style={{ color: 'var(--primary-blue)', fontWeight: '600' }}>
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: 0 }}>
                🔑 Recuperar Senha
              </h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotMessage('');
                  setForgotEmail('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--gray)'
                }}
              >
                ×
              </button>
            </div>

            {forgotMessage && (
              <div style={{
                background: forgotMessage.includes('Erro') ? '#FFEBEE' : '#E8F5E9',
                color: forgotMessage.includes('Erro') ? '#C62828' : '#2E7D32',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {forgotMessage}
              </div>
            )}

            <p style={{ color: 'var(--gray)', marginBottom: '20px', fontSize: '14px' }}>
              Digite seu email cadastrado e enviaremos sua senha por email.
            </p>

            <form onSubmit={handleForgotPassword}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotMessage('');
                    setForgotEmail('');
                  }}
                  className="btn"
                  style={{ flex: 1, background: 'var(--gray-light)', color: 'var(--text-primary)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={forgotLoading}
                  style={{ flex: 1 }}
                >
                  {forgotLoading ? 'Enviando...' : 'Recuperar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
