import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/global.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    userType: 'cliente'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await register(formData);
      
      // Redirecionar baseado no tipo de usuário
      switch (data.user.userType) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'ong':
          navigate('/ong/dashboard');
          break;
        case 'jovem':
          navigate('/jovem/dashboard');
          break;
        case 'cliente':
          navigate('/cliente/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient)', padding: '20px' }}>
      <div className="container" style={{ maxWidth: '400px', paddingTop: '40px' }}>
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '10px' }}>
              Criar Conta
            </h1>
            <p style={{ color: 'var(--gray)' }}>Cadastre-se no Impulso Jovem</p>
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
              <label className="input-label">Nome Completo</label>
              <input
                type="text"
                name="name"
                className="input"
                value={formData.name}
                onChange={handleChange}
                placeholder="Seu nome"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Telefone</label>
              <input
                type="tel"
                name="phone"
                className="input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Endereço</label>
              <input
                type="text"
                name="address"
                className="input"
                value={formData.address}
                onChange={handleChange}
                placeholder="Rua, número, bairro"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Senha</label>
              <input
                type="password"
                name="password"
                className="input"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength="6"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Tipo de Cadastro</label>
              <select
                name="userType"
                className="input"
                value={formData.userType}
                onChange={handleChange}
                required
              >
                <option value="cliente">Cliente</option>
                <option value="jovem">Jovem (Prestador)</option>
                <option value="ong">ONG</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '20px' }}
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: 'var(--gray)' }}>
              Já tem uma conta?{' '}
              <Link to="/login" style={{ color: 'var(--primary-blue)', fontWeight: '600' }}>
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
