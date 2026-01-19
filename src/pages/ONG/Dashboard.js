import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { ongService, jovemService, bookingService, reviewService } from '../../services';
import api from '../../services/api';

const ONGDashboard = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [ongData, setOngData] = useState(null);
  const [jovens, setJovens] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [selectedJovemFilter, setSelectedJovemFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Estados para edição de perfil
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    state: '',
    city: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.get(`/auth/user/${user.id}`);
      const userData = response.data;
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        state: userData.state || '',
        city: userData.city || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleOpenEditModal = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordFields(false);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Validar senha se estiver tentando alterar
      if (showPasswordFields) {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
          alert('Preencha todos os campos de senha');
          setSaving(false);
          return;
        }
        
        if (passwordData.newPassword.length < 6) {
          alert('A nova senha deve ter pelo menos 6 caracteres');
          setSaving(false);
          return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert('As senhas não coincidem');
          setSaving(false);
          return;
        }
      }
      
      // Atualizar perfil
      await api.put(`/auth/user/${user.id}`, profileData);
      
      // Atualizar senha se necessário
      if (showPasswordFields && passwordData.currentPassword) {
        try {
          await api.put('/auth/change-password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          });
          alert('Perfil e senha atualizados com sucesso!');
        } catch (passwordError) {
          alert('Perfil atualizado, mas erro ao alterar senha: ' + (passwordError.response?.data?.error || passwordError.message));
          setSaving(false);
          return;
        }
      } else {
        alert('Perfil atualizado com sucesso!');
      }
      
      // Atualizar contexto do usuário
      setUser({ ...user, ...profileData });
      
      // Atualizar dados da ONG no estado
      setOngData({ ...ongData, ...profileData });
      
      // Resetar campos de senha
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordFields(false);
      setShowEditModal(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Estados brasileiros
  const estadosBrasileiros = [
    { uf: 'AC', nome: 'Acre' },
    { uf: 'AL', nome: 'Alagoas' },
    { uf: 'AP', nome: 'Amapá' },
    { uf: 'AM', nome: 'Amazonas' },
    { uf: 'BA', nome: 'Bahia' },
    { uf: 'CE', nome: 'Ceará' },
    { uf: 'DF', nome: 'Distrito Federal' },
    { uf: 'ES', nome: 'Espírito Santo' },
    { uf: 'GO', nome: 'Goiás' },
    { uf: 'MA', nome: 'Maranhão' },
    { uf: 'MT', nome: 'Mato Grosso' },
    { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MG', nome: 'Minas Gerais' },
    { uf: 'PA', nome: 'Pará' },
    { uf: 'PB', nome: 'Paraíba' },
    { uf: 'PR', nome: 'Paraná' },
    { uf: 'PE', nome: 'Pernambuco' },
    { uf: 'PI', nome: 'Piauí' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'RN', nome: 'Rio Grande do Norte' },
    { uf: 'RS', nome: 'Rio Grande do Sul' },
    { uf: 'RO', nome: 'Rondônia' },
    { uf: 'RR', nome: 'Roraima' },
    { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SP', nome: 'São Paulo' },
    { uf: 'SE', nome: 'Sergipe' },
    { uf: 'TO', nome: 'Tocantins' }
  ];

  const loadData = async () => {
    try {
      const [ongResponse, jovensResponse, bookingsResponse, reviewsResponse] = await Promise.all([
        ongService.getById(user.id),
        jovemService.getAll(user.id),
        bookingService.getAll({}),
        reviewService.getAll({})
      ]);

      setOngData(ongResponse.data);
      const jovensData = jovensResponse.data;
      setJovens(jovensData);
      
      const jovensIds = jovensData.map(j => j.id);
      const ongBookings = bookingsResponse.data.filter(b => jovensIds.includes(b.jovemId));
      setBookings(ongBookings);

      const ongReviews = reviewsResponse.data.filter(r => jovensIds.includes(r.jovemId));
      setReviews(ongReviews);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByPeriod = (items, dateField = 'createdAt') => {
    if (periodFilter === 'all' && !startDate && !endDate) return items;
    
    const now = new Date();
    const filtered = items.filter(item => {
      const itemDate = new Date(item[dateField]);
      
      // Filtro por período personalizado
      if (periodFilter === 'custom' && (startDate || endDate)) {
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          return itemDate >= start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return itemDate <= end;
        }
      }
      
      // Filtros predefinidos
      if (periodFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      }
      if (periodFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      }
      return true;
    });
    return filtered;
  };

  const getGeneralStats = () => {
    const filteredBookings = filterByPeriod(bookings);
    const filteredReviews = filterByPeriod(reviews);
    const completedBookings = filteredBookings.filter(b => b.status === 'completed');
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    return {
      totalJovens: jovens.length,
      activeJovens: jovens.filter(j => j.availability).length,
      totalBookings: filteredBookings.length,
      completedServices: completedBookings.length,
      inProgressServices: filteredBookings.filter(b => b.status === 'in_progress' || b.status === 'checked_in').length,
      cancelledServices: filteredBookings.filter(b => b.status === 'cancelled').length,
      averageRating: filteredReviews.length > 0 
        ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length).toFixed(1)
        : '0.0',
      totalReviews: filteredReviews.length,
      totalEarnings: totalEarnings,
      averageEarningsPerService: completedBookings.length > 0 ? (totalEarnings / completedBookings.length).toFixed(2) : '0.00'
    };
  };

  const getRankings = () => {
    const filteredBookings = filterByPeriod(bookings);
    const filteredReviews = filterByPeriod(reviews);

    const jovemStats = jovens.map(jovem => {
      const jovemBookings = filteredBookings.filter(b => b.jovemId === jovem.id);
      const jovemReviews = filteredReviews.filter(r => r.jovemId === jovem.id);
      const completedBookings = jovemBookings.filter(b => b.status === 'completed');
      const completed = completedBookings.length;
      const cancelled = jovemBookings.filter(b => b.status === 'cancelled').length;
      const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
      const avgRating = jovemReviews.length > 0
        ? jovemReviews.reduce((sum, r) => sum + r.rating, 0) / jovemReviews.length
        : 0;

      return {
        ...jovem,
        completedCount: completed,
        cancelledCount: cancelled,
        totalBookings: jovemBookings.length,
        reviewCount: jovemReviews.length,
        averageRating: avgRating,
        completionRate: jovemBookings.length > 0 ? (completed / jovemBookings.length) * 100 : 0,
        totalEarnings: totalEarnings,
        averageEarningsPerService: completed > 0 ? totalEarnings / completed : 0
      };
    });

    return {
      byCompletedServices: [...jovemStats].sort((a, b) => b.completedCount - a.completedCount).slice(0, 10),
      byRating: [...jovemStats].filter(j => j.reviewCount > 0).sort((a, b) => b.averageRating - a.averageRating).slice(0, 10),
      byCancellations: [...jovemStats].filter(j => j.cancelledCount > 0).sort((a, b) => b.cancelledCount - a.cancelledCount).slice(0, 10),
      byCompletionRate: [...jovemStats].filter(j => j.totalBookings >= 3).sort((a, b) => b.completionRate - a.completionRate).slice(0, 10),
      byEarnings: [...jovemStats].filter(j => j.totalEarnings > 0).sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 10)
    };
  };

  const getRecentReviews = () => {
    return reviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
  };

  const getServicesChart = () => {
    const stats = getGeneralStats();
    return [
      { label: 'Concluídos', value: stats.completedServices, color: '#4CAF50' },
      { label: 'Em Andamento', value: stats.inProgressServices, color: '#4FC3F7' },
      { label: 'Cancelados', value: stats.cancelledServices, color: '#EF5350' }
    ];
  };

  const exportToCSV = () => {
    const rankings = getRankings();
    const stats = getGeneralStats();
    const filteredBookings = filterByPeriod(bookings);
    const filteredReviews = filterByPeriod(reviews);
    
    // Criar cabeçalhos
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Adicionar informações do período
    csvContent += `Relatório ONG - ${ongData?.name || user.name}\n`;
    csvContent += `Data de Geração: ${new Date().toLocaleDateString('pt-BR')}\n`;
    csvContent += `Período: ${periodFilter === 'week' ? 'Última Semana' : periodFilter === 'month' ? 'Último Mês' : periodFilter === 'custom' ? `${startDate || 'Início'} até ${endDate || 'Hoje'}` : 'Todo Período'}\n\n`;
    
    // Estatísticas Gerais
    csvContent += 'ESTATÍSTICAS GERAIS\n';
    csvContent += 'Métrica,Valor\n';
    csvContent += `Total de Jovens,${stats.totalJovens}\n`;
    csvContent += `Jovens Ativos,${stats.activeJovens}\n`;
    csvContent += `Total de Serviços,${stats.totalBookings}\n`;
    csvContent += `Serviços Concluídos,${stats.completedServices}\n`;
    csvContent += `Serviços em Andamento,${stats.inProgressServices}\n`;
    csvContent += `Serviços Cancelados,${stats.cancelledServices}\n`;
    csvContent += `Avaliação Média,${stats.averageRating}\n`;
    csvContent += `Total de Avaliações,${stats.totalReviews}\n`;
    csvContent += `Ganho Total,R$ ${stats.totalEarnings.toFixed(2)}\n`;
    csvContent += `Média por Serviço,R$ ${stats.averageEarningsPerService}\n\n`;
    
    // Ranking por Serviços Concluídos
    csvContent += 'RANKING - SERVIÇOS CONCLUÍDOS\n';
    csvContent += 'Posição,Nome,Serviços Concluídos,Avaliação Média,Ganho Total\n';
    rankings.byCompletedServices.forEach((jovem, index) => {
      csvContent += `${index + 1},${jovem.name},${jovem.completedCount},${jovem.averageRating.toFixed(1)},R$ ${jovem.totalEarnings.toFixed(2)}\n`;
    });
    csvContent += '\n';
    
    // Ranking por Avaliações
    csvContent += 'RANKING - MELHORES AVALIAÇÕES\n';
    csvContent += 'Posição,Nome,Avaliação Média,Número de Avaliações,Serviços Concluídos\n';
    rankings.byRating.forEach((jovem, index) => {
      csvContent += `${index + 1},${jovem.name},${jovem.averageRating.toFixed(1)},${jovem.reviewCount},${jovem.completedCount}\n`;
    });
    csvContent += '\n';
    
    // Ranking por Ganhos
    if (rankings.byEarnings.length > 0) {
      csvContent += 'RANKING - MAIORES GANHOS\n';
      csvContent += 'Posição,Nome,Ganho Total,Serviços Concluídos,Média por Serviço\n';
      rankings.byEarnings.forEach((jovem, index) => {
        csvContent += `${index + 1},${jovem.name},R$ ${jovem.totalEarnings.toFixed(2)},${jovem.completedCount},R$ ${jovem.averageEarningsPerService.toFixed(2)}\n`;
      });
      csvContent += '\n';
    }
    
    // Detalhamento por Jovem
    csvContent += 'DETALHAMENTO POR JOVEM\n';
    csvContent += 'Nome,Total Serviços,Concluídos,Em Andamento,Cancelados,Taxa Conclusão,Avaliação Média,Num. Avaliações,Ganho Total,Média por Serviço\n';
    jovens.forEach(jovem => {
      const jovemBookings = filteredBookings.filter(b => b.jovemId === jovem.id);
      const completed = jovemBookings.filter(b => b.status === 'completed').length;
      const inProgress = jovemBookings.filter(b => b.status === 'in_progress' || b.status === 'checked_in').length;
      const cancelled = jovemBookings.filter(b => b.status === 'cancelled').length;
      const jovemReviews = filteredReviews.filter(r => r.jovemId === jovem.id);
      const avgRating = jovemReviews.length > 0 ? (jovemReviews.reduce((sum, r) => sum + r.rating, 0) / jovemReviews.length).toFixed(1) : '0.0';
      const completionRate = jovemBookings.length > 0 ? ((completed / jovemBookings.length) * 100).toFixed(1) : '0.0';
      const totalEarnings = jovemBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
      const avgEarnings = completed > 0 ? (totalEarnings / completed).toFixed(2) : '0.00';
      
      csvContent += `${jovem.name},${jovemBookings.length},${completed},${inProgress},${cancelled},${completionRate}%,${avgRating},${jovemReviews.length},R$ ${totalEarnings.toFixed(2)},R$ ${avgEarnings}\n`;
    });
    
    // Criar e baixar arquivo
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `relatorio-ong-${periodFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = getGeneralStats();
  const rankings = getRankings();
  const recentReviews = getRecentReviews();
  const servicesChart = getServicesChart();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header title="Dashboard Analytics" />
      
      <div className="container">
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              {ongData?.name || user.name}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Painel de Análise e Desempenho
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.totalJovens}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Jovens</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.completedServices}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Concluídos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>⭐ {stats.averageRating}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Média Geral</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>💰 R$ {stats.totalEarnings.toFixed(2)}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Ganho Total</div>
            </div>
          </div>
        </Card>

        <Card style={{ marginTop: '20px', padding: '16px' }}>
          <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
            Filtrar Período:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {['week', 'month', 'custom', 'all'].map(period => (
              <button
                key={period}
                onClick={() => {
                  setPeriodFilter(period);
                  if (period !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                style={{
                  padding: '8px',
                  border: periodFilter === period ? '2px solid #4FC3F7' : '1px solid #ddd',
                  borderRadius: '8px',
                  background: periodFilter === period ? '#E3F2FD' : 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: periodFilter === period ? '600' : '400'
                }}
              >
                📅 {period === 'week' ? 'Semana' : period === 'month' ? 'Mês' : period === 'custom' ? 'Personalizado' : 'Tudo'}
              </button>
            ))}
          </div>

          {periodFilter === 'custom' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
                    📅 Data Início:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || undefined}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
                    📅 Data Fim:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
              {(startDate || endDate) && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#4CAF50', fontWeight: '600' }}>
                  ✓ Período: {startDate || 'Início'} até {endDate || 'Hoje'}
                </div>
              )}
            </div>
          )}

          <button
            onClick={exportToCSV}
            style={{
              width: '100%',
              padding: '10px',
              background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📊 Exportar Relatório em CSV
          </button>

          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Visualização:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { id: 'overview', label: '📊 Visão Geral' },
              { id: 'rankings', label: '🏆 Rankings' },
              { id: 'reviews', label: '💬 Avaliações' },
              { id: 'performance', label: '📈 Performance' },
              { id: 'profile', label: '👤 Perfil' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                style={{
                  padding: '10px',
                  border: activeView === view.id ? '2px solid #66BB6A' : '1px solid #ddd',
                  borderRadius: '8px',
                  background: activeView === view.id ? '#E8F5E9' : 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeView === view.id ? '600' : '400'
                }}
              >
                {view.label}
              </button>
            ))}
          </div>
        </Card>

        {activeView === 'overview' && (
          <>
            <Card style={{ marginTop: '20px' }}>
              <CardHeader>📊 Distribuição de Serviços</CardHeader>
              <div style={{ padding: '20px' }}>
                {servicesChart.map((item, index) => {
                  const total = servicesChart.reduce((sum, i) => sum + i.value, 0);
                  const percentage = total > 0 ? (item.value / total) * 100 : 0;
                  
                  return (
                    <div key={index} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.label}</span>
                        <span style={{ fontSize: '14px', color: '#666' }}>{item.value} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div style={{ background: '#f5f5f5', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: item.color,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>⭐ Top 5 Jovens - Serviços Concluídos</CardHeader>
              {rankings.byCompletedServices.slice(0, 5).map((jovem, index) => (
                <div 
                  key={jovem.id}
                  style={{
                    padding: '16px',
                    borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#E3F2FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px',
                    color: index < 3 ? 'white' : '#1976D2'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {jovem.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      ⭐ {jovem.averageRating.toFixed(1)} • {jovem.completedCount} concluídos
                    </div>
                    <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '600', marginTop: '2px' }}>
                      💰 R$ {jovem.totalEarnings.toFixed(2)}
                    </div>
                  </div>
                  {index < 3 && (
                    <div style={{ fontSize: '24px' }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
              ))}
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>🚀 Ações Rápidas</CardHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn btn-primary btn-full"
                  onClick={() => navigate('/ong/jovens')}
                >
                  ➕ Cadastrar Novo Jovem
                </button>
                <button 
                  className="btn btn-secondary btn-full"
                  onClick={() => navigate('/ong/servicos')}
                >
                  💼 Gerenciar Serviços
                </button>
              </div>
            </Card>
          </>
        )}

        {activeView === 'rankings' && (
          <>
            <Card style={{ marginTop: '20px' }}>
              <CardHeader>🏆 Ranking - Mais Serviços Concluídos</CardHeader>
              {rankings.byCompletedServices.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Nenhum dado disponível
                </div>
              ) : (
                rankings.byCompletedServices.map((jovem, index) => (
                  <div 
                    key={jovem.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: index < rankings.byCompletedServices.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: index < 3 ? '#FFFEF0' : 'white'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#E0E0E0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px' }}>
                        {jovem.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {jovem.completedCount} serviços • ⭐ {jovem.averageRating.toFixed(1)}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '700',
                      color: '#4CAF50',
                      flexShrink: 0
                    }}>
                      {jovem.completedCount}
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>⭐ Ranking - Melhores Avaliações</CardHeader>
              {rankings.byRating.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Nenhuma avaliação disponível
                </div>
              ) : (
                rankings.byRating.map((jovem, index) => (
                  <div 
                    key={jovem.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: index < rankings.byRating.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: index < 3 ? '#FFF9E6' : 'white'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#E0E0E0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px' }}>
                        {jovem.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {jovem.reviewCount} avaliações • {jovem.completedCount} serviços
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      color: '#FFA726',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ⭐ {jovem.averageRating.toFixed(1)}
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>📊 Ranking - Taxa de Conclusão</CardHeader>
              {rankings.byCompletionRate.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Dados insuficientes (mínimo 3 serviços)
                </div>
              ) : (
                rankings.byCompletionRate.map((jovem, index) => (
                  <div 
                    key={jovem.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: index < rankings.byCompletionRate.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: index < 3 ? '#4CAF50' : '#E0E0E0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px' }}>
                        {jovem.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {jovem.completedCount}/{jovem.totalBookings} serviços
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      color: '#4CAF50',
                      flexShrink: 0
                    }}>
                      {jovem.completionRate.toFixed(0)}%
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>💰 Ranking - Maiores Ganhos Financeiros</CardHeader>
              {rankings.byEarnings.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Nenhum ganho registrado
                </div>
              ) : (
                rankings.byEarnings.map((jovem, index) => (
                  <div 
                    key={jovem.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: index < rankings.byEarnings.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: index < 3 ? '#E8F5E9' : 'white'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#E0E0E0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px' }}>
                        {jovem.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {jovem.completedCount} serviços • R$ {jovem.averageEarningsPerService.toFixed(2)}/serviço
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      color: '#4CAF50',
                      flexShrink: 0
                    }}>
                      R$ {jovem.totalEarnings.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </Card>

            {rankings.byCancellations.length > 0 && (
              <Card style={{ marginTop: '20px' }}>
                <CardHeader>⚠️ Ranking - Mais Cancelamentos</CardHeader>
                {rankings.byCancellations.map((jovem, index) => (
                  <div 
                    key={jovem.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: index < rankings.byCancellations.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: index < 3 ? '#FFEBEE' : 'white'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#EF5350',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px' }}>
                        {jovem.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {jovem.totalBookings} total • {jovem.completedCount} concluídos
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      color: '#EF5350',
                      flexShrink: 0
                    }}>
                      {jovem.cancelledCount}
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        {activeView === 'reviews' && (
          <Card style={{ marginTop: '20px' }}>
            <CardHeader>💬 Avaliações Recentes dos Clientes</CardHeader>
            {recentReviews.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <p>Nenhuma avaliação ainda</p>
              </div>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {recentReviews.map((review, index) => {
                  const jovem = jovens.find(j => j.id === review.jovemId);
                  return (
                    <div 
                      key={review.id}
                      style={{
                        padding: '16px',
                        borderBottom: index < recentReviews.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                            {jovem?.name || 'Jovem'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                            Cliente: {review.clientName || 'Anônimo'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span 
                              key={star}
                              style={{ 
                                fontSize: '16px',
                                color: star <= review.rating ? '#FFA726' : '#E0E0E0'
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <div style={{ 
                          background: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          color: '#555',
                          marginBottom: '8px'
                        }}>
                          "{review.comment}"
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(review.createdAt).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {activeView === 'performance' && (
          <>
            <Card style={{ marginTop: '20px' }}>
              <CardHeader>📈 Estatísticas Detalhadas</CardHeader>
              <div style={{ padding: '16px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#E8F5E9', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#2E7D32' }}>
                      {stats.completedServices}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                      Serviços Concluídos
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#E3F2FD', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#1976D2' }}>
                      {stats.inProgressServices}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                      Em Andamento
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#FFF3E0', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#E65100' }}>
                      ⭐ {stats.averageRating}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                      Avaliação Média
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#FFEBEE', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#C62828' }}>
                      {stats.cancelledServices}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                      Cancelados
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '16px',
                  marginTop: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#E8F5E9', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#2E7D32' }}>
                      💰 R$ {stats.totalEarnings.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                      Ganho Total
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#F1F8E9', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#558B2F' }}>
                      R$ {stats.averageEarningsPerService}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                      Média por Serviço
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                    Taxa de Conclusão Geral
                  </div>
                  <div style={{ background: '#f5f5f5', height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.totalBookings > 0 ? (stats.completedServices / stats.totalBookings) * 100 : 0}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {stats.totalBookings > 0 
                        ? Math.round((stats.completedServices / stats.totalBookings) * 100) 
                        : 0}%
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                    Jovens Ativos
                  </div>
                  <div style={{ background: '#f5f5f5', height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.totalJovens > 0 ? (stats.activeJovens / stats.totalJovens) * 100 : 0}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #4FC3F7 0%, #66BB6A 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {stats.activeJovens}/{stats.totalJovens}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>👤 Performance Individual dos Jovens</CardHeader>
              <div style={{ padding: '16px' }}>
                <select
                  value={selectedJovemFilter}
                  onChange={(e) => setSelectedJovemFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '16px'
                  }}
                >
                  <option value="all">📊 Resumo de Todos</option>
                  {jovens.map(jovem => (
                    <option key={jovem.id} value={jovem.id}>{jovem.name}</option>
                  ))}
                </select>

                {selectedJovemFilter === 'all' ? (
                  <div>
                    {jovens.map((jovem) => {
                      const jovemBookings = bookings.filter(b => b.jovemId === jovem.id);
                      const completed = jovemBookings.filter(b => b.status === 'completed').length;
                      const cancelled = jovemBookings.filter(b => b.status === 'cancelled').length;
                      const jovemReviews = reviews.filter(r => r.jovemId === jovem.id);
                      const avgRating = jovemReviews.length > 0
                        ? (jovemReviews.reduce((sum, r) => sum + r.rating, 0) / jovemReviews.length).toFixed(1)
                        : '0.0';

                      return (
                        <div 
                          key={jovem.id}
                          style={{
                            padding: '16px',
                            borderBottom: '1px solid #f0f0f0',
                            marginBottom: '12px',
                            background: '#fafafa',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '12px' }}>
                            {jovem.name}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                Concluídos
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#4CAF50' }}>
                                {completed}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                Avaliação
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#FFA726' }}>
                                ⭐ {avgRating}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                Total Serviços
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1976D2' }}>
                                {jovemBookings.length}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                Cancelados
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#EF5350' }}>
                                {cancelled}
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop: '12px', padding: '12px', background: '#E8F5E9', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#2E7D32', marginBottom: '4px', fontWeight: '600' }}>
                              💰 Ganho Total
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#2E7D32' }}>
                              R$ {jovemBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.finalPrice || 0), 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  (() => {
                    const selectedJovem = jovens.find(j => j.id === selectedJovemFilter);
                    if (!selectedJovem) return null;

                    const jovemBookings = bookings.filter(b => b.jovemId === selectedJovem.id);
                    const completed = jovemBookings.filter(b => b.status === 'completed').length;
                    const inProgress = jovemBookings.filter(b => b.status === 'in_progress' || b.status === 'checked_in').length;
                    const cancelled = jovemBookings.filter(b => b.status === 'cancelled').length;
                    const jovemReviews = reviews.filter(r => r.jovemId === selectedJovem.id);
                    const avgRating = jovemReviews.length > 0
                      ? (jovemReviews.reduce((sum, r) => sum + r.rating, 0) / jovemReviews.length).toFixed(1)
                      : '0.0';

                    return (
                      <div>
                        <div style={{ 
                          background: '#f5f5f5',
                          padding: '20px',
                          borderRadius: '12px',
                          marginBottom: '20px'
                        }}>
                          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                            {selectedJovem.name}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#4CAF50' }}>
                                {completed}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                Concluídos
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#4FC3F7' }}>
                                {inProgress}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                Em Andamento
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFA726' }}>
                                ⭐ {avgRating}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                Avaliação ({jovemReviews.length})
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#EF5350' }}>
                                {cancelled}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                Cancelados
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#E8F5E9', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2E7D32' }}>
                                💰 R$ {jovemBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.finalPrice || 0), 0).toFixed(2)}
                              </div>
                              <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '4px', fontWeight: '600' }}>
                                Ganho Total
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#F1F8E9', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#558B2F' }}>
                                R$ {completed > 0 ? (jovemBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.finalPrice || 0), 0) / completed).toFixed(2) : '0.00'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#558B2F', marginTop: '4px', fontWeight: '600' }}>
                                Média por Serviço
                              </div>
                            </div>
                          </div>
                        </div>

                        {jovemReviews.length > 0 && (
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                              💬 Avaliações Recebidas:
                            </div>
                            {jovemReviews.slice(0, 5).map((review) => (
                              <div 
                                key={review.id}
                                style={{
                                  padding: '12px',
                                  background: '#f9f9f9',
                                  borderRadius: '8px',
                                  marginBottom: '12px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '13px', color: '#666' }}>
                                    {review.clientName || 'Cliente'}
                                  </span>
                                  <div style={{ display: 'flex', gap: '2px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <span 
                                        key={star}
                                        style={{ 
                                          fontSize: '14px',
                                          color: star <= review.rating ? '#FFA726' : '#E0E0E0'
                                        }}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                {review.comment && (
                                  <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.5' }}>
                                    "{review.comment}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </Card>
          </>
        )}

        {activeView === 'profile' && ongData && (
          <Card style={{ marginTop: '20px' }}>
            <CardHeader>👤 Perfil da ONG</CardHeader>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
                  {ongData.name}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  📧 {ongData.email}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  📞 {ongData.phone || 'Não informado'}
                </div>
                {ongData.city && ongData.state && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    📍 {ongData.city}, {ongData.state}
                  </div>
                )}
                {ongData.address && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    🏠 {ongData.address}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleOpenEditModal}
                style={{
                  background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
                  color: 'white',
                  border: 'none'
                }}
              >
                ✏️ Editar Perfil
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Modal de Edição de Perfil */}
      {showEditModal && (
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
          zIndex: 9999,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}>
            <CardHeader>✏️ Editar Perfil da ONG</CardHeader>
            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Nome da ONG *
                </label>
                <input
                  type="text"
                  className="input"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                  placeholder="Nome completo da ONG"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Email *
                </label>
                <input
                  type="email"
                  className="input"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                  placeholder="email@ong.org.br"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Telefone *
                </label>
                <input
                  type="tel"
                  className="input"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  required
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Endereço
                </label>
                <textarea
                  className="input"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  rows="2"
                  placeholder="Rua, número, bairro"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Estado *
                  </label>
                  <select
                    className="input"
                    value={profileData.state}
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    required
                    style={{ padding: '10px' }}
                  >
                    <option value="">Selecione</option>
                    {estadosBrasileiros.map(estado => (
                      <option key={estado.uf} value={estado.uf}>
                        {estado.nome} ({estado.uf})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Cidade *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    required
                    placeholder="Nome da cidade"
                  />
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '16px' }}>
                ℹ️ Seus jovens poderão atender clientes na sua região
              </div>

              {/* Seção de Alteração de Senha */}
              <div style={{ 
                borderTop: '2px solid #f0f0f0', 
                paddingTop: '16px', 
                marginTop: '16px',
                marginBottom: '16px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4CAF50',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 0',
                    width: '100%',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>🔒 Alterar Senha</span>
                  <span>{showPasswordFields ? '▲' : '▼'}</span>
                </button>

                {showPasswordFields && (
                  <div style={{ marginTop: '16px', paddingLeft: '8px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Senha Atual *
                      </label>
                      <input
                        type="password"
                        className="input"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Digite sua senha atual"
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Nova Senha * (mínimo 6 caracteres)
                      </label>
                      <input
                        type="password"
                        className="input"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Digite a nova senha"
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Confirmar Nova Senha *
                      </label>
                      <input
                        type="password"
                        className="input"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Digite novamente a nova senha"
                      />
                      {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <div style={{ fontSize: '12px', color: '#f44336', marginTop: '4px' }}>
                          ⚠️ As senhas não coincidem
                        </div>
                      )}
                      {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                        <div style={{ fontSize: '12px', color: '#f44336', marginTop: '4px' }}>
                          ⚠️ A senha deve ter pelo menos 6 caracteres
                        </div>
                      )}
                    </div>

                    <div style={{ 
                      background: '#E8F5E9', 
                      padding: '12px', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#4CAF50'
                    }}>
                      ℹ️ <strong>Dica:</strong> Use uma senha forte com letras, números e símbolos
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)', border: 'none' }}
                  disabled={saving}
                >
                  {saving ? '💾 Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ONGDashboard;
