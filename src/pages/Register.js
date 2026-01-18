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
    complement: '',
    cep: '',
    cnpj: '',
    country: 'Brasil',
    state: '',
    city: '',
    userType: 'cliente'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Estados brasileiros
  const estadosBrasileiros = [
    { uf: 'AC', nome: 'Acre' },
    { uf: 'AL', nome: 'Alagoas' },
    { uf: 'AP', nome: 'Amapá' },
    { uf: 'AM', nome: 'Amazonas' },
    { uf: 'BA', nome: 'Bahia' },
    { uf: 'CE', nome: 'Ceará' },
    { uf: 'DF', nome: 'Distrito Federal' },
    { uf: 'ES', nome: 'Espírito Santo' },
    { uf: 'GO', nome: 'Goiás' },
    { uf: 'MA', nome: 'Maranhão' },
    { uf: 'MT', nome: 'Mato Grosso' },
    { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MG', nome: 'Minas Gerais' },
    { uf: 'PA', nome: 'Pará' },
    { uf: 'PB', nome: 'Paraíba' },
    { uf: 'PR', nome: 'Paraná' },
    { uf: 'PE', nome: 'Pernambuco' },
    { uf: 'PI', nome: 'Piauí' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'RN', nome: 'Rio Grande do Norte' },
    { uf: 'RS', nome: 'Rio Grande do Sul' },
    { uf: 'RO', nome: 'Rondônia' },
    { uf: 'RR', nome: 'Roraima' },
    { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SP', nome: 'São Paulo' },
    { uf: 'SE', nome: 'Sergipe' },
    { uf: 'TO', nome: 'Tocantins' }
  ];

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

            {formData.userType === 'ong' && (
              <>
                <div className="input-group">
                  <label className="input-label">Complemento</label>
                  <input
                    type="text"
                    name="complement"
                    className="input"
                    value={formData.complement}
                    onChange={handleChange}
                    placeholder="Apartamento, sala, bloco (opcional)"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">CEP</label>
                    <input
                      type="text"
                      name="cep"
                      className="input"
                      value={formData.cep}
                      onChange={handleChange}
                      placeholder="00000-000"
                      maxLength="9"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">CNPJ</label>
                    <input
                      type="text"
                      name="cnpj"
                      className="input"
                      value={formData.cnpj}
                      onChange={handleChange}
                      placeholder="00.000.000/0000-00"
                      required={formData.userType === 'ong'}
                      maxLength="18"
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Estado</label>
                <select
                  name="state"
                  className="input"
                  value={formData.state}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione</option>
                  {estadosBrasileiros.map(estado => (
                    <option key={estado.uf} value={estado.uf}>
                      {estado.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Cidade</label>
                <input
                  type="text"
                  name="city"
                  className="input"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Nome da cidade"
                  required
                />
              </div>
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
                <option value="cliente">👤 Cliente - Solicitar Serviços</option>
                <option value="ong">🏢 ONG - Gerenciar Jovens e Serviços</option>
              </select>
              <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
                💡 Jovens são cadastrados pelas ONGs após o registro
              </div>
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
