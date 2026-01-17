import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, jovemService } from '../../services';

const ONGServicos = () => {
  const { user } = useAuth();
  const [pendingBookings, setPendingBookings] = useState([]);
  const [ongJovens, setOngJovens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, jovensResponse] = await Promise.all([
        bookingService.getPendingForOng(user.id),
        jovemService.getAll(user.id)
      ]);
      setPendingBookings(bookingsResponse.data);
      setOngJovens(jovensResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleAcceptBooking = async (booking, jovemId) => {
    if (!jovemId) {
      alert('Por favor, selecione um jovem');
      return;
    }

    try {
      await bookingService.accept(booking.id, jovemId, 'ong');
      alert('Serviço atribuído com sucesso!');
      setShowModal(false);
      setSelectedBooking(null);
      loadData();
    } catch (error) {
      console.error('Erro ao aceitar booking:', error);
      alert('Erro ao atribuir serviço');
    }
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
      <Header title="Solicitações de Serviço" showBack />
      
      <div className="container">
        {/* Resumo */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
              {pendingBookings.length}
            </div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>
              Solicitações Pendentes
            </div>
          </div>
        </Card>

        {/* Lista de Solicitações */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📋 Solicitações de Clientes</CardHeader>
          {pendingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ color: 'var(--gray)' }}>
                Nenhuma solicitação pendente no momento
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingBookings.map(booking => {
                const recommendedForOng = booking.recommendedJovens?.filter(rj => 
                  ongJovens.some(oj => oj.id === rj.id)
                );

                return (
                  <Card key={booking.id} style={{ backgroundColor: '#f8f9fa' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#333' }}>
                            {booking.serviceName}
                          </h3>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                            📂 Categoria: <strong>{booking.serviceCategory}</strong>
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            📅 {new Date(booking.createdAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <span className="badge badge-warning" style={{ fontSize: '12px' }}>
                          Pendente
                        </span>
                      </div>

                      {recommendedForOng && recommendedForOng.length > 0 && (
                        <div style={{ 
                          background: '#E3F2FD', 
                          padding: '12px', 
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1976D2', marginBottom: '8px' }}>
                            ⭐ Jovens Recomendados da sua ONG:
                          </div>
                          {recommendedForOng.map(jovem => (
                            <div key={jovem.id} style={{ fontSize: '13px', color: '#555', marginBottom: '4px' }}>
                              • {jovem.name} - ⭐ {jovem.rating.toFixed(1)} ({jovem.completedServices} serviços)
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        className="btn btn-primary btn-full"
                        onClick={() => handleViewBooking(booking)}
                        style={{ fontSize: '14px' }}
                      >
                        ✅ Atribuir Jovem
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Atribuição */}
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
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <CardHeader>👨‍🎓 Selecionar Jovem</CardHeader>
            
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#333' }}>
                Serviço: {selectedBooking.serviceName}
              </h3>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Categoria: <strong>{selectedBooking.serviceCategory}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                Selecione um jovem com a habilidade necessária:
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
                  color: '#E65100'
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
                    .map(jovem => (
                      <div
                        key={jovem.id}
                        style={{
                          padding: '12px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handleAcceptBooking(selectedBooking, jovem.id)}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {jovem.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          ⭐ {jovem.stats?.rating?.toFixed(1) || '0.0'} • 
                          {' '}{jovem.stats?.completedServices || 0} serviços • 
                          {' '}🏆 {jovem.stats?.points || 0} pontos
                        </div>
                        <div style={{ fontSize: '12px', color: '#1976D2', marginTop: '4px' }}>
                          Skills: {jovem.skills.join(', ')}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <button 
              className="btn btn-secondary btn-full"
              onClick={() => {
                setShowModal(false);
                setSelectedBooking(null);
              }}
            >
              ❌ Cancelar
            </button>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ONGServicos;
