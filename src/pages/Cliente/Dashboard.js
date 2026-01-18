import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, serviceService } from '../../services';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';

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

  // PIN Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedBookingForPin, setSelectedBookingForPin] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [validatingPin, setValidatingPin] = useState(false);

  // Cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Reagendamento
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Finalização
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [selectedBookingForFinalize, setSelectedBookingForFinalize] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [photos, setPhotos] = useState([]);
  const [finalizing, setFinalizing] = useState(false);

  // Feedback
  const [feedbackModal, setFeedbackModal] = useState({ show: false, type: '', message: '' });

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
    
    // Atualizar dados a cada 10 segundos para mostrar mudanças de status em tempo real
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    
    // Limpar intervalo ao desmontar o componente
    return () => clearInterval(interval);
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

  const handleOpenPinModal = (booking) => {
    setSelectedBookingForPin(booking);
    setShowPinModal(true);
    setPinInput('');
  };

  const handleValidatePin = async () => {
    if (pinInput.length !== 4) {
      setFeedbackModal({ show: true, type: 'warning', message: 'Digite um PIN de 4 dígitos' });
      return;
    }

    try {
      setValidatingPin(true);
      await bookingService.validateCheckInPin(selectedBookingForPin.id, user.id, pinInput);
      setShowPinModal(false);
      setPinInput('');
      setSelectedBookingForPin(null);
      setFeedbackModal({ show: true, type: 'success', message: 'Check-in confirmado! O serviço foi iniciado.' });
      loadData();
    } catch (error) {
      setFeedbackModal({ show: true, type: 'error', message: error.response?.data?.error || 'PIN incorreto. Tente novamente.' });
    } finally {
      setValidatingPin(false);
    }
  };

  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking);
    setShowCancelModal(true);
    setCancelReason('');
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setFeedbackModal({ show: true, type: 'warning', message: 'Por favor, informe o motivo do cancelamento' });
      return;
    }

    try {
      setCancelling(true);
      await bookingService.cancelByClient(selectedBookingForCancel.id, user.id, cancelReason);
      setShowCancelModal(false);
      setSelectedBookingForCancel(null);
      setCancelReason('');
      setFeedbackModal({ show: true, type: 'success', message: 'Agendamento cancelado com sucesso!' });
      loadData();
    } catch (error) {
      setFeedbackModal({ show: true, type: 'error', message: error.response?.data?.error || 'Erro ao cancelar agendamento' });
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenRescheduleModal = (booking) => {
    setSelectedBookingForReschedule(booking);
    setShowRescheduleModal(true);
    setNewDate('');
    setNewTime(booking.time || '');
  };

  const handleRescheduleBooking = async () => {
    if (!newDate) {
      setFeedbackModal({ show: true, type: 'warning', message: 'Por favor, selecione uma nova data' });
      return;
    }

    try {
      setRescheduling(true);
      await bookingService.reschedule(selectedBookingForReschedule.id, user.id, newDate, newTime);
      setShowRescheduleModal(false);
      setSelectedBookingForReschedule(null);
      setNewDate('');
      setNewTime('');
      setFeedbackModal({ show: true, type: 'success', message: 'Agendamento reagendado! Aguardando confirmação do jovem.' });
      loadData();
    } catch (error) {
      setFeedbackModal({ show: true, type: 'error', message: error.response?.data?.error || 'Erro ao reagendar' });
    } finally {
      setRescheduling(false);
    }
  };

  const handleOpenFinalizeModal = (booking) => {
    setSelectedBookingForFinalize(booking);
    setShowFinalizeModal(true);
    setRating(5);
    setReview('');
    setPhotos([]);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });
      
      const response = await api.post('/upload/service-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const uploadedPhotos = response.data.photos.map(p => p.url);
      setPhotos(prevPhotos => [...prevPhotos, ...uploadedPhotos]);
    } catch (error) {
      console.error('Erro ao fazer upload de fotos:', error);
      setFeedbackModal({ show: true, type: 'error', message: 'Erro ao enviar fotos. Tente novamente.' });
    }
  };

  const handleFinalizeService = async () => {
    if (rating < 1 || rating > 5) {
      setFeedbackModal({ show: true, type: 'warning', message: 'Por favor, selecione uma avaliação de 1 a 5 estrelas' });
      return;
    }

    try {
      setFinalizing(true);
      
      const servicePrice = selectedBookingForFinalize.finalPrice || 
                          selectedBookingForFinalize.price || 
                          50;

      await bookingService.completeService(
        selectedBookingForFinalize.id,
        user.id,
        rating,
        review,
        photos,
        servicePrice
      );

      setShowFinalizeModal(false);
      setSelectedBookingForFinalize(null);
      setFeedbackModal({ show: true, type: 'success', message: 'Serviço finalizado com sucesso! Obrigado pela avaliação.' });
      loadData();
    } catch (error) {
      setFeedbackModal({ show: true, type: 'error', message: error.response?.data?.error || 'Erro ao finalizar serviço' });
    } finally {
      setFinalizing(false);
    }
  };

  const loadData = async () => {
    try {
      const bookingsResponse = await bookingService.getAll({ clientId: user.id });
      const bookings = bookingsResponse.data;
      
      // Filtrar SOMENTE agendamentos com jovem atribuído (não mostrar pending sem jovem)
      const activeBookings = bookings.filter(b => 
        ['assigned', 'confirmed', 'in_progress'].includes(b.status) && b.jovemId
      );
      
      setStats({
        activeBookings: bookings.filter(b => ['assigned', 'confirmed', 'in_progress'].includes(b.status)).length,
        completedServices: bookings.filter(b => b.status === 'completed').length,
        pendingReviews: bookings.filter(b => b.status === 'completed' && !b.reviewed).length
      });

      // Mostrar apenas agendamentos ativos no dashboard
      setRecentBookings(activeBookings);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      assigned: 'badge-warning',
      confirmed: 'badge-success',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendente',
      assigned: 'Atribuído',
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

        {/* Agendamentos Ativos - Prioridade */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📅 Meus Agendamentos</CardHeader>
          {recentBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ color: 'var(--gray)', marginBottom: '16px' }}>
                Você não tem serviços ativos no momento
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/cliente/servicos')}
              >
                🔍 Buscar Serviços
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentBookings.map(booking => (
                <Card key={booking.id} style={{ backgroundColor: '#f8f9fa', border: '2px solid #e0e0e0' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                          {booking.serviceName}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '8px' }}>
                          📅 {new Date(booking.date).toLocaleDateString('pt-BR')} {booking.time && `às ${booking.time}`}
                        </div>
                      </div>
                      <span className={`badge ${getStatusBadge(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>

                    {booking.jovemName && (
                      <div style={{ 
                        background: 'white', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        border: '1px solid #e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        {booking.jovemPhoto ? (
                          <img 
                            src={getImageUrl(booking.jovemPhoto)}
                            alt={booking.jovemName}
                            style={{ 
                              width: '50px', 
                              height: '50px', 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              border: '2px solid var(--primary-blue)'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '50%', 
                            background: 'var(--gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '20px'
                          }}>
                            {booking.jovemName?.charAt(0)?.toUpperCase() || '👤'}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>
                            Jovem
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '600' }}>
                            {booking.jovemName}
                          </div>
                          {booking.jovemStats && (
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                              ⭐ {booking.jovemStats.rating?.toFixed(1) || '0.0'} • 
                              {' '}{booking.jovemStats.completedServices || 0} serviços
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botões de ação baseados no status */}
                    {booking.status === 'confirmed' && (
                      <>
                        <div style={{ 
                          background: '#E3F2FD', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          marginBottom: '12px',
                          border: '2px solid #2196F3'
                        }}>
                          <div style={{ fontSize: '14px', color: '#1565C0', marginBottom: '12px', fontWeight: '600' }}>
                            🔑 Quando o jovem chegar, peça o PIN e confirme aqui
                          </div>
                          <div style={{ fontSize: '13px', color: '#1565C0', marginBottom: '12px' }}>
                            💡 O jovem pode chegar antes ou no horário agendado. Basta digitar o PIN que ele informar.
                          </div>
                          <button 
                            className="btn btn-primary"
                            style={{ width: '100%', marginBottom: '8px' }}
                            onClick={() => handleOpenPinModal(booking)}
                          >
                            ✓ Validar PIN do Jovem
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn"
                            style={{ flex: 1, background: '#FFA726', color: 'white', border: 'none', fontSize: '14px', padding: '8px' }}
                            onClick={() => handleOpenRescheduleModal(booking)}
                          >
                            📅 Reagendar
                          </button>
                          <button 
                            className="btn"
                            style={{ flex: 1, background: '#f44336', color: 'white', border: 'none', fontSize: '14px', padding: '8px' }}
                            onClick={() => handleOpenCancelModal(booking)}
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      </>
                    )}
                    
                    {booking.status === 'assigned' && (
                      <>
                        <div style={{ 
                          background: '#FFF3E0', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          marginBottom: '12px',
                          border: '2px solid #FF9800'
                        }}>
                          <div style={{ fontSize: '14px', color: '#E65100', marginBottom: '8px', fontWeight: '600' }}>
                            ⏳ Aguardando confirmação do jovem
                          </div>
                          {booking.rescheduledAt && (
                            <div style={{ fontSize: '13px', color: '#E65100', marginTop: '8px' }}>
                              🔄 Reagendado. Aguardando nova confirmação do jovem.
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn"
                            style={{ flex: 1, background: '#FFA726', color: 'white', border: 'none', fontSize: '14px', padding: '8px' }}
                            onClick={() => handleOpenRescheduleModal(booking)}
                          >
                            📅 Reagendar
                          </button>
                          <button 
                            className="btn"
                            style={{ flex: 1, background: '#f44336', color: 'white', border: 'none', fontSize: '14px', padding: '8px' }}
                            onClick={() => handleOpenCancelModal(booking)}
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      </>
                    )}
                    
                    {booking.status === 'in_progress' && (
                      <div style={{ 
                        background: '#FFF3E0', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        border: '2px solid #FF9800'
                      }}>
                        <div style={{ fontSize: '14px', color: '#E65100', marginBottom: '12px', fontWeight: '600' }}>
                          🔄 Serviço em andamento. Finalize quando concluído.
                        </div>
                        <button 
                          className="btn"
                          style={{ width: '100%', background: '#4CAF50', color: 'white', border: 'none' }}
                          onClick={() => handleOpenFinalizeModal(booking)}
                        >
                          ✅ Finalizar e Avaliar Serviço
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Estatísticas */}
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
          <CardHeader>� Ações Rápidas</CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
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

      {/* Modal de PIN */}
      {showPinModal && selectedBookingForPin && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '400px', width: '100%' }}>
            <CardHeader>🔑 Validar PIN do Jovem</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--gray)' }}>
                Peça ao jovem <strong>{selectedBookingForPin.jovemName}</strong> para informar o PIN de 4 dígitos.
              </div>
              <input
                type="text"
                className="input"
                placeholder="Digite o PIN"
                value={pinInput}
                maxLength={4}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setPinInput(value);
                }}
                style={{
                  fontSize: '16px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: '700'
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                }}
                disabled={validatingPin}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleValidatePin}
                disabled={validatingPin || pinInput.length !== 4}
              >
                {validatingPin ? '⏳ Validando...' : '✓ Confirmar'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {showCancelModal && selectedBookingForCancel && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <CardHeader>❌ Cancelar Agendamento</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--gray)' }}>
                Você está prestes a cancelar o serviço <strong>{selectedBookingForCancel.serviceName}</strong>
              </div>
              <label className="input-label">Motivo do cancelamento *</label>
              <textarea
                className="input"
                rows="4"
                placeholder="Por favor, explique o motivo do cancelamento"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={cancelling}
              >
                Voltar
              </button>
              <button 
                className="btn"
                style={{ flex: 1, background: '#f44336', color: 'white', border: 'none' }}
                onClick={handleCancelBooking}
                disabled={cancelling}
              >
                {cancelling ? '⏳ Cancelando...' : '❌ Confirmar Cancelamento'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Reagendamento */}
      {showRescheduleModal && selectedBookingForReschedule && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <CardHeader>📅 Reagendar Serviço</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--gray)' }}>
                Reagendando: <strong>{selectedBookingForReschedule.serviceName}</strong>
              </div>
              
              <div className="input-group">
                <label className="input-label">Nova Data *</label>
                <input
                  type="date"
                  className="input"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Horário (opcional)</label>
                <input
                  type="time"
                  className="input"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>

              <div style={{ 
                background: '#FFF3E0', 
                padding: '12px', 
                borderRadius: '8px',
                border: '1px solid #FFB74D',
                fontSize: '13px',
                color: '#E65100'
              }}>
                ℹ️ O jovem precisará confirmar a nova data. Você será notificado quando ele aceitar.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowRescheduleModal(false);
                  setNewDate('');
                  setNewTime('');
                }}
                disabled={rescheduling}
              >
                Cancelar
              </button>
              <button 
                className="btn"
                style={{ flex: 1, background: '#FFA726', color: 'white', border: 'none' }}
                onClick={handleRescheduleBooking}
                disabled={rescheduling}
              >
                {rescheduling ? '⏳ Reagendando...' : '📅 Confirmar Reagendamento'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Feedback */}
      {feedbackModal.show && (
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
          zIndex: 1001,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {feedbackModal.type === 'success' ? '✅' : feedbackModal.type === 'error' ? '❌' : '⚠️'}
              </div>
              <div style={{ fontSize: '16px', marginBottom: '20px' }}>
                {feedbackModal.message}
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setFeedbackModal({ show: false, type: '', message: '' })}
                style={{ width: '100%' }}
              >
                OK
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Finalização */}
      {showFinalizeModal && selectedBookingForFinalize && (
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
          zIndex: 1000,
          padding: '20px',
          paddingBottom: '100px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: '75vh', overflowY: 'auto' }}>
            <CardHeader>✅ Finalizar Serviço</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>
                {selectedBookingForFinalize.serviceName}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '20px' }}>
                Realizado por: {selectedBookingForFinalize.jovemName}
              </div>

              {/* Rating */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px' }}>
                  Como você avalia o serviço? *
                </label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      style={{
                        fontSize: '40px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.2)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--gray)' }}>
                  {rating === 5 && '🌟 Excelente!'}
                  {rating === 4 && '😊 Muito bom!'}
                  {rating === 3 && '👍 Bom'}
                  {rating === 2 && '😐 Regular'}
                  {rating === 1 && '😞 Insatisfeito'}
                </div>
              </div>

              {/* Comentário */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  Comentário (opcional)
                </label>
                <textarea
                  className="input"
                  rows="4"
                  placeholder="Conte como foi sua experiência com o serviço..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Upload de Fotos */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  Fotos do serviço (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  style={{ fontSize: '14px' }}
                />
                {photos.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {photos.map((photo, idx) => {
                      const imageUrl = getImageUrl(photo);
                      return (
                        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                          <img 
                            src={imageUrl} 
                            alt={`Foto ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                          />
                          <button
                            onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ 
                background: '#FFF3E0', 
                padding: '12px', 
                borderRadius: '8px',
                border: '1px solid #FFB74D'
              }}>
                <div style={{ fontSize: '13px', color: '#E65100' }}>
                  ℹ️ Ao finalizar, o valor do serviço será creditado ao jovem e sua avaliação será registrada.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowFinalizeModal(false);
                  setSelectedBookingForFinalize(null);
                }}
                disabled={finalizing}
              >
                Cancelar
              </button>
              <button 
                className="btn"
                style={{ flex: 1, background: '#4CAF50', color: 'white', border: 'none' }}
                onClick={handleFinalizeService}
                disabled={finalizing}
              >
                {finalizing ? '⏳ Finalizando...' : '✅ Finalizar Serviço'}
              </button>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ClienteDashboard;
