import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, serviceService } from '../../services';
import api from '../../services/api';

const ClienteDashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedServices: 0,
    pendingReviews: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    state: '',
    city: ''
  });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadData();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.get(`/auth/user/${user.id}`);
      const userData = response.data;
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        state: userData.state || '',
        city: userData.city || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleOpenEditModal = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.put(`/auth/user/${user.id}`, profileData);
      
      // Atualizar contexto do usuário
      setUser({ ...user, ...profileData });
      
      alert('Perfil atualizado com sucesso!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const loadData = async () => {
    try {
      const bookingsResponse = await bookingService.getAll({ clientId: user.id });
      const bookings = bookingsResponse.data;
      
      setStats({
        activeBookings: bookings.filter(b => b.status === 'in_progress').length,
        completedServices: bookings.filter(b => b.status === 'completed').length,
        pendingReviews: bookings.filter(b => b.status === 'completed' && !b.reviewed).length
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header title="Dashboard Cliente" />
      
      <div className="container">
        {/* Perfil do Cliente */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>👤 Meu Perfil</CardHeader>
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                {profileData.name}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '4px' }}>
                📧 {profileData.email}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '4px' }}>
                📞 {profileData.phone}
              </div>
              {profileData.city && profileData.state && (
                <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '4px' }}>
                  📍 {profileData.city}, {profileData.state}
                </div>
              )}
              {profileData.address && (
                <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                  🏠 {profileData.address}
                </div>
              )}
            </div>
            <button 
              className="btn btn-secondary btn-full"
              onClick={handleOpenEditModal}
            >
              ✏️ Editar Perfil
            </button>
          </div>
        </Card>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px',
          marginTop: '20px'
        }}>
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-blue)' }}>
              {stats.activeBookings}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              Ativos
            </div>
          </Card>

          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-green)' }}>
              {stats.completedServices}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              Concluídos
            </div>
          </Card>

          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#FFA726' }}>
              {stats.pendingReviews}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              Avaliar
            </div>
          </Card>
        </div>

        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📅 Agendamentos Recentes</CardHeader>
          {recentBookings.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhum agendamento ainda
            </p>
          ) : (
            <div>
              {recentBookings.map((booking) => (
                <div 
                  key={booking.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--light-gray)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {booking.serviceName || 'Serviço'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                      {new Date(booking.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span className={`badge ${getStatusBadge(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ marginTop: '20px' }}>
          <CardHeader>🚀 Ações Rápidas</CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn btn-primary btn-full"
              onClick={() => navigate('/cliente/servicos')}
            >
              🔍 Buscar Serviços
            </button>
            <button 
              className="btn btn-secondary btn-full"
              onClick={() => navigate('/cliente/agendamentos')}
            >
              📋 Ver Todos os Agendamentos
            </button>
          </div>
        </Card>
      </div>

      {/* Modal de Edição de Perfil */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}>
            <CardHeader>✏️ Editar Perfil</CardHeader>
            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  className="input"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                  placeholder="Seu nome completo"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Email *
                </label>
                <input
                  type="email"
                  className="input"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                  placeholder="seu@email.com"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Telefone *
                </label>
                <input
                  type="tel"
                  className="input"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  required
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Endereço
                </label>
                <textarea
                  className="input"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  rows="2"
                  placeholder="Rua, número, bairro"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Estado *
                  </label>
                  <select
                    className="input"
                    value={profileData.state}
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    required
                    style={{ padding: '10px' }}
                  >
                    <option value="">Selecione</option>
                    {estadosBrasileiros.map(estado => (
                      <option key={estado.uf} value={estado.uf}>
                        {estado.nome} ({estado.uf})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Cidade *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    required
                    placeholder="Nome da cidade"
                  />
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '16px' }}>
                ℹ️ Você poderá solicitar serviços de jovens da sua cidade/estado
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  {saving ? '💾 Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ClienteDashboard;
