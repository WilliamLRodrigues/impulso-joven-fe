import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services';
import api from '../../services/api';

const ClienteAgendamentosCompleto = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [hideCompleted, setHideCompleted] = useState(true); // Ocultar finalizados por padrão
  const [loading, setLoading] = useState(true);
  
  // PIN Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedBookingForPin, setSelectedBookingForPin] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [validatingPin, setValidatingPin] = useState(false);
  
  // Finalizar Modal
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [selectedBookingForFinalize, setSelectedBookingForFinalize] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [photos, setPhotos] = useState([]);
  const [finalizing, setFinalizing] = useState(false);
  
  // Modais de Feedback
  const [feedbackModal, setFeedbackModal] = useState({ show: false, type: '', message: '' });
  
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

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getAll({ clientId: user.id });
      setBookings(response.data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
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
      loadBookings();
    } catch (error) {
      setFeedbackModal({ show: true, type: 'error', message: error.response?.data?.error || 'PIN incorreto. Tente novamente.' });
    } finally {
      setValidatingPin(false);
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
      // Criar FormData para upload
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });
      
      // Fazer upload das fotos
      const response = await api.post('/upload/service-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Adicionar URLs das fotos retornadas
      const uploadedPhotos = response.data.photos.map(p => p.url);
      setPhotos([...photos, ...uploadedPhotos]);
    } catch (error) {
      console.error('Erro ao fazer upload de fotos:', error);
      alert('Erro ao enviar fotos. Tente novamente.');
    }
  };

  const handleFinalizeService = async () => {
    if (rating < 1 || rating > 5) {
      setFeedbackModal({ show: true, type: 'warning', message: 'Por favor, selecione uma avaliação de 1 a 5 estrelas' });
      return;
    }

    try {
      setFinalizing(true);
      
      // Buscar preço do serviço
      const servicePrice = selectedBookingForFinalize.finalPrice || 
                          selectedBookingForFinalize.price || 
                          50; // Valor padrão

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
      loadBookings();
    } catch (error) {
      setFeedbackModal({ show: true, type: 'error', message: error.response?.data?.error || 'Erro ao finalizar serviço' });
    } finally {
      setFinalizing(false);
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

    console.log('Cancelando booking:', {
      bookingId: selectedBookingForCancel.id,
      clientId: user.id,
      reason: cancelReason
    });

    try {
      setCancelling(true);
      const response = await bookingService.cancelByClient(selectedBookingForCancel.id, user.id, cancelReason);
      console.log('Resposta do cancelamento:', response);
      setShowCancelModal(false);
      setSelectedBookingForCancel(null);
      setCancelReason('');
      setFeedbackModal({ show: true, type: 'success', message: 'Agendamento cancelado com sucesso!' });
      loadBookings();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
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
      await bookingService.rescheduleByClient(selectedBookingForReschedule.id, user.id, newDate, newTime);
      setShowRescheduleModal(false);
      setSelectedBookingForReschedule(null);
      setNewDate('');
      setNewTime('');
      setFeedbackModal({ show: true, type: 'success', message: 'Agendamento reagendado! O jovem precisa aceitar a nova data.' });
      loadBookings();
    } catch (error) {
      setFeedbackModal({ show: true, type: 'error', message: error.response?.data?.error || 'Erro ao reagendar' });
    } finally {
      setRescheduling(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Aplicar filtro de ocultar finalizados
    if (hideCompleted && (booking.status === 'completed' || booking.status === 'cancelled')) {
      return false;
    }
    
    // Aplicar filtro de status
    if (filter === 'all') return true;
    if (filter === 'confirmed') return booking.status === 'confirmed';
    if (filter === 'in_progress') return booking.status === 'in_progress';
    if (filter === 'completed') return booking.status === 'completed';
    if (filter === 'cancelled') return booking.status === 'cancelled';
    return true;
  }).sort((a, b) => {
    // Ordenar por data de criação (mais recente primeiro)
    const dateA = new Date(a.createdAt || a.date);
    const dateB = new Date(b.createdAt || b.date);
    return dateB - dateA;
  });

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const inProgressBookings = bookings.filter(b => b.status === 'in_progress');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Data não definida';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { text: 'Pendente', class: 'badge-warning', emoji: '⏳' },
      'confirmed': { text: 'Confirmado', class: 'badge-success', emoji: '✓' },
      'in_progress': { text: 'Em Andamento', class: 'badge-info', emoji: '🔄' },
      'completed': { text: 'Concluído', class: 'badge-primary', emoji: '✅' },
      'cancelled': { text: 'Cancelado', class: 'badge-danger', emoji: '❌' }
    };
    const badge = badges[status] || { text: status, class: 'badge-secondary', emoji: '📋' };
    return (
      <span className={`badge ${badge.class}`}>
        {badge.emoji} {badge.text}
      </span>
    );
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
      <Header title="Meus Agendamentos" />
      
      <div className="container">
        {/* Resumo */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
              {bookings.length}
            </div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>
              Agendamentos Totais
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px' }}>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#4CAF50' }}>
              {confirmedBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
              Confirmados
            </div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#2196F3' }}>
              {inProgressBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
              Em Andamento
            </div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
              {completedBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
              Concluídos
            </div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#f44336' }}>
              {cancelledBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
              Cancelados
            </div>
          </Card>
        </div>

        {/* Checkbox para ocultar finalizados */}
        <div style={{ 
          marginTop: '20px',
          padding: '16px',
          background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
          borderRadius: '12px',
          border: '2px solid #2196F3',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.15)'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            color: '#1565C0'
          }}>
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              style={{ 
                marginRight: '12px',
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                accentColor: '#2196F3'
              }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>👁️</span>
              <span>Ocultar agendamentos finalizados (concluídos e cancelados)</span>
            </span>
          </label>
        </div>

        {/* Filtros */}
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button 
              className={`btn ${filter === 'confirmed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
              onClick={() => setFilter('confirmed')}
            >
              Confirmados
            </button>
            <button 
              className={`btn ${filter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
              onClick={() => setFilter('in_progress')}
            >
              Em Andamento
            </button>
            <button 
              className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
              onClick={() => setFilter('completed')}
            >
              Concluídos
            </button>
            <button 
              className={`btn ${filter === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
              onClick={() => setFilter('cancelled')}
            >
              Cancelados
            </button>
          </div>
        </Card>

        {/* Lista de Agendamentos */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📅 Meus Agendamentos</CardHeader>
          {filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ color: 'var(--gray)' }}>
                {hideCompleted && bookings.length > 0 
                  ? 'Todos os agendamentos estão finalizados. Desmarque o filtro para visualizá-los.'
                  : 'Nenhum agendamento encontrado'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredBookings.map(booking => (
                <Card key={booking.id} style={{ backgroundColor: '#f8f9fa', border: '2px solid #e0e0e0' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                          {booking.serviceName}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '8px' }}>
                          📅 {formatDate(booking.date)} {booking.time && `às ${booking.time}`}
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {booking.jovemName && (
                      <div style={{ 
                        background: 'white', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                          👤 <strong>Jovem:</strong> {booking.jovemName}
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
                        
                        {/* Botões de Cancelar/Reagendar */}
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
                        
                        {/* Botões de Cancelar/Reagendar */}
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

                    {booking.status === 'completed' && booking.rating && (
                      <div style={{ 
                        background: '#E8F5E9', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '2px solid #4CAF50'
                      }}>
                        <div style={{ fontSize: '13px', color: '#2E7D32' }}>
                          ⭐ Sua avaliação: {booking.rating}/5
                        </div>
                        {booking.clientReview && (
                          <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '4px', fontStyle: 'italic' }}>
                            "{booking.clientReview}"
                          </div>
                        )}
                      </div>
                    )}

                    {booking.status === 'cancelled' && (
                      <div style={{ 
                        background: '#ffebee', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '2px solid #f44336'
                      }}>
                        <div style={{ fontSize: '14px', color: '#c62828', marginBottom: '8px', fontWeight: '600' }}>
                          ❌ Serviço Cancelado
                        </div>
                        {booking.cancellationReason && (
                          <div style={{ fontSize: '13px', color: '#c62828' }}>
                            <strong>Motivo:</strong> {booking.cancellationReason}
                          </div>
                        )}
                        {booking.cancelledAt && (
                          <div style={{ fontSize: '12px', color: '#c62828', marginTop: '4px' }}>
                            Cancelado em: {new Date(booking.cancelledAt).toLocaleString('pt-BR')}
                          </div>
                        )}
                        {booking.cancelledBy && (
                          <div style={{ fontSize: '12px', color: '#c62828', marginTop: '4px' }}>
                            Cancelado por: {booking.cancelledBy === 'client' ? 'Você' : 'Jovem'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Validação de PIN */}
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
          padding: '20px',
          paddingBottom: '100px'
        }}>
          <Card style={{ maxWidth: '400px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <CardHeader>🔑 Validar Check-in</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', fontSize: '18px', marginBottom: '12px' }}>
                {selectedBookingForPin.serviceName}
              </div>
              
              <div style={{ 
                background: '#E3F2FD', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #90CAF9'
              }}>
                <div style={{ fontSize: '14px', color: '#1565C0', lineHeight: '1.6' }}>
                  ℹ️ Peça ao jovem <strong>{selectedBookingForPin.jovemName}</strong> para informar o PIN de 4 dígitos.
                  <br/><br/>
                  💡 <strong>Importante:</strong> O jovem pode chegar antes ou no horário agendado. Validar o PIN confirma que é realmente ele e inicia o serviço.
                </div>
              </div>

              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Digite o PIN de 4 dígitos:
              </label>
              <input
                type="number"
                className="input"
                placeholder="0000"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.slice(0, 4))}
                maxLength="4"
                style={{ 
                  fontSize: '32px', 
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
                    {photos.map((photo, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                        <img 
                          src={photo} 
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
                    ))}
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
          padding: '20px',
          paddingBottom: '100px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCancelModal(false);
            setCancelReason('');
          }
        }}
        >
          <Card style={{ maxWidth: '400px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <CardHeader>❌ Cancelar Agendamento</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '12px' }}>
                {selectedBookingForCancel.serviceName}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '16px' }}>
                📅 {formatDate(selectedBookingForCancel.date)} {selectedBookingForCancel.time && `às ${selectedBookingForCancel.time}`}
              </div>
              
              <div style={{ 
                background: '#fff3cd', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #ffeaa7'
              }}>
                <div style={{ fontSize: '13px', color: '#856404' }}>
                  ⚠️ O jovem será notificado sobre o cancelamento. Por favor, informe o motivo.
                </div>
              </div>

              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Motivo do Cancelamento *
              </label>
              <textarea
                className="input"
                rows="4"
                placeholder="Ex: Surgiu um imprevisto, não preciso mais do serviço, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1, position: 'relative', zIndex: 1 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                Voltar
              </button>
              <button 
                className="btn"
                style={{ 
                  flex: 1,
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  position: 'relative',
                  zIndex: 1,
                  opacity: cancelling ? 0.6 : 1
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!cancelReason.trim()) {
                    setFeedbackModal({ 
                      show: true, 
                      type: 'warning', 
                      message: 'Por favor, informe o motivo do cancelamento antes de confirmar.' 
                    });
                    return;
                  }
                  if (!cancelling) {
                    handleCancelBooking();
                  }
                }}
              >
                {cancelling ? '⏳ Cancelando...' : 'Confirmar Cancelamento'}
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
          padding: '20px',
          paddingBottom: '100px'
        }}>
          <Card style={{ maxWidth: '400px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <CardHeader>📅 Reagendar Serviço</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '12px' }}>
                {selectedBookingForReschedule.serviceName}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '16px' }}>
                📅 Data atual: {formatDate(selectedBookingForReschedule.date)} {selectedBookingForReschedule.time && `às ${selectedBookingForReschedule.time}`}
              </div>
              
              <div style={{ 
                background: '#E3F2FD', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #90CAF9'
              }}>
                <div style={{ fontSize: '13px', color: '#1565C0' }}>
                  ℹ️ Ao reagendar, o jovem precisará confirmar a nova data. Aguarde a confirmação dele.
                </div>
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
                <label className="input-label">Novo Horário (opcional)</label>
                <input
                  type="time"
                  className="input"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
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
                style={{ 
                  flex: 1,
                  background: '#FFA726',
                  color: 'white',
                  border: 'none'
                }}
                onClick={handleRescheduleBooking}
                disabled={!newDate || rescheduling}
              >
                {rescheduling ? '⏳ Reagendando...' : '📅 Reagendar'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Feedback */}
      {feedbackModal.show && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
            paddingBottom: '100px',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => setFeedbackModal({ show: false, type: '', message: '' })}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ícone */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              background: feedbackModal.type === 'success' ? 'linear-gradient(135deg, #4CAF50, #45a049)' :
                         feedbackModal.type === 'error' ? 'linear-gradient(135deg, #f44336, #e53935)' :
                         'linear-gradient(135deg, #FFA726, #FB8C00)',
              animation: 'scaleIn 0.5s ease-out'
            }}>
              {feedbackModal.type === 'success' ? '✓' : feedbackModal.type === 'error' ? '✕' : '⚠'}
            </div>

            {/* Título */}
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: feedbackModal.type === 'success' ? '#4CAF50' :
                     feedbackModal.type === 'error' ? '#f44336' :
                     '#FFA726'
            }}>
              {feedbackModal.type === 'success' ? 'Sucesso!' :
               feedbackModal.type === 'error' ? 'Erro' :
               'Atenção'}
            </h3>

            {/* Mensagem */}
            <p style={{
              fontSize: '16px',
              color: '#666',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              {feedbackModal.message}
            </p>

            {/* Botão OK */}
            <button
              className="btn"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                background: feedbackModal.type === 'success' ? 'linear-gradient(135deg, #4CAF50, #45a049)' :
                           feedbackModal.type === 'error' ? 'linear-gradient(135deg, #f44336, #e53935)' :
                           'linear-gradient(135deg, #FFA726, #FB8C00)',
                color: 'white',
                border: 'none'
              }}
              onClick={() => setFeedbackModal({ show: false, type: '', message: '' })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ClienteAgendamentosCompleto;
