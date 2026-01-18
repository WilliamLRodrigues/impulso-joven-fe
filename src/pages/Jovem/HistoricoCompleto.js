import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services';
import { getImageUrl, downloadImage } from '../../utils/imageUtils';

const JovemHistoricoCompleto = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [generatingPin, setGeneratingPin] = useState(false);
  const [showOnlyRecent, setShowOnlyRecent] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadBookings();
    
    // Atualizar automaticamente a cada 10 segundos (silencioso)
    const interval = setInterval(() => {
      loadBookings(true); // true = atualização silenciosa
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadBookings = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await bookingService.getAll({ jovemId: user.id });
      // Ordenar do mais recente para o mais antigo
      const sortedBookings = response.data.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date);
        const dateB = new Date(b.createdAt || b.date);
        return dateB - dateA; // Mais recente primeiro
      });
      setBookings(sortedBookings);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleGeneratePin = async (booking) => {
    try {
      setGeneratingPin(true);
      const response = await bookingService.generateCheckInPin(booking.id, user.id);
      setGeneratedPin(response.data.checkInPin);
      setSelectedBooking(booking);
      setShowPinModal(true);
      loadBookings(); // Recarregar para atualizar status
    } catch (error) {
      console.error('Erro ao gerar PIN:', error);
      alert(error.response?.data?.error || 'Erro ao gerar PIN');
    } finally {
      setGeneratingPin(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Filtro por status
    if (filter === 'all') {
      // não faz nada
    } else if (filter === 'confirmed') {
      if (booking.status !== 'confirmed') return false;
    } else if (filter === 'in_progress') {
      if (booking.status !== 'in_progress' && booking.status !== 'checked_in') return false;
    } else if (filter === 'completed') {
      if (booking.status !== 'completed') return false;
    } else if (filter === 'cancelled') {
      if (booking.status !== 'cancelled') return false;
    }
    
    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesService = booking.serviceName?.toLowerCase().includes(term);
      const matchesClient = booking.clientName?.toLowerCase().includes(term);
      const matchesDescription = booking.clientDescription?.toLowerCase().includes(term);
      if (!matchesService && !matchesClient && !matchesDescription) return false;
    }
    
    return true;
  });
  
  // Aplicar filtro de "apenas 5 últimos"
  const displayBookings = showOnlyRecent 
    ? filteredBookings.slice(0, 5) 
    : filteredBookings;
  
  // Paginação
  const totalPages = Math.ceil(displayBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = displayBookings.slice(startIndex, endIndex);
  
  // Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, showOnlyRecent]);

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const inProgressBookings = bookings.filter(b => b.status === 'in_progress' || b.status === 'checked_in');
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
      'confirmed': { text: 'Confirmado', class: 'badge-success', emoji: '✓' },
      'checked_in': { text: 'Check-in feito', class: 'badge-info', emoji: '📍' },
      'in_progress': { text: 'Em Andamento', class: 'badge-warning', emoji: '⏳' },
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

  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header title="Meus Serviços" />
      
      <div className="container">
        {/* Resumo de Ganhos */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px' }}>
              💰 Total de Ganhos
            </div>
            <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
              R$ {totalEarnings.toFixed(2)}
            </div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>
              {completedBookings.length} serviços concluídos
            </div>
          </div>
        </Card>

        {/* Estatísticas Rápidas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
              {confirmedBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
              Confirmados
            </div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#FF9800' }}>
              {inProgressBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
              Em Andamento
            </div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#4CAF50' }}>
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

        {/* Filtros */}
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
              onClick={() => setFilter('all')}
            >
              Todos ({bookings.length})
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

        {/* Barra de Busca e Checkbox */}
        <Card style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              className="input"
              placeholder="🔍 Buscar por serviço, cliente ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="showOnlyRecent"
              checked={showOnlyRecent}
              onChange={(e) => setShowOnlyRecent(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label 
              htmlFor="showOnlyRecent" 
              style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px' }}
            >
              Mostrar apenas os 5 últimos serviços
            </label>
          </div>
        </Card>

        {/* Lista de Serviços */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>
            📋 Histórico de Serviços 
            <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>
              ({displayBookings.length} {displayBookings.length === 1 ? 'serviço' : 'serviços'})
            </span>
          </CardHeader>
          {paginatedBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ color: 'var(--gray)' }}>
                Nenhum serviço encontrado
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {paginatedBookings.map(booking => (
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

                    {/* Mostrar motivo do cancelamento se cancelado */}
                    {booking.status === 'cancelled' && booking.cancellationReason && (
                      <div style={{ 
                        background: '#ffebee', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        border: '2px solid #f44336'
                      }}>
                        <div style={{ fontSize: '13px', color: '#c62828', fontWeight: '600', marginBottom: '6px' }}>
                          ❌ Motivo do Cancelamento:
                        </div>
                        <div style={{ fontSize: '13px', color: '#d32f2f', marginBottom: '8px' }}>
                          {booking.cancellationReason}
                        </div>
                        <div style={{ fontSize: '11px', color: '#e57373' }}>
                          {booking.cancelledAt && `Cancelado em: ${formatDate(booking.cancelledAt)}`}
                          {booking.cancelledBy && ` • Por: ${booking.cancelledBy === 'client' ? 'Cliente' : 'Jovem'}`}
                        </div>
                      </div>
                    )}

                    {/* Endereço apenas para serviços não cancelados */}
                    {booking.clientInfo && booking.status !== 'cancelled' && (
                      <div style={{ 
                        background: 'white', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                          👤 {booking.clientInfo.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                          📍 {booking.clientInfo.fullAddress}
                        </div>
                      </div>
                    )}

                    {booking.status === 'completed' && booking.finalPrice && (
                      <div style={{ 
                        background: '#E8F5E9', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        border: '2px solid #4CAF50'
                      }}>
                        <div style={{ fontSize: '14px', color: '#2E7D32', fontWeight: '700' }}>
                          💰 Ganho: R$ {booking.finalPrice.toFixed(2)}
                        </div>
                        {booking.rating && (
                          <div style={{ fontSize: '13px', color: '#2E7D32', marginTop: '4px' }}>
                            ⭐ Avaliação: {booking.rating}/5
                          </div>
                        )}
                        {booking.clientReview && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#2E7D32', 
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid #A5D6A7',
                            fontStyle: 'italic'
                          }}>
                            💬 "{booking.clientReview}"
                          </div>
                        )}
                      </div>
                    )}

                    {booking.checkInPin && (
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
                          {booking.checkInPin}
                        </div>
                        <div style={{ fontSize: '11px', color: '#1976D2' }}>
                          Informe este PIN ao cliente quando chegar
                        </div>
                      </div>
                    )}

                    {/* Informação sobre o PIN */}
                    {booking.status === 'confirmed' && !booking.checkInPin && (
                      <div style={{ 
                        background: '#FFF3E0', 
                        padding: '12px', 
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#E65100',
                        border: '1px solid #FFB74D'
                      }}>
                        ℹ️ O PIN será gerado quando você aceitar o serviço
                      </div>
                    )}

                    {/* Botão Ver Detalhes para cancelados e concluídos */}
                    {(booking.status === 'cancelled' || booking.status === 'completed') && (
                      <button 
                        className="btn btn-secondary"
                        style={{ width: '100%', marginTop: '8px' }}
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailsModal(true);
                        }}
                      >
                        📋 Ver Detalhes
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {/* Paginação */}
          {!showOnlyRecent && totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '8px',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #e0e0e0'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ 
                  padding: '8px 16px',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Anterior
              </button>
              
              <div style={{ 
                display: 'flex', 
                gap: '4px',
                alignItems: 'center'
              }}>
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Mostrar apenas páginas próximas da atual
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`btn ${page === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentPage(page)}
                        style={{ 
                          padding: '8px 12px',
                          minWidth: '40px'
                        }}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 || 
                    page === currentPage + 2
                  ) {
                    return <span key={page} style={{ padding: '8px 4px' }}>...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ 
                  padding: '8px 16px',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Próxima →
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Detalhes */}
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
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <CardHeader>
              {selectedBooking.status === 'cancelled' ? '❌ Serviço Cancelado' : '✅ Serviço Concluído'}
            </CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
                {selectedBooking.serviceName}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '12px' }}>
                📅 {formatDate(selectedBooking.date)} {selectedBooking.time && `às ${selectedBooking.time}`}
              </div>
            </div>

            {selectedBooking.status === 'cancelled' ? (
              <>
                {/* Apenas motivo do cancelamento */}
                <div style={{ 
                  background: '#ffebee', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  border: '2px solid #f44336'
                }}>
                  <div style={{ fontSize: '14px', color: '#c62828', fontWeight: '600', marginBottom: '8px' }}>
                    ❌ Motivo do Cancelamento:
                  </div>
                  <div style={{ fontSize: '14px', color: '#d32f2f', marginBottom: '12px', lineHeight: '1.5' }}>
                    {selectedBooking.cancellationReason || 'Não informado'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#e57373' }}>
                    {selectedBooking.cancelledAt && `Cancelado em: ${formatDate(selectedBooking.cancelledAt)}`}
                    {selectedBooking.cancelledBy && ` • Por: ${selectedBooking.cancelledBy === 'client' ? 'Cliente' : 'Jovem'}`}
                  </div>
                </div>

                {/* Nome do cliente (sem endereço) */}
                {selectedBooking.clientInfo && (
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                      👤 Cliente: {selectedBooking.clientInfo.name}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Detalhes completos para serviço concluído */}
                {selectedBooking.clientInfo && (
                  <div style={{ 
                    background: 'white', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px', fontWeight: '600' }}>
                      👤 {selectedBooking.clientInfo.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                      📍 {selectedBooking.clientInfo.fullAddress}
                    </div>
                  </div>
                )}

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
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedBooking.finalPrice && (
                  <div style={{ 
                    background: '#E8F5E9', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    border: '2px solid #4CAF50'
                  }}>
                    <div style={{ fontSize: '16px', color: '#2E7D32', fontWeight: '700', marginBottom: '8px' }}>
                      💰 Ganho: R$ {selectedBooking.finalPrice.toFixed(2)}
                    </div>
                    {selectedBooking.rating && (
                      <div style={{ fontSize: '14px', color: '#2E7D32', marginTop: '4px' }}>
                        ⭐ Avaliação: {selectedBooking.rating}/5
                      </div>
                    )}
                  </div>
                )}

                {selectedBooking.clientReview && (
                  <div style={{ 
                    background: '#FFF9C4', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    border: '2px solid #FBC02D'
                  }}>
                    <div style={{ fontSize: '13px', color: '#F57F17', fontWeight: '600', marginBottom: '6px' }}>
                      💬 Comentário do Cliente:
                    </div>
                    <div style={{ fontSize: '13px', color: '#5D4037', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {selectedBooking.clientReview}
                    </div>
                  </div>
                )}

                {selectedBooking.completedPhotos && selectedBooking.completedPhotos.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>
                      📸 Fotos do Serviço Concluído:
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                      gap: '8px' 
                    }}>
                      {selectedBooking.completedPhotos.map((photo, index) => (
                        <img 
                          key={index}
                          src={getImageUrl(photo)} 
                          alt={`Foto concluída ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '100px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: '2px solid #4CAF50'
                          }}
                          onClick={() => downloadImage(photo)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

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

      {/* Modal de PIN Gerado */}
      {showPinModal && (
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
            <CardHeader>🔑 PIN de Check-in Gerado!</CardHeader>
            
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ 
                fontSize: '64px', 
                fontWeight: '700', 
                color: 'var(--primary)',
                letterSpacing: '8px',
                marginBottom: '16px',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '12px',
                border: '3px dashed var(--primary)'
              }}>
                {generatedPin}
              </div>
              
              <div style={{ 
                fontSize: '16px', 
                color: '#424242',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                Informe este PIN de <strong>4 dígitos</strong> ao cliente para confirmar sua chegada.
              </div>

              <div style={{ 
                background: '#E3F2FD', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #90CAF9'
              }}>
                <div style={{ fontSize: '14px', color: '#1565C0', lineHeight: '1.6' }}>
                  ℹ️ O cliente digitará este PIN no painel dele para confirmar que você chegou para realizar o serviço.
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                setShowPinModal(false);
                setGeneratedPin('');
              }}
            >
              Entendi
            </button>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default JovemHistoricoCompleto;
