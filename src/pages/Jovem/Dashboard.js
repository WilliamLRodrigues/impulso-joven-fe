import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { jovemService, serviceService, bookingService } from '../../services';
import { getImageUrl } from '../../utils/imageUtils';

const JovemDashboard = () => {
  const { user } = useAuth();
  const [jovemData, setJovemData] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Atualizar automaticamente a cada 10 segundos (silencioso)
    const interval = setInterval(() => {
      loadData(true); // true = atualização silenciosa
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    try {
      const jovemResponse = await jovemService.getById(user.id);
      setJovemData(jovemResponse.data);

      const servicesResponse = await serviceService.getAll({ status: 'available' });
      setAvailableServices(servicesResponse.data.slice(0, 3));

      const myServicesResponse = await serviceService.getAll({ jovemId: user.id });
      setMyServices(myServicesResponse.data);
      
      const bookingsResponse = await bookingService.getAll({ jovemId: user.id });
      setBookings(bookingsResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAcceptService = async (serviceId) => {
    try {
      await serviceService.accept(serviceId, user.id);
      loadData();
      alert('Serviço aceito com sucesso!');
    } catch (error) {
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
      <Header title="Dashboard Jovem" />
      
      <div className="container">
        {/* Perfil com Foto */}
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {jovemData?.photo ? (
              <img 
                src={getImageUrl(jovemData.photo)}
                alt={user.name}
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '3px solid var(--primary-blue)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                }}
              />
            ) : (
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--light-gray)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                border: '3px solid #ddd'
              }}>
                👤
              </div>
            )}
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{user.name}</h3>
              <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                {jovemData?.availability ? '✅ Disponível para trabalhar' : '❌ Indisponível'}
              </div>
            </div>
          </div>
          
          {jovemData?.description && (
            <div style={{ 
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#F5F5F5',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#333',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#666' }}>
                📝 Sua Descrição:
              </div>
              {jovemData.description}
            </div>
          )}
        </Card>

        {/* Estatísticas */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Olá, {user.name}!
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>
                  {jovemData?.stats?.completedServices || 0}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Serviços</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>
                  ⭐ {jovemData?.stats?.rating?.toFixed(1) || '0.0'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Avaliação</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>
                  {jovemData?.stats?.points || 0}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Pontos</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de Ganhos */}
        <Card style={{ marginTop: '20px', background: '#E8F5E9', border: '3px solid #4CAF50' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#2E7D32', marginBottom: '8px', fontWeight: '600' }}>
              💰 Total de Ganhos
            </div>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#1B5E20', marginBottom: '8px' }}>
              R$ {(jovemData?.stats?.totalEarnings || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '13px', color: '#2E7D32' }}>
              {bookings.filter(b => b.status === 'completed').length} serviços pagos
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Status</div>
              <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                {jovemData?.availability ? 'Disponível para trabalhar' : 'Indisponível'}
              </div>
            </div>
            <span className={`badge ${jovemData?.availability ? 'badge-success' : 'badge-danger'}`}>
              {jovemData?.availability ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </Card>

        {/* Serviços Disponíveis */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>💼 Serviços Disponíveis</CardHeader>
          {availableServices.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhum serviço disponível no momento
            </p>
          ) : (
            <div>
              {availableServices.map((service) => (
                <div 
                  key={service.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--light-gray)',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    {service.title}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '8px' }}>
                    {service.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary-green)', fontWeight: '600' }}>
                      R$ {service.price || '50,00'}
                    </span>
                    <button 
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                      onClick={() => handleAcceptService(service.id)}
                    >
                      Aceitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Meus Serviços Ativos */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📋 Meus Serviços</CardHeader>
          {myServices.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Você não tem serviços ativos
            </p>
          ) : (
            <div>
              {myServices.slice(0, 3).map((service) => (
                <div 
                  key={service.id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--light-gray)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                      {service.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                      {new Date(service.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span className={`badge badge-${service.status === 'completed' ? 'success' : 'info'}`}>
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Skills */}
        {jovemData?.skills && jovemData.skills.length > 0 && (
          <Card style={{ marginTop: '20px' }}>
            <CardHeader>🎯 Minhas Habilidades</CardHeader>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {jovemData.skills.map((skill, index) => (
                <span key={index} className="badge badge-info">
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default JovemDashboard;
