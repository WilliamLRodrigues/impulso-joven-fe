import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, jovemService } from '../../services';
import { getImageUrl, downloadImage } from '../../utils/imageUtils';
import { resolveTrainingModuleKey } from '../../modules/treinamento';
import TrainingModal from '../../components/TrainingModal';

const getGoogleMapsUrl = (destination, origin) => {
  if (!destination) {
    return 'https://www.google.com/maps';
  }

  const params = new URLSearchParams({
    api: '1',
    destination: destination.trim(),
  });

  if (origin) {
    params.set('origin', origin.trim());
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const getSimpleMapUrl = (address) => {
  if (!address) {
    return '';
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
};

const JovemServicos = () => {
  const { user } = useAuth();
  const [pendingBookings, setPendingBookings] = useState([]);
  const [acceptedBookings, setAcceptedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  
  // Modal de Feedback
  const [feedbackModal, setFeedbackModal] = useState({ show: false, type: '', message: '' });

  // Treinamentos obrigatórios
  const [trainingCompletion, setTrainingCompletion] = useState({});
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingModuleKey, setTrainingModuleKey] = useState(null);

  const loadPendingBookings = useCallback(async (silent = false) => {
    try {
      if (!user?.id) {
        return;
      }
      if (!silent) setLoading(true);
      const response = await bookingService.getPendingForJovem(user.id);
      setPendingBookings(response.data);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  const loadAcceptedBookings = useCallback(async (silent = false) => {
    try {
      if (!user?.id) {
        return;
      }
      const response = await bookingService.getAll({ jovemId: user.id });
      const accepted = response.data.filter(
        (b) => b.status === 'confirmed' || b.status === 'in_progress' || b.status === 'checked_in'
      );
      setAcceptedBookings(accepted);
    } catch (error) {
      console.error('Erro ao carregar serviços aceitos:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPendingBookings();
    loadAcceptedBookings();

    const interval = setInterval(() => {
      loadPendingBookings(true);
      loadAcceptedBookings(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadPendingBookings, loadAcceptedBookings]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadTrainingProgress = async () => {
      try {
        const jovemResponse = await jovemService.getById(user.id);
        const backendProgress = jovemResponse.data?.trainingCompletion;
        if (backendProgress && typeof backendProgress === 'object') {
          setTrainingCompletion(backendProgress);
        } else {
          setTrainingCompletion({});
        }
      } catch (error) {
        console.error('Erro ao carregar progresso do servidor:', error);
      }
    };

    loadTrainingProgress();
  }, [user?.id]);

  const handleOpenTrainingModal = (moduleKey) => {
    if (!moduleKey) return;
    setTrainingModuleKey(moduleKey);
    setShowTrainingModal(true);
    setShowModal(false);
  };

  const handleCloseTrainingModal = () => {
    setShowTrainingModal(false);
    setTrainingModuleKey(null);
    if (selectedBooking) {
      setShowModal(true);
    }
  };

  const getModuleKeyForBooking = (booking) => {
    if (!booking) return null;
    return resolveTrainingModuleKey(booking.serviceName || '', booking.serviceCategory || '');
  };

  const handleAttemptAcceptService = () => {
    if (!selectedBooking) return;
    const moduleKey = getModuleKeyForBooking(selectedBooking);
    if (moduleKey && !trainingCompletion?.[moduleKey]) {
      handleOpenTrainingModal(moduleKey);
      return;
    }
    handleConfirmServiceAcceptance();
  };

  const handleTrainingComplete = (completedModuleKey) => {
    const moduleKeyToMark = completedModuleKey || trainingModuleKey;
    if (!moduleKeyToMark) {
      return;
    }

    setTrainingCompletion((prev) => {
      if (prev?.[moduleKeyToMark]) {
        return prev;
      }
      const nextState = { ...prev, [moduleKeyToMark]: true };
      jovemService.update(user.id, { trainingCompletion: nextState }).catch((error) => {
        console.error('Erro ao salvar progresso de treinamento:', error);
      });
      return nextState;
    });

    setShowTrainingModal(false);
    setTrainingModuleKey(null);

    if (selectedBooking) {
      handleConfirmServiceAcceptance();
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleViewAcceptedDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleConfirmServiceAcceptance = async () => {
    if (!selectedBooking) return;
    
    try {
      const response = await bookingService.acceptByJovem(selectedBooking.id, user.id);
      const booking = response.data;
      
      // Mostrar PIN em modal bonito
      if (booking.checkInPin) {
        setGeneratedPin(booking.checkInPin);
        setShowModal(false);
        setShowPinModal(true);
      }
      
      setSelectedBooking(null);
      loadPendingBookings();
      loadAcceptedBookings();
    } catch (error) {
      console.error('Erro ao aceitar serviço:', error);
      setFeedbackModal({ show: true, type: 'error', message: 'Erro ao aceitar serviço. Tente novamente.' });
    }
  };

  const handleShowRejectModal = () => {
    setShowModal(false);
    setShowRejectModal(true);
  };

  const handleRejectBooking = async () => {
    if (!selectedBooking) return;
    
    if (!rejectReason.trim()) {
      setFeedbackModal({ show: true, type: 'warning', message: 'Por favor, informe o motivo da recusa' });
      return;
    }

    try {
      await bookingService.rejectByJovem(selectedBooking.id, user.id, rejectReason);
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectReason('');
      setFeedbackModal({ show: true, type: 'success', message: 'Serviço recusado. O cliente foi notificado.' });
      loadPendingBookings();
      loadAcceptedBookings();
    } catch (error) {
      console.error('Erro ao rejeitar serviço:', error);
      setFeedbackModal({ show: true, type: 'error', message: 'Erro ao rejeitar serviço. Tente novamente.' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Data não definida';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { text: 'Pendente', class: 'badge-warning' },
      'assigned': { text: 'Atribuído a você', class: 'badge-info' },
      'confirmed': { text: 'Confirmado', class: 'badge-success' },
      'cancelled': { text: 'Cancelado', class: 'badge-danger' }
    };
    const badge = badges[status] || { text: status, class: 'badge-secondary' };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
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
      <Header title="Serviços Disponíveis" />
      
      <div className="container">
        {/* Resumo */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
              {pendingBookings.length}
            </div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>
              Solicitações Aguardando Sua Resposta
            </div>
          </div>
        </Card>

        {/* Info sobre Skills */}
        <Card style={{ marginTop: '20px', background: '#E3F2FD', border: '2px solid #1976D2' }}>
          <div style={{ fontSize: '14px', color: '#1565C0' }}>
            ℹ️ <strong>Como funciona:</strong> Você recebe solicitações de serviços que correspondem às suas habilidades. 
            Revise os detalhes e aceite os serviços que você pode realizar. Você pode recusar caso não possa atender.
          </div>
        </Card>

        {/* Lista de Serviços Disponíveis */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>💼 Solicitações de Serviço</CardHeader>
          {pendingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>😊</div>
              <p style={{ color: 'var(--gray)', marginBottom: '8px' }}>
                Nenhuma solicitação pendente no momento
              </p>
              <p style={{ fontSize: '13px', color: 'var(--gray)' }}>
                Novas solicitações aparecerão aqui quando clientes solicitarem serviços que correspondem às suas habilidades
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingBookings.map(booking => (
                <Card key={booking.id} style={{ backgroundColor: '#f8f9fa', border: '2px solid #e0e0e0' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                          {booking.serviceName}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '8px' }}>
                          📂 {booking.serviceCategory || 'Geral'}
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Informações do agendamento */}
                    {booking.date && (
                      <div style={{ 
                        background: 'white', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                          📅 <strong>Data:</strong> {formatDate(booking.date)}
                        </div>
                        {booking.time && (
                          <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                            🕐 <strong>Horário:</strong> {booking.time}
                          </div>
                        )}
                        {booking.duration && (
                          <div style={{ fontSize: '13px' }}>
                            ⏱️ <strong>Duração:</strong> {booking.duration} horas
                          </div>
                        )}
                        {booking.rescheduledAt && (
                          <div style={{ 
                            marginTop: '8px', 
                            padding: '8px', 
                            background: '#FFF3E0',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#E65100'
                          }}>
                            🔄 <strong>Reagendado pelo cliente</strong>
                            {booking.previousDate && (
                              <div style={{ marginTop: '4px' }}>
                                Data anterior: {formatDate(booking.previousDate)} {booking.previousTime && `às ${booking.previousTime}`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cliente info (se disponível) */}
                    {booking.clientName && (
                      <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px' }}>
                        👤 Cliente: {booking.clientName}
                      </div>
                    )}

                    {/* Data de criação */}
                    <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '12px' }}>
                      📝 Solicitado em: {new Date(booking.createdAt).toLocaleString('pt-BR')}
                    </div>

                    {/* Botões de ação */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '14px', padding: '12px', fontWeight: '600' }}
                        onClick={() => handleViewDetails(booking)}
                      >
                        📋 Ver Detalhes Completos
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Serviços Aceitos - Confirmados e Em Andamento */}
        {acceptedBookings.length > 0 && (
          <Card style={{ marginTop: '20px' }}>
            <CardHeader>✅ Meus Serviços Aceitos</CardHeader>
            <div style={{ 
              fontSize: '13px', 
              color: 'var(--gray)', 
              marginBottom: '12px',
              padding: '8px',
              background: '#E8F5E9',
              borderRadius: '6px'
            }}>
              💡 Clique em "Ver Detalhes" para consultar endereço, descrição e informações do cliente
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {acceptedBookings.map(booking => (
                <Card key={booking.id} style={{ backgroundColor: '#f8f9fa', border: '2px solid #4CAF50' }}>
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

                    {booking.clientName && (
                      <div style={{ 
                        background: 'white', 
                        padding: '12px', 
                        borderRadius: '8px',
                        marginBottom: '12px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                          👤 <strong>Cliente:</strong> {booking.clientName}
                        </div>
                        {booking.clientInfo?.fullAddress && (
                          <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '6px' }}>
                            📍 {booking.clientInfo.fullAddress}
                          </div>
                        )}
                      </div>
                    )}

                    {booking.checkInPin && (
                      <div style={{ 
                        background: '#E3F2FD', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        border: '2px solid #2196F3',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '11px', color: '#1565C0', marginBottom: '4px', fontWeight: '600' }}>
                          🔑 SEU PIN DE CHECK-IN
                        </div>
                        <div style={{ 
                          fontSize: '36px', 
                          fontWeight: '700',
                          color: '#1565C0',
                          letterSpacing: '6px'
                        }}>
                          {booking.checkInPin}
                        </div>
                      </div>
                    )}

                    <button 
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '14px', padding: '10px' }}
                      onClick={() => handleViewAcceptedDetails(booking)}
                    >
                      📋 Ver Detalhes Completos
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Modal de Detalhes/Confirmação */}
      {showModal && selectedBooking && (
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
          paddingBottom: '100px',
          overflowY: 'auto'
        }}>
          <Card style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <CardHeader>📋 Detalhes da Solicitação</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
                {selectedBooking.serviceName}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '12px' }}>
                Categoria: {selectedBooking.serviceCategory || 'Geral'}
              </div>
              
              {selectedBooking.date && (
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '12px' 
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    📅 <strong>{formatDate(selectedBooking.date)}</strong>
                  </div>
                  {selectedBooking.time && (
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      🕐 <strong>{selectedBooking.time}</strong>
                    </div>
                  )}
                  {selectedBooking.duration && (
                    <div style={{ fontSize: '14px' }}>
                      ⏱️ Duração estimada: <strong>{selectedBooking.duration} horas</strong>
                    </div>
                  )}
                </div>
              )}

              {(selectedBooking.basePrice ?? selectedBooking.price) != null && (
                <div style={{
                  background: '#E8F5E9',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: '2px solid #4CAF50'
                }}>
                  <div style={{ fontSize: '14px', color: '#2E7D32', fontWeight: '700' }}>
                    💰 Ganho previsto: R$ {(selectedBooking.basePrice ?? selectedBooking.price ?? 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '4px' }}>
                    Este é o valor que fica com você.
                  </div>
                </div>
              )}

              {selectedBooking.clientName && (
                <div style={{ 
                  background: '#E3F2FD', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '14px', color: '#1565C0', marginBottom: '4px' }}>
                    👤 <strong>Cliente:</strong> {selectedBooking.clientName}
                  </div>
                  {selectedBooking.clientInfo?.phone && (
                    <div style={{ fontSize: '14px', color: '#1565C0' }}>
                      📞 <strong>Telefone:</strong> {selectedBooking.clientInfo.phone}
                    </div>
                  )}
                </div>
              )}

              {/* Descrição do Cliente */}
              {selectedBooking.clientDescription && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    background: '#E8F5E9', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '2px solid #4CAF50'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#2E7D32' }}>
                      📝 Descrição Detalhada do Cliente
                    </div>
                    <div style={{ fontSize: '14px', color: '#424242', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {selectedBooking.clientDescription}
                    </div>
                  </div>
                </div>
              )}

              {/* Fotos do Cliente */}
              {selectedBooking.clientPhotos && selectedBooking.clientPhotos.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
                    📷 Fotos enviadas pelo cliente
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedBooking.clientPhotos.map((photo, idx) => (
                      <div key={idx} style={{ width: '100px', height: '100px' }}>
                        <img 
                          src={getImageUrl(photo)}
                          alt={`Foto ${idx + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            border: '2px solid #ddd',
                            cursor: 'pointer'
                          }}
                          onClick={() => downloadImage(photo)}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            console.error('Erro ao carregar foto:', photo);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
                    💡 Clique nas fotos para ampliar
                  </div>
                </div>
              )}

              {/* Disclaimer sobre materiais */}
              <div style={{ 
                background: '#FFF3E0', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '12px',
                border: '2px solid #FF9800'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#E65100', marginBottom: '8px' }}>
                  ⚠️ LEMBRE-SE: Materiais
                </div>
                <div style={{ fontSize: '13px', color: '#E65100', lineHeight: '1.6' }}>
                  O cliente é responsável por fornecer <strong>TODOS os materiais</strong>.
                  <br/>
                  Você fornecerá apenas a mão de obra. Confirme com o cliente se ele tem tudo necessário antes de aceitar.
                </div>
              </div>

              {/* Informações de Localização */}
              {selectedBooking.clientInfo?.fullAddress && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    background: '#FFF3E0', 
                    padding: '12px', 
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '2px solid #FF9800'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#E65100' }}>
                      📍 Local do Serviço
                    </div>
                    <div style={{ fontSize: '14px', color: '#424242', lineHeight: '1.6' }}>
                      {selectedBooking.clientInfo.fullAddress}
                    </div>
                  </div>

                  {/* Botão para abrir no Google Maps */}
                  <a
                    href={getGoogleMapsUrl(
                      selectedBooking.clientInfo.fullAddress, 
                      user.address ? `${user.address}, ${user.city} - ${user.state}` : ''
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{ 
                      width: '100%',
                      background: '#4285F4',
                      color: 'white',
                      border: 'none',
                      marginBottom: '12px',
                      textDecoration: 'none',
                      display: 'block',
                      textAlign: 'center'
                    }}
                  >
                    🗺️ Ver Rotas no Google Maps
                  </a>

                  {/* Mapa Embutido */}
                  <div style={{ 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    border: '2px solid #e0e0e0',
                    height: '250px',
                    marginBottom: '12px'
                  }}>
                    <iframe
                      title={`Mapa do local - solicitação ${selectedBooking.id || ''}`}
                      src={getSimpleMapUrl(selectedBooking.clientInfo.fullAddress)}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>

                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--gray)', 
                    textAlign: 'center',
                    marginBottom: '12px'
                  }}>
                    💡 Clique no botão acima para ver a rota do seu local até o cliente
                  </div>
                </div>
              )}

              <div style={{ 
                background: '#fff3cd', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '12px',
                border: '1px solid #ffeaa7'
              }}>
                <div style={{ fontSize: '13px', color: '#856404' }}>
                  ⚠️ <strong>Importante:</strong> Ao aceitar este serviço, você se compromete a realizá-lo na data e horário agendados. 
                  Caso não possa atender, por favor recuse a solicitação.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowModal(false);
                  setSelectedBooking(null);
                }}
              >
                Voltar
              </button>
              <button 
                className="btn"
                style={{ 
                  flex: 1,
                  background: '#dc3545',
                  color: 'white',
                  border: 'none'
                }}
                onClick={handleShowRejectModal}
              >
                ✗ Recusar
              </button>
              <button 
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleAttemptAcceptService}
              >
                ✓ Aceitar Serviço
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Recusa */}
      {showRejectModal && selectedBooking && (
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
            <CardHeader>❌ Recusar Solicitação</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '12px' }}>
                {selectedBooking.serviceName}
              </div>
              
              <div style={{ 
                background: '#fff3cd', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #ffeaa7'
              }}>
                <div style={{ fontSize: '13px', color: '#856404' }}>
                  Por favor, informe o motivo da recusa. Isso ajudará o cliente a entender.
                </div>
              </div>

              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Motivo da Recusa *
              </label>
              <textarea
                className="input"
                rows="4"
                placeholder="Ex: Não estarei disponível neste horário, tenho outro compromisso, etc."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setShowModal(true);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn"
                style={{ 
                  flex: 1,
                  background: '#dc3545',
                  color: 'white',
                  border: 'none'
                }}
                onClick={handleRejectBooking}
                disabled={!rejectReason.trim()}
              >
                Confirmar Recusa
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de PIN Gerado - BONITO */}
      {showPinModal && generatedPin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          paddingBottom: '100px',
          backdropFilter: 'blur(5px)'
        }}>
          <Card style={{ 
            maxWidth: '450px', 
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {/* Ícone de Sucesso */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#4CAF50',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 10px 25px rgba(76, 175, 80, 0.3)',
                animation: 'scaleIn 0.5s ease-out'
              }}>
                <span style={{ fontSize: '48px', color: 'white' }}>✓</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                Serviço Aceito!
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                O cliente foi notificado
              </div>
            </div>

            {/* PIN em Destaque */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '700',
                color: '#667eea',
                marginBottom: '16px',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                🔑 Seu PIN de Check-in
              </div>
              
              <div style={{
                fontSize: '64px',
                fontWeight: '700',
                color: '#667eea',
                letterSpacing: '12px',
                marginBottom: '16px',
                fontFamily: 'monospace',
                textShadow: '2px 2px 4px rgba(102, 126, 234, 0.2)'
              }}>
                {generatedPin}
              </div>

              <div style={{
                background: '#FFF3E0',
                padding: '12px',
                borderRadius: '8px',
                border: '2px dashed #FF9800',
                marginTop: '20px'
              }}>
                <div style={{ fontSize: '13px', color: '#E65100', lineHeight: '1.6' }}>
                  <strong>⚠️ IMPORTANTE:</strong> Anote este PIN!
                </div>
              </div>
            </div>

            {/* Instruções */}
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '14px', color: 'white', lineHeight: '1.8' }}>
                📋 <strong>Próximos passos:</strong>
                <ul style={{ margin: '12px 0 0 0', paddingLeft: '20px' }}>
                  <li>Vá até o local do serviço</li>
                  <li>Informe este PIN ao cliente</li>
                  <li>Cliente validará o PIN no app</li>
                  <li>Serviço será iniciado automaticamente</li>
                </ul>
              </div>
            </div>

            {/* Informação Extra */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
                💡 Você pode consultar este PIN a qualquer momento em <strong>"Histórico"</strong>
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn"
                style={{ 
                  flex: 1,
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s'
                }}
                onClick={() => {
                  // Copiar PIN para clipboard
                  navigator.clipboard.writeText(generatedPin);
                  setFeedbackModal({ show: true, type: 'success', message: 'PIN copiado para a área de transferência!' });
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                📋 Copiar PIN
              </button>
              <button 
                className="btn"
                style={{ 
                  flex: 1,
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  transition: 'all 0.3s'
                }}
                onClick={() => {
                  setShowPinModal(false);
                  setGeneratedPin('');
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                ✓ Entendi
              </button>
            </div>
          </Card>
        </div>
      )}

      <TrainingModal
        isOpen={showTrainingModal}
        moduleKey={trainingModuleKey}
        onClose={handleCloseTrainingModal}
        onComplete={handleTrainingComplete}
        successActionLabel="Concluir e Aceitar Serviço"
      />

      {/* Modal de Detalhes de Serviço Aceito */}
      {showDetailsModal && selectedBooking && (
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
          paddingBottom: '100px',
          overflowY: 'auto'
        }}>
          <Card style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <CardHeader>📋 Detalhes do Serviço</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
                {selectedBooking.serviceName}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '12px' }}>
                Categoria: {selectedBooking.serviceCategory || 'Geral'}
              </div>
              
              {selectedBooking.date && (
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '12px' 
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    📅 <strong>Data:</strong> {formatDate(selectedBooking.date)}
                  </div>
                  {selectedBooking.time && (
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      🕐 <strong>Horário:</strong> {selectedBooking.time}
                    </div>
                  )}
                  {selectedBooking.duration && (
                    <div style={{ fontSize: '14px' }}>
                      ⏱️ <strong>Duração:</strong> {selectedBooking.duration} horas
                    </div>
                  )}
                </div>
              )}

              {/* Descrição do Cliente */}
              {selectedBooking.clientDescription && (
                <div style={{ 
                  background: '#E8F5E9', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '12px',
                  border: '2px solid #4CAF50'
                }}>
                  <div style={{ fontSize: '13px', color: '#2E7D32', fontWeight: '600', marginBottom: '6px' }}>
                    📝 Descrição do Cliente:
                  </div>
                  <div style={{ fontSize: '13px', color: '#2E7D32', whiteSpace: 'pre-wrap' }}>
                    {selectedBooking.clientDescription}
                  </div>
                </div>
              )}

              {/* Fotos do Cliente */}
              {selectedBooking.clientPhotos && selectedBooking.clientPhotos.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>
                    📸 Fotos do Cliente:
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                    gap: '8px' 
                  }}>
                    {selectedBooking.clientPhotos.map((photo, index) => (
                      <img 
                        key={index}
                        src={getImageUrl(photo)}
                        alt={`Foto ${index + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '100px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: '2px solid #e0e0e0'
                        }}
                        onClick={() => downloadImage(photo)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          console.error('Erro ao carregar foto:', photo);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Aviso sobre Materiais */}
              <div style={{ 
                background: '#FFF3E0', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '12px',
                border: '2px solid #FF9800'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#E65100', marginBottom: '6px' }}>
                  ⚠️ Lembre-se: Materiais
                </div>
                <div style={{ fontSize: '12px', color: '#E65100' }}>
                  O cliente é responsável por fornecer todos os materiais. Você fornece apenas a mão de obra.
                </div>
              </div>

              {/* Informações do Cliente e Endereço */}
              {selectedBooking.clientInfo && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    background: 'white', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '2px solid #2196F3',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#1565C0', fontWeight: '600', marginBottom: '8px' }}>
                      👤 Informações do Cliente
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                      <strong>Nome:</strong> {selectedBooking.clientInfo.name}
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      <strong>Telefone:</strong> {selectedBooking.clientInfo.phone || 'Não informado'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#424242', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e0e0e0' }}>
                      📍 <strong>Endereço:</strong><br/>
                      {selectedBooking.clientInfo.fullAddress}
                    </div>
                  </div>

                  {/* Botão Abrir Google Maps */}
                  <a
                    href={getGoogleMapsUrl(
                      selectedBooking.clientInfo.fullAddress,
                      user.fullAddress
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ 
                      width: '100%', 
                      marginBottom: '12px',
                      display: 'block',
                      textAlign: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    🗺️ Ver Rota no Google Maps
                  </a>

                  {/* Mapa Embutido */}
                  <div style={{ 
                    width: '100%', 
                    height: '250px', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <iframe
                      title={`Mapa do local - detalhes ${selectedBooking.id || ''}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src={getSimpleMapUrl(selectedBooking.clientInfo.fullAddress)}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </div>
              )}

              {/* PIN de Check-in */}
              {selectedBooking.checkInPin && (
                <div style={{ 
                  background: '#E3F2FD', 
                  padding: '16px', 
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: '3px solid #2196F3',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#1565C0', marginBottom: '8px', fontWeight: '600' }}>
                    🔑 SEU PIN DE CHECK-IN
                  </div>
                  <div style={{ 
                    fontSize: '48px', 
                    fontWeight: '700',
                    color: '#1565C0',
                    letterSpacing: '8px',
                    marginBottom: '8px'
                  }}>
                    {selectedBooking.checkInPin}
                  </div>
                  <div style={{ fontSize: '11px', color: '#1976D2' }}>
                    Informe este PIN ao cliente quando chegar
                  </div>
                </div>
              )}
            </div>

            <button 
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedBooking(null);
              }}
            >
              Fechar
            </button>
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
            {/* Ícone animado */}
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
              animation: 'scaleIn 0.5s ease-out',
              color: 'white'
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

export default JovemServicos;
