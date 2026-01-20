import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, jovemService } from '../../services';

const ONGServicos = () => {
  const { user } = useAuth();
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [ongJovens, setOngJovens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [acceptedBookingDetails, setAcceptedBookingDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [clientRating, setClientRating] = useState(5);
  const [clientReview, setClientReview] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  
  // Filtros
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedJovemFilter, setSelectedJovemFilter] = useState('all');

  useEffect(() => {
    loadData();
    
    // Auto-atualizar a cada 10 segundos
    intervalRef.current = setInterval(() => {
      loadData(true);
    }, 10000);
    
    // Limpar intervalo ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activeTab, selectedJovemFilter, allBookings]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const [pendingResponse, allBookingsResponse, jovensResponse] = await Promise.all([
        bookingService.getPendingForOng(user.id),
        bookingService.getAll({}),
        jovemService.getAll(user.id)
      ]);
      
      const jovensIds = jovensResponse.data.map(j => j.id);
      
      // Combinar pendentes com todos os outros bookings dos jovens da ONG
      const ongBookings = allBookingsResponse.data.filter(b => 
        jovensIds.includes(b.jovemId) || 
        (b.recommendedJovens && b.recommendedJovens.some(rj => jovensIds.includes(rj.id)))
      );
      
      // Remover duplicatas e mesclar
      const bookingsMap = new Map();
      [...pendingResponse.data, ...ongBookings].forEach(b => {
        bookingsMap.set(b.id, b);
      });
      
      const uniqueBookings = Array.from(bookingsMap.values());
      setAllBookings(uniqueBookings);
      setOngJovens(jovensResponse.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...allBookings];
    
    // Filtro por status
    if (activeTab !== 'all') {
      filtered = filtered.filter(b => {
        if (activeTab === 'pending') {
          return b.status === 'pending' || b.status === 'assigned';
        }
        if (activeTab === 'confirmed') {
          return b.status === 'confirmed' || b.status === 'checked_in';
        }
        return b.status === activeTab;
      });
    }
    
    // Filtro por jovem
    if (selectedJovemFilter !== 'all') {
      filtered = filtered.filter(b => b.jovemId === selectedJovemFilter);
    }
    
    // Ordenar por data de criação (mais recentes primeiro)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredBookings(filtered);
  };

  const getStatusCounts = () => {
    return {
      pending: allBookings.filter(b => b.status === 'pending' || b.status === 'assigned').length,
      confirmed: allBookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length,
      in_progress: allBookings.filter(b => b.status === 'in_progress').length,
      completed: allBookings.filter(b => b.status === 'completed').length,
      cancelled: allBookings.filter(b => b.status === 'cancelled').length,
      all: allBookings.length
    };
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { label: '⏳ Pendente', class: 'badge-warning' },
      'assigned': { label: '⏳ Pendente', class: 'badge-warning' },
      'confirmed': { label: '✅ Confirmado', class: 'badge-success' },
      'checked_in': { label: '👤 Check-in Feito', class: 'badge-info' },
      'in_progress': { label: '🔄 Em Andamento', class: 'badge-info' },
      'completed': { label: '✔️ Concluído', class: 'badge-success' },
      'cancelled': { label: '❌ Cancelado', class: 'badge-danger' }
    };
    return badges[status] || { label: status, class: 'badge-info' };
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    if (booking.status === 'pending' || booking.status === 'assigned') {
      setShowModal(true);
    } else {
      setShowDetailsModal(true);
    }
  };

  const handleOpenClientReview = (booking) => {
    setSelectedBookingForReview(booking);
    setClientRating(5);
    setClientReview('');
    setShowReviewModal(true);
  };

  const handleSubmitClientReview = async () => {
    if (!selectedBookingForReview) return;
    if (!clientRating || clientRating < 1 || clientRating > 5) {
      alert('Selecione uma avaliação de 1 a 5 estrelas.');
      return;
    }

    try {
      setSavingReview(true);
      await bookingService.reviewClientByJovem(
        selectedBookingForReview.id,
        selectedBookingForReview.jovemId,
        clientRating,
        clientReview
      );
      setShowReviewModal(false);
      setSelectedBookingForReview(null);
      loadData();
      alert('Avaliação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao avaliar cliente:', error);
      alert(error.response?.data?.error || 'Erro ao enviar avaliação');
    } finally {
      setSavingReview(false);
    }
  };

  const handleAcceptBooking = async (booking, jovemId) => {
    if (!jovemId) {
      alert('Por favor, selecione um jovem');
      return;
    }

    try {
      const response = await bookingService.accept(booking.id, jovemId, 'ong');
      const acceptedBooking = response.data;
      
      setShowModal(false);
      setSelectedBooking(null);
      
      if (acceptedBooking.checkInPin) {
        setGeneratedPin(acceptedBooking.checkInPin);
        setAcceptedBookingDetails(acceptedBooking);
        setShowPinModal(true);
      } else {
        alert('Serviço atribuído com sucesso!');
      }
      
      loadData();
    } catch (error) {
      console.error('Erro ao aceitar booking:', error);
      alert(error.response?.data?.error || 'Erro ao atribuir serviço');
    }
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header title="Gerenciar Serviços" showBack />
      
      <div className="container">
        {/* Estatísticas Gerais */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
              {counts.all}
            </div>
            <div style={{ fontSize: '16px', opacity: '0.9', marginBottom: '8px' }}>
              Total de Solicitações
            </div>
            <div style={{ fontSize: '12px', opacity: '0.8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span>🔄</span>
              <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </Card>

        {/* Filtros por Status */}
        <Card style={{ marginTop: '20px', padding: '16px' }}>
          <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
            Filtrar por Status:
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '8px',
            marginBottom: '16px'
          }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                padding: '10px 8px',
                border: activeTab === 'pending' ? '2px solid #FFA726' : '1px solid #ddd',
                borderRadius: '8px',
                background: activeTab === 'pending' ? '#FFF3E0' : 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === 'pending' ? '600' : '400',
                color: activeTab === 'pending' ? '#E65100' : '#666'
              }}
            >
              ⏳ Pendentes<br/>
              <span style={{ fontSize: '18px', fontWeight: '700' }}>{counts.pending}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('confirmed')}
              style={{
                padding: '10px 8px',
                border: activeTab === 'confirmed' ? '2px solid #66BB6A' : '1px solid #ddd',
                borderRadius: '8px',
                background: activeTab === 'confirmed' ? '#E8F5E9' : 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === 'confirmed' ? '600' : '400',
                color: activeTab === 'confirmed' ? '#2E7D32' : '#666'
              }}
            >
              ✅ Confirmados<br/>
              <span style={{ fontSize: '18px', fontWeight: '700' }}>{counts.confirmed}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('in_progress')}
              style={{
                padding: '10px 8px',
                border: activeTab === 'in_progress' ? '2px solid #4FC3F7' : '1px solid #ddd',
                borderRadius: '8px',
                background: activeTab === 'in_progress' ? '#E3F2FD' : 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === 'in_progress' ? '600' : '400',
                color: activeTab === 'in_progress' ? '#0277BD' : '#666'
              }}
            >
              🔄 Andamento<br/>
              <span style={{ fontSize: '18px', fontWeight: '700' }}>{counts.in_progress}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('completed')}
              style={{
                padding: '10px 8px',
                border: activeTab === 'completed' ? '2px solid #4CAF50' : '1px solid #ddd',
                borderRadius: '8px',
                background: activeTab === 'completed' ? '#E8F5E9' : 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === 'completed' ? '600' : '400',
                color: activeTab === 'completed' ? '#1B5E20' : '#666'
              }}
            >
              ✔️ Concluídos<br/>
              <span style={{ fontSize: '18px', fontWeight: '700' }}>{counts.completed}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('cancelled')}
              style={{
                padding: '10px 8px',
                border: activeTab === 'cancelled' ? '2px solid #EF5350' : '1px solid #ddd',
                borderRadius: '8px',
                background: activeTab === 'cancelled' ? '#FFEBEE' : 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === 'cancelled' ? '600' : '400',
                color: activeTab === 'cancelled' ? '#C62828' : '#666'
              }}
            >
              ❌ Cancelados<br/>
              <span style={{ fontSize: '18px', fontWeight: '700' }}>{counts.cancelled}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '10px 8px',
                border: activeTab === 'all' ? '2px solid #757575' : '1px solid #ddd',
                borderRadius: '8px',
                background: activeTab === 'all' ? '#F5F5F5' : 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === 'all' ? '600' : '400',
                color: activeTab === 'all' ? '#212121' : '#666'
              }}
            >
              📊 Todos<br/>
              <span style={{ fontSize: '18px', fontWeight: '700' }}>{counts.all}</span>
            </button>
          </div>

          {/* Filtro por Jovem */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '8px' }}>
              Filtrar por Jovem:
            </label>
            <select
              value={selectedJovemFilter}
              onChange={(e) => setSelectedJovemFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="all">👥 Todos os Jovens</option>
              {ongJovens.map(jovem => (
                <option key={jovem.id} value={jovem.id}>{jovem.name}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Lista de Serviços */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>
            📋 {activeTab === 'pending' ? 'Pendentes de Atribuição' :
                activeTab === 'confirmed' ? 'Confirmados' :
                activeTab === 'in_progress' ? 'Em Andamento' :
                activeTab === 'completed' ? 'Concluídos' :
                activeTab === 'cancelled' ? 'Cancelados' : 'Todos os Serviços'}
          </CardHeader>
          
          {filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ color: 'var(--gray)' }}>
                Nenhum serviço encontrado nesta categoria
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredBookings.map(booking => {
                const badge = getStatusBadge(booking.status);
                const recommendedForOng = booking.ongRecommendedJovens || booking.recommendedJovens?.filter(rj => 
                  ongJovens.some(oj => oj.id === rj.id)
                );

                return (
                  <Card key={booking.id} style={{ backgroundColor: '#f8f9fa', border: '2px solid #e3f2fd' }}>
                    <div>
                      {/* Cabeçalho */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#333', fontWeight: '700' }}>
                            {booking.serviceName}
                          </h3>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                            📂 <strong>{booking.serviceCategory}</strong>
                          </div>
                        </div>
                        <span className={`badge ${badge.class}`} style={{ fontSize: '11px', padding: '6px 10px' }}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Jovem Atribuído */}
                      {booking.jovemName && (
                        <div style={{ 
                          background: '#E3F2FD', 
                          padding: '10px 12px', 
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '1px solid #BBDEFB'
                        }}>
                          <div style={{ fontSize: '13px', color: '#1976D2', fontWeight: '600' }}>
                            👨‍🎓 Jovem: {booking.jovemName}
                          </div>
                        </div>
                      )}

                      {/* Informações do Cliente */}
                      {booking.clientInfo && (
                        <div style={{ 
                          background: '#FFF3E0', 
                          padding: '10px 12px', 
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '1px solid #FFE0B2'
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#E65100', marginBottom: '6px' }}>
                            👤 Cliente: {booking.clientInfo.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            📞 {booking.clientInfo.phone}
                          </div>
                        </div>
                      )}

                      {/* Data e Hora */}
                      <div style={{ 
                        background: '#E8F5E9', 
                        padding: '8px 12px', 
                        borderRadius: '8px',
                        marginBottom: '12px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        fontSize: '13px',
                        color: '#2E7D32'
                      }}>
                        <div>📅 {new Date(booking.date).toLocaleDateString('pt-BR')}</div>
                        {booking.time && <div>🕐 {booking.time}</div>}
                      </div>

                      {/* PIN (se disponível) */}
                      {booking.checkInPin && (booking.status === 'confirmed' || booking.status === 'checked_in') && (
                        <div style={{ 
                          background: '#E8F5E9', 
                          padding: '12px', 
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '2px solid #4CAF50',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '12px', color: '#2E7D32', marginBottom: '6px', fontWeight: '600' }}>
                            📌 PIN de Check-in
                          </div>
                          <div style={{ 
                            fontSize: '28px', 
                            fontWeight: '900',
                            color: '#1B5E20',
                            letterSpacing: '6px',
                            fontFamily: 'monospace'
                          }}>
                            {booking.checkInPin}
                          </div>
                        </div>
                      )}

                      {/* Botão de ação */}
                      <button
                        className="btn btn-primary btn-full"
                        onClick={() => handleViewBooking(booking)}
                        style={{ fontSize: '14px', fontWeight: '600' }}
                      >
                        {(booking.status === 'pending' || booking.status === 'assigned') 
                          ? '✅ Atribuir Jovem' 
                          : '👁️ Ver Detalhes'}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Atribuição (Pendentes) */}
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
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: '85vh', overflow: 'auto' }}>
            <CardHeader>👨‍🎓 Selecionar Jovem para o Serviço</CardHeader>
            
            <div style={{ 
              marginBottom: '20px',
              padding: '16px',
              background: '#f5f5f5',
              borderRadius: '8px'
            }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#333', fontWeight: '700' }}>
                📋 {selectedBooking.serviceName}
              </h3>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                📂 Categoria: <strong>{selectedBooking.serviceCategory}</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                📅 {new Date(selectedBooking.date).toLocaleDateString('pt-BR')} 
                {selectedBooking.time && ` às ${selectedBooking.time}`}
              </div>
              {selectedBooking.clientInfo && (
                <>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px', marginTop: '12px', fontWeight: '600' }}>
                    👤 Cliente: {selectedBooking.clientInfo.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    📞 {selectedBooking.clientInfo.phone}
                  </div>
                </>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                Selecione um jovem disponível:
              </div>
              
              {ongJovens.filter(j => 
                j.availability && 
                j.skills && 
                j.skills.includes(selectedBooking.serviceCategory)
              ).length === 0 ? (
                <div style={{ 
                  padding: '20px', 
                  background: '#FFF3E0', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#E65100',
                  border: '2px solid #FFE0B2'
                }}>
                  ⚠️ Nenhum jovem disponível com a habilidade "{selectedBooking.serviceCategory}"
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ongJovens
                    .filter(j => 
                      j.availability && 
                      j.skills && 
                      j.skills.includes(selectedBooking.serviceCategory)
                    )
                    .sort((a, b) => {
                      const aRecommended = selectedBooking.ongRecommendedJovens?.some(rj => rj.id === a.id);
                      const bRecommended = selectedBooking.ongRecommendedJovens?.some(rj => rj.id === b.id);
                      if (aRecommended && !bRecommended) return -1;
                      if (!aRecommended && bRecommended) return 1;
                      return (b.stats?.rating || 0) - (a.stats?.rating || 0);
                    })
                    .map(jovem => {
                      const isRecommended = selectedBooking.ongRecommendedJovens?.some(rj => rj.id === jovem.id);
                      return (
                        <div
                          key={jovem.id}
                          style={{
                            padding: '14px',
                            border: isRecommended ? '2px solid #4CAF50' : '2px solid #e0e0e0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: isRecommended ? '#E8F5E9' : 'white',
                            position: 'relative'
                          }}
                          onClick={() => handleAcceptBooking(selectedBooking, jovem.id)}
                        >
                          {isRecommended && (
                            <div style={{
                              position: 'absolute',
                              top: '-10px',
                              right: '10px',
                              background: '#4CAF50',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              ⭐ RECOMENDADO
                            </div>
                          )}
                          <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '15px', color: '#333' }}>
                            {jovem.name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                            ⭐ {jovem.stats?.rating?.toFixed(1) || '0.0'} • 
                            {' '}{jovem.stats?.completedServices || 0} serviços
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <button 
              className="btn btn-secondary btn-full"
              onClick={() => {
                setShowModal(false);
                setSelectedBooking(null);
              }}
              style={{ marginTop: '12px' }}
            >
              ❌ Fechar
            </button>
          </Card>
        </div>
      )}

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
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: '85vh', overflow: 'auto' }}>
            <CardHeader>📋 Detalhes do Serviço</CardHeader>
            
            <div style={{ marginBottom: '16px' }}>
              <div className={`badge ${getStatusBadge(selectedBooking.status).class}`} style={{ fontSize: '12px', padding: '8px 16px' }}>
                {getStatusBadge(selectedBooking.status).label}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '700' }}>
                {selectedBooking.serviceName}
              </h3>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                📂 {selectedBooking.serviceCategory}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                📅 {new Date(selectedBooking.date).toLocaleDateString('pt-BR')}
                {selectedBooking.time && ` às ${selectedBooking.time}`}
              </div>
            </div>

            {selectedBooking.jovemName && (
              <div style={{ 
                background: '#E3F2FD', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1976D2', marginBottom: '4px' }}>
                  👨‍🎓 Jovem Atribuído
                </div>
                <div style={{ fontSize: '15px', color: '#333', fontWeight: '600' }}>
                  {selectedBooking.jovemName}
                </div>
              </div>
            )}

            {selectedBooking.clientInfo && (
              <div style={{ 
                background: '#FFF3E0', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#E65100', marginBottom: '8px' }}>
                  👤 Cliente
                </div>
                <div style={{ fontSize: '14px', color: '#555', marginBottom: '4px' }}>
                  <strong>{selectedBooking.clientInfo.name}</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>
                  📞 {selectedBooking.clientInfo.phone}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  📍 {selectedBooking.clientInfo.fullAddress}
                </div>
              </div>
            )}

            {selectedBooking.checkInPin && (
              <div style={{ 
                background: '#E8F5E9', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '16px',
                border: '2px solid #4CAF50',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '13px', color: '#2E7D32', marginBottom: '8px', fontWeight: '600' }}>
                  📌 PIN de Check-in
                </div>
                <div style={{ 
                  fontSize: '36px', 
                  fontWeight: '900',
                  color: '#1B5E20',
                  letterSpacing: '8px',
                  fontFamily: 'monospace'
                }}>
                  {selectedBooking.checkInPin}
                </div>
              </div>
            )}

            {selectedBooking.description && (
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  💬 Descrição:
                </div>
                <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.5' }}>
                  {selectedBooking.description}
                </div>
              </div>
            )}

            {selectedBooking.status === 'completed' && (
              <div style={{ marginBottom: '16px' }}>
                {!selectedBooking.rating && (
                  <div style={{ fontSize: '13px', color: '#E65100', fontWeight: '600' }}>
                    ⏳ Aguardando avaliação do cliente
                  </div>
                )}
                {selectedBooking.rating && (selectedBooking.jovemRating ? (
                  <div style={{ fontSize: '13px', color: '#2E7D32', fontWeight: '600' }}>
                    ✅ Cliente avaliado: {selectedBooking.jovemRating}/5
                  </div>
                ) : (
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleOpenClientReview(selectedBooking)}
                  >
                    ⭐ Avaliar Cliente
                  </button>
                ))}
              </div>
            )}

            <button 
              className="btn btn-secondary btn-full"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedBooking(null);
              }}
            >
              ❌ Fechar
            </button>
          </Card>
        </div>
      )}

      {showReviewModal && selectedBookingForReview && (
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
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: '75vh', overflowY: 'auto' }}>
            <CardHeader>⭐ Avaliar Cliente</CardHeader>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>
                {selectedBookingForReview.clientInfo?.name || 'Cliente'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '20px' }}>
                Serviço: {selectedBookingForReview.serviceName}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px' }}>
                  Como foi o atendimento do cliente? *
                </label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setClientRating(star)}
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
                      {star <= clientRating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--gray)' }}>
                  {clientRating === 5 && '🌟 Excelente!'}
                  {clientRating === 4 && '😊 Muito bom!'}
                  {clientRating === 3 && '👍 Bom'}
                  {clientRating === 2 && '😐 Regular'}
                  {clientRating === 1 && '😞 Insatisfeito'}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  Comentário (opcional)
                </label>
                <textarea
                  className="input"
                  rows="4"
                  placeholder="Compartilhe sua experiência com o cliente..."
                  value={clientReview}
                  onChange={(e) => setClientReview(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowReviewModal(false)}
                disabled={savingReview}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSubmitClientReview}
                disabled={savingReview}
              >
                {savingReview ? '⏳ Enviando...' : 'Enviar Avaliação'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de PIN Gerado */}
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
          zIndex: 1001,
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <Card style={{ 
            maxWidth: '400px', 
            width: '100%',
            textAlign: 'center',
            padding: '30px 20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
            
            <h2 style={{ 
              fontSize: '24px', 
              marginBottom: '16px',
              color: '#2E7D32',
              fontWeight: '700'
            }}>
              Serviço Atribuído!
            </h2>
            
            <div style={{ 
              background: '#E8F5E9', 
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '2px solid #4CAF50'
            }}>
              <div style={{ fontSize: '14px', color: '#555', marginBottom: '12px', fontWeight: '600' }}>
                📌 PIN de Check-in gerado:
              </div>
              <div style={{ 
                fontSize: '48px', 
                fontWeight: '900',
                color: '#2E7D32',
                letterSpacing: '8px',
                fontFamily: 'monospace',
                marginBottom: '8px'
              }}>
                {generatedPin}
              </div>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
                Compartilhe este PIN com o jovem para check-in
              </div>
            </div>

            {acceptedBookingDetails && (
              <div style={{ 
                background: '#f5f5f5',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'left',
                fontSize: '13px'
              }}>
                <div style={{ marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  📋 Detalhes:
                </div>
                <div style={{ marginBottom: '4px', color: '#555' }}>
                  <strong>Serviço:</strong> {acceptedBookingDetails.serviceName}
                </div>
                <div style={{ marginBottom: '4px', color: '#555' }}>
                  <strong>Jovem:</strong> {acceptedBookingDetails.jovemName}
                </div>
                <div style={{ color: '#555' }}>
                  <strong>Data:</strong> {new Date(acceptedBookingDetails.date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}

            <button 
              className="btn btn-primary btn-full"
              onClick={() => {
                setShowPinModal(false);
                setGeneratedPin('');
                setAcceptedBookingDetails(null);
              }}
              style={{ fontSize: '16px', fontWeight: '600' }}
            >
              ✅ Entendi
            </button>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ONGServicos;
