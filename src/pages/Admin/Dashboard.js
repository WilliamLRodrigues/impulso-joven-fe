import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { adminService, ongService, jovemService, serviceService } from '../../services';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const statsResponse = await adminService.getStats();
      setStats(statsResponse.data);

      const servicesResponse = await serviceService.getAll({});
      setRecentActivity(servicesResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
      <Header title="Dashboard Admin" />
      
      <div className="container">
        {/* Estatísticas Gerais */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <CardHeader style={{ color: 'white', marginBottom: '20px' }}>
            📊 Estatísticas da Plataforma
          </CardHeader>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats?.totalUsers || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Usuários</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats?.totalOngs || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>ONGs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats?.totalJovens || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Jovens</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats?.totalClients || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Clientes</div>
            </div>
          </div>
        </Card>

        {/* Estatísticas de Serviços */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '20px' }}>
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-blue)' }}>
              {stats?.totalServices || 0}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '8px' }}>
              Total de Serviços
            </div>
          </Card>
          
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-green)' }}>
              {stats?.completedServices || 0}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '8px' }}>
              Concluídos
            </div>
          </Card>
          
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#FFA726' }}>
              {stats?.activeBookings || 0}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '8px' }}>
              Agendamentos Ativos
            </div>
          </Card>
          
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#66BB6A' }}>
              {stats?.availableJovens || 0}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '8px' }}>
              Jovens Disponíveis
            </div>
          </Card>
        </div>

        {/* Taxa de Sucesso */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📈 Performance</CardHeader>
          <div style={{ padding: '12px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--gray)' }}>Taxa de Conclusão</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {stats?.totalServices > 0 
                    ? Math.round((stats.completedServices / stats.totalServices) * 100) 
                    : 0}%
                </span>
              </div>
              <div style={{ background: 'var(--light-gray)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${stats?.totalServices > 0 ? (stats.completedServices / stats.totalServices) * 100 : 0}%`, 
                  height: '100%', 
                  background: 'var(--gradient)' 
                }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--gray)' }}>Jovens Ativos</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {stats?.totalJovens > 0 
                    ? Math.round((stats.availableJovens / stats.totalJovens) * 100) 
                    : 0}%
                </span>
              </div>
              <div style={{ background: 'var(--light-gray)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${stats?.totalJovens > 0 ? (stats.availableJovens / stats.totalJovens) * 100 : 0}%`, 
                  height: '100%', 
                  background: 'var(--primary-green)' 
                }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Atividade Recente */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>🔔 Atividade Recente</CardHeader>
          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhuma atividade recente
            </p>
          ) : (
            <div>
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id}
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
                      {activity.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                      {new Date(activity.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <span className={`badge badge-${activity.status === 'completed' ? 'success' : 'info'}`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Ações Rápidas */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>⚡ Ações Rápidas</CardHeader>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '12px', fontSize: '14px' }}
              onClick={() => navigate('/admin/usuarios')}
            >
              👥 Usuários
            </button>
            <button 
              className="btn btn-primary" 
              style={{ padding: '12px', fontSize: '14px' }}
              onClick={() => navigate('/admin/ongs')}
            >
              🏢 ONGs
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '12px', fontSize: '14px' }}
              onClick={() => navigate('/admin/servicos')}
            >
              💼 Serviços
            </button>
            <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '14px' }}>
              📊 Relatórios
            </button>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminDashboard;
