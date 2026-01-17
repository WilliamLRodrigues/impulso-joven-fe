import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services';

const JovemServicos = () => {
  const { user } = useAuth();
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadPendingBookings();
  }, []);

  const loadPendingBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getPendingForJovem(user.id);
      setPendingBookings(response.data);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleAcceptBooking = async (booking) => {
    try {
      await bookingService.accept(booking.id, user.id, 'jovem');
      alert('Serviço aceito com sucesso!');
      setShowModal(false);
      setSelectedBooking(null);
      loadPendingBookings();
    } catch (error) {
      console.error('Erro ao aceitar serviço:', error);
      alert('Erro ao aceitar serviço');
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
      <Header title="Serviços Disponíveis" />
      
      <div className="container">
        {/* Resumo */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
              {pendingBookings.length}
            </div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>
              Serviços Disponíveis Para Você
            </div>
          </div>
        </Card>

        {/* Info sobre Skills */}
        <Card style={{ marginTop: '20px', background: '#E3F2FD', border: '2px solid #1976D2' }}>
          <div style={{ fontSize: '14px', color: '#1565C0' }}>
            ℹ️ <strong>Como funciona:</strong> Você vê apenas serviços que correspondem às suas habilidades cadastradas. 
            Aceite os serviços que você pode realizar!
          </div>
        </Card>

        {/* Lista de Serviços Disponíveis */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>💼 Serviços Disponíveis</CardHeader>
          {pendingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>😊</div>
              <p style={{ color: 'var(--gray)', marginBottom: '8px' }}>
                Nenhum serviço disponível no momento
              </p>
              <p style={{ fontSize: '13px', color: 'var(--gray)' }}>
                Novos serviços aparecerão aqui quando clientes solicitarem serviços que correspondem às suas habilidades
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingBookings.map(booking => (
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
                          📅 Solicitado em: {new Date(booking.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '12px' }}>
                        Nova
                      </span>
                    </div>

                    <div style={{ 
                      background: '#C8E6C9', 
                      padding: '10px', 
                      borderRadius: '6px',
                      marginBottom: '12px',
                      fontSize: '13px',
                      color: '#2E7D32'
                    }}>
                      ✨ Este serviço corresponde às suas habilidades!
                    </div>

                    <button
                      className="btn btn-primary btn-full"
                      onClick={() => handleViewDetails(booking)}
                      style={{ fontSize: '14px' }}
                    >
                      👁️ Ver Detalhes e Aceitar
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Detalhes */}
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
            <CardHeader>📋 Detalhes do Serviço</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#333' }}>
                {selectedBooking.serviceName}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#666' }}>Categoria:</span>
                  {' '}<span style={{ color: '#333' }}>{selectedBooking.serviceCategory}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#666' }}>Solicitado em:</span>
                  {' '}<span style={{ color: '#333' }}>{new Date(selectedBooking.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#666' }}>Status:</span>
                  {' '}<span className="badge badge-warning">Aguardando aceitação</span>
                </div>
              </div>
            </div>

            <div style={{ 
              background: '#FFF9C4', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#F57F17'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                ⚠️ Importante:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Aceite apenas se puder realizar o serviço</li>
                <li>Entre em contato com o cliente após aceitar</li>
                <li>Mantenha a qualidade do seu trabalho</li>
                <li>Seu rating será atualizado após conclusão</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => handleAcceptBooking(selectedBooking)}
                style={{ flex: 1 }}
              >
                ✅ Aceitar Serviço
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedBooking(null);
                }}
                style={{ flex: 1 }}
              >
                ❌ Voltar
              </button>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default JovemServicos;
