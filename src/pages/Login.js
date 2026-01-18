import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/global.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    </div>
  );
};

export default Login;
