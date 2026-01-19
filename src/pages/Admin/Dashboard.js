import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { adminService, ongService, jovemService, bookingService, reviewService } from '../../services';
import ProfitConfig from './ProfitConfig';
import ProfitReport from './ProfitReport';
import api from '../../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [ongs, setOngs] = useState([]);
  const [jovens, setJovens] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [selectedOngFilter, setSelectedOngFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [financialPeriod, setFinancialPeriod] = useState('month');
  const [profitMargin, setProfitMargin] = useState(0);

  useEffect(() => {
    loadData();
    loadProfitMargin();
  }, []);

  const loadData = async () => {
    try {
      const [ongsResponse, jovensResponse, bookingsResponse, reviewsResponse] = await Promise.all([
        ongService.getAll({}),
        jovemService.getAll(),
        bookingService.getAll({}),
        reviewService.getAll({})
      ]);

      setOngs(ongsResponse.data || []);
      setJovens(jovensResponse.data || []);
      setBookings(bookingsResponse.data || []);
      setReviews(reviewsResponse.data || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfitMargin = async () => {
    try {
      const response = await api.get('/admin/profit-margin');
      setProfitMargin(response.data.profitMargin || 0);
    } catch (error) {
      console.error('Erro ao carregar margem:', error);
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
      totalOngs: ongs.length,
      activeOngs: ongs.filter(o => o.active !== false).length,
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

    const ongStats = ongs.map(ong => {
      // Pegar jovens dessa ONG
      const ongJovens = jovens.filter(j => j.ongId === ong.id);
      const ongJovensIds = ongJovens.map(j => j.id);
      
      // Filtrar bookings dos jovens dessa ONG
      const ongBookings = filteredBookings.filter(b => ongJovensIds.includes(b.jovemId));
      const ongReviews = filteredReviews.filter(r => ongJovensIds.includes(r.jovemId));
      
      const completedBookings = ongBookings.filter(b => b.status === 'completed');
      const completed = completedBookings.length;
      const cancelled = ongBookings.filter(b => b.status === 'cancelled').length;
      const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
      const avgRating = ongReviews.length > 0
        ? ongReviews.reduce((sum, r) => sum + r.rating, 0) / ongReviews.length
        : 0;

      return {
        ...ong,
        jovensCount: ongJovens.length,
        activeJovensCount: ongJovens.filter(j => j.availability).length,
        completedCount: completed,
        cancelledCount: cancelled,
        totalBookings: ongBookings.length,
        reviewCount: ongReviews.length,
        averageRating: avgRating,
        completionRate: ongBookings.length > 0 ? (completed / ongBookings.length) * 100 : 0,
        totalEarnings: totalEarnings,
        averageEarningsPerService: completed > 0 ? totalEarnings / completed : 0
      };
    });

    return {
      byCompletedServices: [...ongStats].sort((a, b) => b.completedCount - a.completedCount).slice(0, 10),
      byRating: [...ongStats].filter(o => o.reviewCount > 0).sort((a, b) => b.averageRating - a.averageRating).slice(0, 10),
      byCancellations: [...ongStats].filter(o => o.cancelledCount > 0).sort((a, b) => b.cancelledCount - a.cancelledCount).slice(0, 10),
      byCompletionRate: [...ongStats].filter(o => o.totalBookings >= 3).sort((a, b) => b.completionRate - a.completionRate).slice(0, 10),
      byEarnings: [...ongStats].filter(o => o.totalEarnings > 0).sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 10),
      byJovensCount: [...ongStats].sort((a, b) => b.jovensCount - a.jovensCount).slice(0, 10)
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

  const getFinancialAnalysis = () => {
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    // Filtrar por período
    let filtered = completedBookings;
    const now = new Date();
    
    if (financialPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = completedBookings.filter(b => new Date(b.completedAt) >= weekAgo);
    } else if (financialPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = completedBookings.filter(b => new Date(b.completedAt) >= monthAgo);
    } else if (financialPeriod === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = completedBookings.filter(b => new Date(b.completedAt) >= yearAgo);
    }

    // Calcular métricas financeiras
    const totalRevenue = filtered.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const totalProfit = filtered.reduce((sum, b) => {
      const price = b.finalPrice || 0;
      const profit = (price * profitMargin) / 100;
      return sum + profit;
    }, 0);
    const totalBaseRevenue = totalRevenue - totalProfit;
    const avgProfitPerService = filtered.length > 0 ? totalProfit / filtered.length : 0;
    const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Agrupar por ONG
    const ongProfits = {};
    filtered.forEach(booking => {
      const price = booking.finalPrice || 0;
      const profit = (price * profitMargin) / 100;
      const basePrice = price - profit;
      
      if (!ongProfits[booking.ongId]) {
        const ong = ongs.find(o => o.id === booking.ongId);
        ongProfits[booking.ongId] = {
          ongId: booking.ongId,
          ongName: ong?.name || 'ONG Desconhecida',
          totalRevenue: 0,
          totalProfit: 0,
          totalBaseRevenue: 0,
          servicesCount: 0
        };
      }
      
      ongProfits[booking.ongId].totalRevenue += price;
      ongProfits[booking.ongId].totalProfit += profit;
      ongProfits[booking.ongId].totalBaseRevenue += basePrice;
      ongProfits[booking.ongId].servicesCount += 1;
    });

    // Converter para array e ordenar por lucro
    const ongProfitsArray = Object.values(ongProfits)
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .map(ong => ({
        ...ong,
        avgProfitPerService: ong.servicesCount > 0 ? ong.totalProfit / ong.servicesCount : 0,
        profitMarginPercent: ong.totalRevenue > 0 ? (ong.totalProfit / ong.totalRevenue) * 100 : 0
      }));

    // Agrupar por período temporal
    const periodsData = {};
    filtered.forEach(booking => {
      const date = new Date(booking.completedAt);
      let key;
      
      if (financialPeriod === 'week' || financialPeriod === 'month') {
        // Por dia
        key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      } else {
        // Por mês
        key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      }
      
      if (!periodsData[key]) {
        periodsData[key] = { totalRevenue: 0, totalProfit: 0, servicesCount: 0 };
      }
      
      const price = booking.finalPrice || 0;
      const profit = (price * profitMargin) / 100;
      
      periodsData[key].totalRevenue += price;
      periodsData[key].totalProfit += profit;
      periodsData[key].servicesCount += 1;
    });

    // Converter periods para array ordenado
    const periodsArray = Object.entries(periodsData)
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => {
        // Tentar fazer sort por data
        const dateA = new Date(a.period);
        const dateB = new Date(b.period);
        return dateA - dateB;
      });

    return {
      totalRevenue,
      totalProfit,
      totalBaseRevenue,
      avgProfitPerService,
      profitMarginPercent,
      servicesCount: filtered.length,
      ongProfits: ongProfitsArray,
      periodsData: periodsArray
    };
  };

  const exportToCSV = () => {
    const rankings = getRankings();
    const stats = getGeneralStats();
    const filteredBookings = filterByPeriod(bookings);
    const filteredReviews = filterByPeriod(reviews);
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    csvContent += `Relatório Admin - Plataforma Impulso Jovem\n`;
    csvContent += `Data de Geração: ${new Date().toLocaleDateString('pt-BR')}\n`;
    csvContent += `Período: ${periodFilter === 'week' ? 'Última Semana' : periodFilter === 'month' ? 'Último Mês' : periodFilter === 'custom' ? `${startDate || 'Início'} até ${endDate || 'Hoje'}` : 'Todo Período'}\n\n`;
    
    csvContent += 'ESTATÍSTICAS GERAIS DA PLATAFORMA\n';
    csvContent += 'Métrica,Valor\n';
    csvContent += `Total de ONGs,${stats.totalOngs}\n`;
    csvContent += `ONGs Ativas,${stats.activeOngs}\n`;
    csvContent += `Total de Jovens,${stats.totalJovens}\n`;
    csvContent += `Jovens Ativos,${stats.activeJovens}\n`;
    csvContent += `Total de Serviços,${stats.totalBookings}\n`;
    csvContent += `Serviços Concluídos,${stats.completedServices}\n`;
    csvContent += `Serviços em Andamento,${stats.inProgressServices}\n`;
    csvContent += `Serviços Cancelados,${stats.cancelledServices}\n`;
    csvContent += `Avaliação Média,${stats.averageRating}\n`;
    csvContent += `Total de Avaliações,${stats.totalReviews}\n`;
    csvContent += `Receita Total,R$ ${stats.totalEarnings.toFixed(2)}\n`;
    csvContent += `Média por Serviço,R$ ${stats.averageEarningsPerService}\n\n`;
    
    csvContent += 'RANKING - ONGs COM MAIS SERVIÇOS CONCLUÍDOS\n';
    csvContent += 'Posição,ONG,Jovens Cadastrados,Serviços Concluídos,Avaliação Média,Receita Total\n';
    rankings.byCompletedServices.forEach((ong, index) => {
      csvContent += `${index + 1},${ong.name},${ong.jovensCount},${ong.completedCount},${ong.averageRating.toFixed(1)},R$ ${ong.totalEarnings.toFixed(2)}\n`;
    });
    csvContent += '\n';
    
    csvContent += 'RANKING - ONGs COM MELHORES AVALIAÇÕES\n';
    csvContent += 'Posição,ONG,Avaliação Média,Número de Avaliações,Serviços Concluídos\n';
    rankings.byRating.forEach((ong, index) => {
      csvContent += `${index + 1},${ong.name},${ong.averageRating.toFixed(1)},${ong.reviewCount},${ong.completedCount}\n`;
    });
    csvContent += '\n';
    
    if (rankings.byEarnings.length > 0) {
      csvContent += 'RANKING - ONGs COM MAIORES RECEITAS\n';
      csvContent += 'Posição,ONG,Receita Total,Serviços Concluídos,Média por Serviço\n';
      rankings.byEarnings.forEach((ong, index) => {
        csvContent += `${index + 1},${ong.name},R$ ${ong.totalEarnings.toFixed(2)},${ong.completedCount},R$ ${ong.averageEarningsPerService.toFixed(2)}\n`;
      });
      csvContent += '\n';
    }
    
    csvContent += 'DETALHAMENTO POR ONG\n';
    csvContent += 'ONG,Jovens Cadastrados,Jovens Ativos,Total Serviços,Concluídos,Em Andamento,Cancelados,Taxa Conclusão,Avaliação Média,Num. Avaliações,Receita Total,Média por Serviço\n';
    ongs.forEach(ong => {
      const ongJovens = jovens.filter(j => j.ongId === ong.id);
      const ongJovensIds = ongJovens.map(j => j.id);
      const ongBookings = filteredBookings.filter(b => ongJovensIds.includes(b.jovemId));
      const completed = ongBookings.filter(b => b.status === 'completed').length;
      const inProgress = ongBookings.filter(b => b.status === 'in_progress' || b.status === 'checked_in').length;
      const cancelled = ongBookings.filter(b => b.status === 'cancelled').length;
      const ongReviews = filteredReviews.filter(r => ongJovensIds.includes(r.jovemId));
      const avgRating = ongReviews.length > 0 ? (ongReviews.reduce((sum, r) => sum + r.rating, 0) / ongReviews.length).toFixed(1) : '0.0';
      const completionRate = ongBookings.length > 0 ? ((completed / ongBookings.length) * 100).toFixed(1) : '0.0';
      const totalEarnings = ongBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.finalPrice || 0), 0);
      const avgEarnings = completed > 0 ? (totalEarnings / completed).toFixed(2) : '0.00';
      
      csvContent += `${ong.name},${ongJovens.length},${ongJovens.filter(j => j.availability).length},${ongBookings.length},${completed},${inProgress},${cancelled},${completionRate}%,${avgRating},${ongReviews.length},R$ ${totalEarnings.toFixed(2)},R$ ${avgEarnings}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `relatorio-admin-${periodFilter}-${new Date().toISOString().split('T')[0]}.csv`;
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
      <Header title="Dashboard Admin" />
      
      <div className="container">
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              🎯 Painel Administrativo
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Análise Completa da Plataforma
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.totalOngs}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>ONGs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.totalJovens}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Jovens</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>⭐ {stats.averageRating}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Média Geral</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>💰 R$ {stats.totalEarnings.toFixed(2)}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Receita Total</div>
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
              { id: 'financial', label: '💼 Financeiro' },
              { id: 'reviews', label: '💬 Avaliações' },
              { id: 'performance', label: '📈 Performance' },
              { id: 'profit', label: '💰 Lucros' },
              { id: 'config', label: '⚙️ Margem' }
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
              <CardHeader>🏢 Top 5 ONGs - Mais Serviços Concluídos</CardHeader>
              {rankings.byCompletedServices.slice(0, 5).map((ong, index) => (
                <div 
                  key={ong.id}
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
                      {ong.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {ong.jovensCount} jovens • ⭐ {ong.averageRating.toFixed(1)} • {ong.completedCount} concluídos
                    </div>
                    <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '600', marginTop: '2px' }}>
                      💰 R$ {ong.totalEarnings.toFixed(2)}
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
                  onClick={() => navigate('/admin/ongs')}
                >
                  🏢 Gerenciar ONGs
                </button>
                <button 
                  className="btn btn-secondary btn-full"
                  onClick={() => navigate('/admin/usuarios')}
                >
                  👥 Gerenciar Usuários
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
                rankings.byCompletedServices.map((ong, index) => (
                  <div 
                    key={ong.id}
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
                        {ong.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {ong.completedCount} serviços • {ong.jovensCount} jovens • ⭐ {ong.averageRating.toFixed(1)}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '700',
                      color: '#4CAF50',
                      flexShrink: 0
                    }}>
                      {ong.completedCount}
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
                rankings.byRating.map((ong, index) => (
                  <div 
                    key={ong.id}
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
                        {ong.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {ong.reviewCount} avaliações • {ong.completedCount} serviços
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
                      ⭐ {ong.averageRating.toFixed(1)}
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>👥 Ranking - Mais Jovens Cadastrados</CardHeader>
              {rankings.byJovensCount.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Nenhum dado disponível
                </div>
              ) : (
                rankings.byJovensCount.map((ong, index) => (
                  <div 
                    key={ong.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: index < rankings.byJovensCount.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: index < 3 ? '#E3F2FD' : 'white'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: index < 3 ? '#1976D2' : '#E0E0E0',
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
                        {ong.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {ong.activeJovensCount} ativos de {ong.jovensCount} total
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      color: '#1976D2',
                      flexShrink: 0
                    }}>
                      {ong.jovensCount}
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
                rankings.byCompletionRate.map((ong, index) => (
                  <div 
                    key={ong.id}
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
                        {ong.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {ong.completedCount}/{ong.totalBookings} serviços
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      color: '#4CAF50',
                      flexShrink: 0
                    }}>
                      {ong.completionRate.toFixed(0)}%
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>💰 Ranking - Maiores Receitas</CardHeader>
              {rankings.byEarnings.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Nenhuma receita registrada
                </div>
              ) : (
                rankings.byEarnings.map((ong, index) => (
                  <div 
                    key={ong.id}
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
                        {ong.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {ong.completedCount} serviços • R$ {ong.averageEarningsPerService.toFixed(2)}/serviço
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      color: '#4CAF50',
                      flexShrink: 0
                    }}>
                      R$ {ong.totalEarnings.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </Card>

            {rankings.byCancellations.length > 0 && (
              <Card style={{ marginTop: '20px' }}>
                <CardHeader>⚠️ Ranking - Mais Cancelamentos</CardHeader>
                {rankings.byCancellations.map((ong, index) => (
                  <div 
                    key={ong.id}
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
                        {ong.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {ong.totalBookings} total • {ong.completedCount} concluídos
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      color: '#EF5350',
                      flexShrink: 0
                    }}>
                      {ong.cancelledCount}
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
                  const ong = jovem ? ongs.find(o => o.id === jovem.ongId) : null;
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
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            🏢 {ong?.name || 'ONG não identificada'}
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
                      Receita Total
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

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                    ONGs Ativas
                  </div>
                  <div style={{ background: '#f5f5f5', height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.totalOngs > 0 ? (stats.activeOngs / stats.totalOngs) * 100 : 0}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #1976D2 0%, #4FC3F7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {stats.activeOngs}/{stats.totalOngs}
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
              <CardHeader>🏢 Performance Individual por ONG</CardHeader>
              <div style={{ padding: '16px' }}>
                <select
                  value={selectedOngFilter}
                  onChange={(e) => setSelectedOngFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '16px'
                  }}
                >
                  <option value="all">📊 Resumo de Todas</option>
                  {ongs.map(ong => (
                    <option key={ong.id} value={ong.id}>{ong.name}</option>
                  ))}
                </select>

                {selectedOngFilter === 'all' ? (
                  <div>
                    {ongs.map((ong) => {
                      const ongJovens = jovens.filter(j => j.ongId === ong.id);
                      const ongJovensIds = ongJovens.map(j => j.id);
                      const ongBookings = bookings.filter(b => ongJovensIds.includes(b.jovemId));
                      const completed = ongBookings.filter(b => b.status === 'completed').length;
                      const cancelled = ongBookings.filter(b => b.status === 'cancelled').length;
                      const ongReviews = reviews.filter(r => ongJovensIds.includes(r.jovemId));
                      const avgRating = ongReviews.length > 0
                        ? (ongReviews.reduce((sum, r) => sum + r.rating, 0) / ongReviews.length).toFixed(1)
                        : '0.0';

                      return (
                        <div 
                          key={ong.id}
                          style={{
                            padding: '16px',
                            borderBottom: '1px solid #f0f0f0',
                            marginBottom: '12px',
                            background: '#fafafa',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '12px' }}>
                            🏢 {ong.name}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                Jovens Cadastrados
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1976D2' }}>
                                {ongJovens.length}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                Serviços Concluídos
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#4CAF50' }}>
                                {completed}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                Avaliação Média
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#FFA726' }}>
                                ⭐ {avgRating}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                Total Serviços
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#666' }}>
                                {ongBookings.length}
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop: '12px', padding: '12px', background: '#E8F5E9', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#2E7D32', marginBottom: '4px', fontWeight: '600' }}>
                              💰 Receita Total
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#2E7D32' }}>
                              R$ {ongBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.finalPrice || 0), 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  (() => {
                    const selectedOng = ongs.find(o => o.id === selectedOngFilter);
                    if (!selectedOng) return null;

                    const ongJovens = jovens.filter(j => j.ongId === selectedOng.id);
                    const ongJovensIds = ongJovens.map(j => j.id);
                    const ongBookings = bookings.filter(b => ongJovensIds.includes(b.jovemId));
                    const completed = ongBookings.filter(b => b.status === 'completed').length;
                    const inProgress = ongBookings.filter(b => b.status === 'in_progress' || b.status === 'checked_in').length;
                    const cancelled = ongBookings.filter(b => b.status === 'cancelled').length;
                    const ongReviews = reviews.filter(r => ongJovensIds.includes(r.jovemId));
                    const avgRating = ongReviews.length > 0
                      ? (ongReviews.reduce((sum, r) => sum + r.rating, 0) / ongReviews.length).toFixed(1)
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
                            🏢 {selectedOng.name}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1976D2' }}>
                                {ongJovens.length}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                Jovens Cadastrados
                              </div>
                            </div>
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
                                Avaliação ({ongReviews.length})
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#E8F5E9', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2E7D32' }}>
                                💰 R$ {ongBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.finalPrice || 0), 0).toFixed(2)}
                              </div>
                              <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '4px', fontWeight: '600' }}>
                                Receita Total
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#F1F8E9', borderRadius: '8px' }}>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#558B2F' }}>
                                R$ {completed > 0 ? (ongBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.finalPrice || 0), 0) / completed).toFixed(2) : '0.00'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#558B2F', marginTop: '4px', fontWeight: '600' }}>
                                Média por Serviço
                              </div>
                            </div>
                          </div>
                        </div>

                        {ongReviews.length > 0 && (
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                              💬 Avaliações Recebidas pela ONG:
                            </div>
                            {ongReviews.slice(0, 5).map((review) => {
                              const jovem = jovens.find(j => j.id === review.jovemId);
                              return (
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
                                      {jovem?.name || 'Jovem'} • {review.clientName || 'Cliente'}
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
                              );
                            })}
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

        {activeView === 'financial' && (() => {
          const financialData = getFinancialAnalysis();
          const maxRevenue = Math.max(...financialData.periodsData.map(p => p.totalRevenue), 1);
          
          return (
            <>
              {/* Filtro de Período */}
              <Card style={{ marginTop: '20px' }}>
                <div style={{ padding: '16px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { id: 'week', label: '📅 Semana', desc: 'Últimos 7 dias' },
                    { id: 'month', label: '📅 Mês', desc: 'Últimos 30 dias' },
                    { id: 'year', label: '📅 Ano', desc: 'Últimos 12 meses' },
                    { id: 'all', label: '📅 Tudo', desc: 'Todo período' }
                  ].map(period => (
                    <button
                      key={period.id}
                      onClick={() => setFinancialPeriod(period.id)}
                      style={{
                        padding: '12px 20px',
                        border: financialPeriod === period.id ? '2px solid #1976D2' : '1px solid #ddd',
                        borderRadius: '12px',
                        background: financialPeriod === period.id ? '#E3F2FD' : 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: financialPeriod === period.id ? '600' : '400',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{period.label}</span>
                      <span style={{ fontSize: '11px', color: '#666' }}>{period.desc}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Cards de Métricas Principais */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '20px' }}>
                <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', opacity: '0.9', marginBottom: '8px' }}>💰 Lucro Total</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      R$ {financialData.totalProfit.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', opacity: '0.8', marginTop: '4px' }}>
                      {financialData.servicesCount} serviços
                    </div>
                  </div>
                </Card>

                <Card style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', opacity: '0.9', marginBottom: '8px' }}>📊 Receita Total</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      R$ {financialData.totalRevenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', opacity: '0.8', marginTop: '4px' }}>
                      Faturamento bruto
                    </div>
                  </div>
                </Card>

                <Card style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', opacity: '0.9', marginBottom: '8px' }}>💵 Repasse ONGs</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      R$ {financialData.totalBaseRevenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', opacity: '0.8', marginTop: '4px' }}>
                      Valor repassado
                    </div>
                  </div>
                </Card>

                <Card style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', opacity: '0.9', marginBottom: '8px' }}>📈 Margem Atual</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {profitMargin}%
                    </div>
                    <div style={{ fontSize: '11px', opacity: '0.8', marginTop: '4px' }}>
                      R$ {financialData.avgProfitPerService.toFixed(2)}/serviço
                    </div>
                  </div>
                </Card>
              </div>

              {/* Gráfico de Receita vs Lucro por Período */}
              <Card style={{ marginTop: '20px' }}>
                <CardHeader>📊 Análise Temporal - Receita vs Lucro</CardHeader>
                <div style={{ padding: '20px' }}>
                  {financialData.periodsData.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                      Nenhum serviço completado no período selecionado
                    </p>
                  ) : (
                    financialData.periodsData.map((period, index) => (
                      <div key={index} style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{period.period}</span>
                          <span style={{ fontSize: '12px', color: '#666' }}>{period.servicesCount} serviços</span>
                        </div>
                        
                        {/* Barra de Receita Total */}
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: '#666' }}>Receita Total</span>
                            <span style={{ fontWeight: '600', color: '#1976D2' }}>R$ {period.totalRevenue.toFixed(2)}</span>
                          </div>
                          <div style={{ background: '#E3F2FD', height: '24px', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ 
                              width: `${(period.totalRevenue / maxRevenue) * 100}%`, 
                              height: '100%', 
                              background: 'linear-gradient(90deg, #1976D2 0%, #42A5F5 100%)',
                              transition: 'width 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              paddingLeft: '8px',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              {((period.totalRevenue / maxRevenue) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        {/* Barra de Lucro */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: '#666' }}>Lucro (Margem)</span>
                            <span style={{ fontWeight: '600', color: '#66BB6A' }}>R$ {period.totalProfit.toFixed(2)}</span>
                          </div>
                          <div style={{ background: '#E8F5E9', height: '20px', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ 
                              width: `${(period.totalProfit / maxRevenue) * 100}%`, 
                              height: '100%', 
                              background: 'linear-gradient(90deg, #66BB6A 0%, #81C784 100%)',
                              transition: 'width 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              paddingLeft: '8px',
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              {period.totalRevenue > 0 ? ((period.totalProfit / period.totalRevenue) * 100).toFixed(1) : 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Ranking de ONGs por Lucro */}
              <Card style={{ marginTop: '20px' }}>
                <CardHeader>🏆 Ranking de ONGs - Performance Financeira</CardHeader>
                <div style={{ padding: '20px' }}>
                  {financialData.ongProfits.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      Nenhuma ONG com serviços completados no período
                    </p>
                  ) : (
                    financialData.ongProfits.map((ong, index) => (
                      <div 
                        key={ong.ongId}
                        style={{
                          padding: '16px',
                          marginBottom: '12px',
                          background: index === 0 ? 'linear-gradient(135deg, #FFF9C4 0%, #FFE082 100%)' : (index % 2 === 0 ? '#fafafa' : 'white'),
                          borderRadius: '12px',
                          border: index === 0 ? '2px solid #FFC107' : '1px solid #e0e0e0',
                          boxShadow: index === 0 ? '0 4px 12px rgba(255,193,7,0.2)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: index === 0 ? '#FFC107' : index === 1 ? '#9E9E9E' : index === 2 ? '#CD7F32' : '#E3F2FD',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              color: index < 3 ? 'white' : '#1976D2'
                            }}>
                              {index === 0 ? '🏆' : `#${index + 1}`}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '16px' }}>{ong.ongName}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{ong.servicesCount} serviços completados</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#66BB6A' }}>
                              R$ {ong.totalProfit.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>lucro gerado</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Receita Total</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1976D2' }}>
                              R$ {ong.totalRevenue.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Repasse ONG</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#9E9E9E' }}>
                              R$ {ong.totalBaseRevenue.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Lucro Médio</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#FF9800' }}>
                              R$ {ong.avgProfitPerService.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Barra visual de margem */}
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                            Margem de Lucro: {ong.profitMarginPercent.toFixed(1)}%
                          </div>
                          <div style={{ background: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${ong.profitMarginPercent}%`, 
                              height: '100%', 
                              background: 'linear-gradient(90deg, #66BB6A 0%, #4CAF50 100%)',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </>
          );
        })()}

        {activeView === 'profit' && <ProfitReport />}
        
        {activeView === 'config' && <ProfitConfig />}
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminDashboard;
