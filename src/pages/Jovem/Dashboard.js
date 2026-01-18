import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { jovemService, serviceService, bookingService } from '../../services';
import { getImageUrl } from '../../utils/imageUtils';
import api from '../../services/api';

const JovemDashboard = () => {
  const { user } = useAuth();
  const [jovemData, setJovemData] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
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
      let jovemDataResult = jovemResponse.data;
      
      // Verificar se tem skills com IDs antigos (serviceXXX) e migrar
      const hasOldSkills = jovemDataResult.skills?.some(skill => skill.startsWith('service'));
      if (hasOldSkills) {
        try {
          const migrateResponse = await api.post(`/jovens/${user.id}/migrate-skills`);
          jovemDataResult = migrateResponse.data.jovem;
        } catch (err) {
          console.error('Erro ao migrar skills:', err);
        }
      }
      
      setJovemData(jovemDataResult);
      
      const currentSkills = jovemDataResult.skills || [];

      // Carregar TODOS os serviços do catálogo
      const servicesResponse = await serviceService.getAll({});
      const allServices = servicesResponse.data;
      
      // Filtrar serviços cujas categorias o jovem ainda NÃO tem nas skills
      const availableCategories = allServices.filter(service => 
        !currentSkills.includes(service.category)
      );
      
      // Remover duplicatas de categoria
      const uniqueCategories = [];
      const seenCategories = new Set();
      availableCategories.forEach(service => {
        if (!seenCategories.has(service.category)) {
          seenCategories.add(service.category);
          uniqueCategories.push(service);
        }
      });
      
      setAvailableServices(uniqueCategories);

      const myServicesResponse = await serviceService.getAll({ jovemId: user.id });
      setMyServices(myServicesResponse.data);
      
      const bookingsResponse = await bookingService.getAll({ jovemId: user.id });
      const allBookings = bookingsResponse.data;
      setBookings(allBookings);
      
      // Filtrar bookings pendentes (assignados mas não confirmados)
      const pending = allBookings.filter(b => 
        b.status === 'assigned' && b.jovemId === user.id
      );
      setPendingBookings(pending);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAcceptServiceCategory = async (service) => {
    try {
      await jovemService.addSkill(user.id, service.category);
      loadData();
      alert(`Categoria "${service.category}" adicionada com sucesso! Agora você pode receber solicitações deste tipo de serviço.`);
    } catch (error) {
      alert('Erro ao adicionar categoria');
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await bookingService.acceptByJovem(bookingId, user.id);
      loadData();
      alert('Serviço aceito com sucesso! PIN gerado e enviado ao cliente.');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao aceitar serviço');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = prompt('Por que você está rejeitando este serviço?');
    if (!reason) return;
    
    try {
      await bookingService.rejectByJovem(bookingId, user.id, reason);
      loadData();
      alert('Serviço rejeitado.');
    } catch (error) {
      alert('Erro ao rejeitar serviço');
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

        {/* Categorias de Serviço Disponíveis para Aceitar */}
        {availableServices.length > 0 && (
          <Card style={{ marginTop: '20px', border: '3px solid #2196F3' }}>
            <CardHeader style={{ background: '#E3F2FD', color: '#1565C0', borderRadius: '8px 8px 0 0' }}>
              💼 Categorias de Serviço Disponíveis ({availableServices.length})
            </CardHeader>
            <div style={{ padding: '4px 0' }}>
              <div style={{ 
                background: '#E3F2FD', 
                padding: '12px', 
                marginBottom: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#1565C0'
              }}>
                💡 <strong>Aceite as categorias de serviço que você sabe fazer.</strong> Depois de aceitar, clientes poderão solicitar esses tipos de serviço!
              </div>
              {availableServices.map((service) => (
                <div 
                  key={service.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #BBDEFB',
                    marginBottom: '12px',
                    background: '#F5F9FF',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px', color: '#1565C0' }}>
                    {service.category}
                  </div>
                  
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#333' }}>
                    Exemplo: {service.title}
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                    {service.description}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      💰 Valor médio: R$ {service.price?.toFixed(2)} • ⏱️ Duração: {service.duration}h
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '10px', fontSize: '15px' }}
                    onClick={() => handleAcceptServiceCategory(service)}
                  >
                    ✅ Aceitar Categoria "{service.category}"
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Serviços Atribuídos pela ONG - Aguardando Aceitação */}
        {pendingBookings.length > 0 && (
          <Card style={{ marginTop: '20px', border: '3px solid #FF9800' }}>
            <CardHeader style={{ background: '#FFF3E0', color: '#E65100', borderRadius: '8px 8px 0 0' }}>
              ⚠️ Serviços Aguardando sua Aceitação ({pendingBookings.length})
            </CardHeader>
            <div style={{ padding: '4px 0' }}>
              <div style={{ 
                background: '#FFF3E0', 
                padding: '12px', 
                marginBottom: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#E65100'
              }}>
                💡 <strong>A ONG atribuiu estes serviços para você.</strong> Aceite para confirmar que pode realizá-los!
              </div>
              {pendingBookings.map((booking) => (
                <div 
                  key={booking.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #FFE0B2',
                    marginBottom: '12px',
                    background: '#FFFBF5',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px', color: '#E65100' }}>
                    {booking.serviceName}
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                    📅 Data: {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {booking.time && ` às ${booking.time}`}
                  </div>
                  
                  {booking.clientDescription && (
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#555',
                      marginBottom: '12px',
                      padding: '8px',
                      background: 'white',
                      borderRadius: '6px',
                      border: '1px solid #FFE0B2'
                    }}>
                      📝 {booking.clientDescription}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px' }}
                      onClick={() => handleAcceptBooking(booking.id)}
                    >
                      ✅ Aceitar Serviço
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '10px' }}
                      onClick={() => handleRejectBooking(booking.id)}
                    >
                      ❌ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Meus Serviços Ativos */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📋 Serviços em Andamento</CardHeader>
          {bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress' || b.status === 'checked_in').length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhum serviço em andamento
            </p>
          ) : (
            <div>
              {bookings
                .filter(b => b.status === 'confirmed' || b.status === 'in_progress' || b.status === 'checked_in')
                .slice(0, 3)
                .map((booking) => (
                  <div 
                    key={booking.id}
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
                        {booking.serviceName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                        📅 {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <span className={`badge ${
                      booking.status === 'in_progress' ? 'badge-warning' : 
                      booking.status === 'checked_in' ? 'badge-info' : 'badge-success'
                    }`}>
                      {booking.status === 'confirmed' ? 'Confirmado' : 
                       booking.status === 'checked_in' ? 'Check-in Feito' : 
                       'Em Andamento'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Skills - Mostrar categorias de serviços */}
        {jovemData?.skills && jovemData.skills.length > 0 && (
          <Card style={{ marginTop: '20px' }}>
            <CardHeader>🎯 Minhas Habilidades de Serviço</CardHeader>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
              padding: '8px 0'
            }}>
              {jovemData.skills.map((skill, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '12px',
                    background: 'var(--gradient)',
                    color: 'white',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {skill}
                </div>
              ))}
            </div>
            <div style={{ 
              marginTop: '12px',
              padding: '12px',
              background: '#E3F2FD',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#1565C0'
            }}>
              💡 Estas são as categorias de serviços que você está habilitado a realizar
            </div>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default JovemDashboard;
