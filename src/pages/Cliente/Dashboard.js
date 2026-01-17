import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, serviceService } from '../../services';

const ClienteDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedServices: 0,
    pendingReviews: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const bookingsResponse = await bookingService.getAll({ clientId: user.id });
      const bookings = bookingsResponse.data;
      
      setStats({
        activeBookings: bookings.filter(b => b.status === 'in_progress').length,
        completedServices: bookings.filter(b => b.status === 'completed').length,
        pendingReviews: bookings.filter(b => b.status === 'completed' && !b.reviewed).length
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    return texts[status] || status;
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
      <Header title="Dashboard Cliente" />
      
      <div className="container">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px',
          marginTop: '20px'
        }}>
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-blue)' }}>
              {stats.activeBookings}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              Ativos
            </div>
          </Card>

          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-green)' }}>
              {stats.completedServices}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              Concluídos
            </div>
          </Card>

          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#FFA726' }}>
              {stats.pendingReviews}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
              Avaliar
            </div>
          </Card>
        </div>

        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📅 Agendamentos Recentes</CardHeader>
          {recentBookings.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhum agendamento ainda
            </p>
          ) : (
            <div>
              {recentBookings.map((booking) => (
                <div 
                  key={booking.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--light-gray)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {booking.serviceName || 'Serviço'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                      {new Date(booking.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span className={`badge ${getStatusBadge(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ marginTop: '20px' }}>
          <CardHeader>🚀 Ações Rápidas</CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-primary btn-full">
              🔍 Buscar Serviços
            </button>
            <button className="btn btn-secondary btn-full">
              📋 Ver Todos os Agendamentos
            </button>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default ClienteDashboard;
