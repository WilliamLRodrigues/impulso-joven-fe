import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, reviewService } from '../../services';

const ClienteAgendamentos = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getAll({ 
        clientId: user.id,
        status: filter !== 'all' ? filter : undefined
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Deseja realmente cancelar este agendamento?')) {
      try {
        await bookingService.update(bookingId, { status: 'cancelled' });
        loadBookings();
        alert('Agendamento cancelado');
      } catch (error) {
        alert('Erro ao cancelar agendamento');
      }
    }
  };

  const handleOpenReview = (booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
    setRating(5);
    setComment('');
  };

  const handleSubmitReview = async () => {
    try {
      await reviewService.create({
        bookingId: selectedBooking.id,
        clientId: user.id,
        jovemId: selectedBooking.jovemId,
        rating,
        comment
      });
      
      await bookingService.update(selectedBooking.id, { reviewed: true });
      
      setShowReviewModal(false);
      setSelectedBooking(null);
      loadBookings();
      alert('Avaliação enviada com sucesso!');
    } catch (error) {
      alert('Erro ao enviar avaliação');
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

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    active: bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header title="Meus Agendamentos" />
      
      <div className="container">
        {/* Estatísticas */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '12px',
          marginTop: '20px'
        }}>
          <Card style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-blue)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray)' }}>Total</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFA726' }}>
              {stats.pending}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray)' }}>Pendentes</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-blue)' }}>
              {stats.active}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray)' }}>Ativos</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-green)' }}>
              {stats.completed}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray)' }}>Concluídos</div>
          </Card>
        </div>

        {/* Filtros */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '20px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('pending')}
          >
            Pendentes
          </button>
          <button
            className={`btn ${filter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('in_progress')}
          >
            Em Andamento
          </button>
          <button
            className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('completed')}
          >
            Concluídos
          </button>
        </div>

        {/* Lista de Agendamentos */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : bookings.length === 0 ? (
          <Card style={{ marginTop: '20px', textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <p style={{ color: 'var(--gray)' }}>
              Nenhum agendamento encontrado
            </p>
          </Card>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {bookings.map((booking) => (
              <Card key={booking.id} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                      {booking.serviceName || 'Serviço'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                      {new Date(booking.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(booking.createdAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <span className={`badge ${getStatusBadge(booking.status)}`} style={{ marginLeft: '12px' }}>
                    {getStatusText(booking.status)}
                  </span>
                </div>

                {booking.jovemId && (
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--gray)',
                    marginBottom: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--light-gray)'
                  }}>
                    👨‍🎓 Jovem responsável: ID {booking.jovemId}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {booking.status === 'pending' && (
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '8px', fontSize: '14px' }}
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      ❌ Cancelar
                    </button>
                  )}
                  
                  {booking.status === 'completed' && !booking.reviewed && (
                    <button 
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '14px' }}
                      onClick={() => handleOpenReview(booking)}
                    >
                      ⭐ Avaliar
                    </button>
                  )}

                  {booking.status === 'completed' && booking.reviewed && (
                    <div style={{ 
                      flex: 1, 
                      textAlign: 'center', 
                      padding: '8px',
                      color: 'var(--primary-green)',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      ✅ Avaliado
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Avaliação */}
      {showReviewModal && selectedBooking && (
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
            <CardHeader>Avaliar Serviço</CardHeader>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
                {selectedBooking.serviceName}
              </div>
              
              <div className="input-group">
                <label className="input-label">Avaliação</label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '32px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setRating(star)}
                      style={{ cursor: 'pointer', color: star <= rating ? '#FFA726' : '#E0E0E0' }}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', color: 'var(--gray)' }}>
                  {rating} {rating === 1 ? 'estrela' : 'estrelas'}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Comentário (opcional)</label>
                <textarea
                  className="input"
                  rows="4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte-nos sobre sua experiência..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedBooking(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSubmitReview}
              >
                Enviar
              </button>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ClienteAgendamentos;
