import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { serviceService, bookingService } from '../../services';

const ClienteServicos = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const categories = ['all', 'Limpeza', 'Organização', 'Eventos', 'Tecnologia', 'Outros'];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await serviceService.getAll({ status: 'available' });
      setServices(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRequestService = (service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    try {
      await bookingService.create({
        serviceId: selectedService.id,
        clientId: user.id,
        serviceName: selectedService.title,
        status: 'pending'
      });
      setShowBookingModal(false);
      setSelectedService(null);
      alert('Solicitação enviada com sucesso!');
    } catch (error) {
      alert('Erro ao solicitar serviço');
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
      <Header title="Buscar Serviços" />
      
      <div className="container">
        {/* Barra de Busca */}
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            className="input"
            placeholder="🔍 Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categorias */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '16px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          {categories.map((category) => (
            <button
              key={category}
              className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? '📋 Todos' : category}
            </button>
          ))}
        </div>

        {/* Resultados */}
        <div style={{ marginTop: '20px' }}>
          {filteredServices.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <p style={{ color: 'var(--gray)' }}>
                Nenhum serviço encontrado
              </p>
            </Card>
          ) : (
            <>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--gray)', 
                marginBottom: '16px',
                fontWeight: '600'
              }}>
                {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''} encontrado{filteredServices.length !== 1 ? 's' : ''}
              </div>
              
              {filteredServices.map((service) => (
                <Card key={service.id} style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
                      {service.title}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '12px' }}>
                      {service.description}
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Categoria</div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {service.category || 'Geral'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Valor</div>
                        <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary-green)' }}>
                          R$ {service.price || '50,00'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Local</div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {service.location || 'A combinar'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Disponível</div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          <span className="badge badge-success">Agora</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      className="btn btn-primary btn-full"
                      onClick={() => handleRequestService(service)}
                    >
                      📞 Solicitar Serviço
                    </button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showBookingModal && selectedService && (
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
            <CardHeader>Confirmar Solicitação</CardHeader>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                {selectedService.title}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '12px' }}>
                {selectedService.description}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-green)' }}>
                R$ {selectedService.price || '50,00'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedService(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleConfirmBooking}
              >
                Confirmar
              </button>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ClienteServicos;
