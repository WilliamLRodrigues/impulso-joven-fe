import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { serviceService, reviewService } from '../../services';

const JovemHistorico = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    avgRating: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const servicesResponse = await serviceService.getAll({ jovemId: user.id });
      const servicesData = servicesResponse.data;
      setServices(servicesData);

      const reviewsResponse = await reviewService.getAll({ jovemId: user.id });
      const reviewsData = reviewsResponse.data;
      setReviews(reviewsData);

      // Calcular estatísticas
      const completed = servicesData.filter(s => s.status === 'completed').length;
      const avgRating = reviewsData.length > 0
        ? reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length
        : 0;
      const totalEarnings = servicesData
        .filter((service) => service.status === 'completed')
        .reduce((sum, service) => sum + (service.basePrice ?? service.price ?? 0), 0);

      setStats({
        total: servicesData.length,
        completed,
        avgRating,
        totalEarnings
      });
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
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
      <Header title="Histórico" />
      
      <div className="container">
        {/* Estatísticas Gerais */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <CardHeader style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>
            📊 Minhas Estatísticas
          </CardHeader>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.total}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Total de Serviços</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.completed}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Concluídos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>⭐ {stats.avgRating.toFixed(1)}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Avaliação Média</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>R$ {stats.totalEarnings}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Ganho</div>
            </div>
          </div>
        </Card>

        {/* Histórico de Serviços */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📋 Histórico de Serviços</CardHeader>
          {services.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhum serviço no histórico
            </p>
          ) : (
            <div>
              {services.map((service) => (
                <div 
                  key={service.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--light-gray)',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '600' }}>{service.title}</div>
                    <span className={`badge badge-${service.status === 'completed' ? 'success' : 'info'}`}>
                      {service.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '4px' }}>
                    {service.description}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                    {new Date(service.createdAt).toLocaleDateString('pt-BR')} • R$ {(service.basePrice ?? service.price ?? 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Avaliações Recebidas */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>⭐ Avaliações Recebidas</CardHeader>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhuma avaliação ainda
            </p>
          ) : (
            <div>
              {reviews.map((review) => (
                <div 
                  key={review.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--light-gray)',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '600' }}>Cliente</div>
                    <div>
                      {'⭐'.repeat(review.rating)}
                      {' '}
                      <span style={{ color: 'var(--gray)', fontSize: '14px' }}>
                        ({review.rating}/5)
                      </span>
                    </div>
                  </div>
                  {review.comment && (
                    <div style={{ fontSize: '14px', color: 'var(--gray)', fontStyle: 'italic' }}>
                      "{review.comment}"
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
                    {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default JovemHistorico;
