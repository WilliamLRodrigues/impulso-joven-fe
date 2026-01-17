import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { ongService, jovemService, serviceService } from '../../services';

const ONGDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ongData, setOngData] = useState(null);
  const [jovens, setJovens] = useState([]);
  const [stats, setStats] = useState({
    totalJovens: 0,
    activeJovens: 0,
    totalServices: 0,
    completedServices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const ongResponse = await ongService.getById(user.id);
      setOngData(ongResponse.data);

      const jovensResponse = await jovemService.getAll(user.id);
      const jovensData = jovensResponse.data;
      setJovens(jovensData);

      const servicesResponse = await serviceService.getAll({});
      const servicesData = servicesResponse.data;

      setStats({
        totalJovens: jovensData.length,
        activeJovens: jovensData.filter(j => j.availability).length,
        totalServices: servicesData.length,
        completedServices: servicesData.filter(s => s.status === 'completed').length
      });
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
      <Header title="Dashboard ONG" />
      
      <div className="container">
        {/* Informações da ONG */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              {ongData?.name || user.name}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {ongData?.address || 'Endereço não cadastrado'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.totalJovens}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Jovens</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.activeJovens}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Ativos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.totalServices}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Serviços</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.completedServices}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Concluídos</div>
            </div>
          </div>
        </Card>

        {/* Jovens Cadastrados */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>👨‍🎓 Jovens Cadastrados</CardHeader>
          {jovens.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhum jovem cadastrado ainda
            </p>
          ) : (
            <div>
              {jovens.slice(0, 5).map((jovem) => (
                <div 
                  key={jovem.id}
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
                      {jovem.name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                      ⭐ {jovem.stats?.rating?.toFixed(1) || '0.0'} • 
                      {' '}{jovem.stats?.completedServices || 0} serviços
                    </div>
                  </div>
                  <span className={`badge ${jovem.availability ? 'badge-success' : 'badge-danger'}`}>
                    {jovem.availability ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Ações Rápidas */}
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
              onClick={() => navigate('/ong/jovens')}
            >
              📋 Ver Todos os Jovens
            </button>
            <button 
              className="btn btn-secondary btn-full"
              onClick={() => navigate('/ong/servicos')}
            >
              💼 Gerenciar Serviços
            </button>
          </div>
        </Card>

        {/* Desempenho Geral */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📊 Desempenho Geral</CardHeader>
          <div style={{ padding: '12px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '8px' }}>
                Taxa de Conclusão
              </div>
              <div style={{ background: 'var(--light-gray)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${stats.totalServices > 0 ? (stats.completedServices / stats.totalServices) * 100 : 0}%`, 
                  height: '100%', 
                  background: 'var(--gradient)' 
                }} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px', textAlign: 'right' }}>
                {stats.totalServices > 0 
                  ? Math.round((stats.completedServices / stats.totalServices) * 100) 
                  : 0}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '8px' }}>
                Jovens Ativos
              </div>
              <div style={{ background: 'var(--light-gray)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${stats.totalJovens > 0 ? (stats.activeJovens / stats.totalJovens) * 100 : 0}%`, 
                  height: '100%', 
                  background: 'var(--primary-green)' 
                }} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px', textAlign: 'right' }}>
                {stats.totalJovens > 0 
                  ? Math.round((stats.activeJovens / stats.totalJovens) * 100) 
                  : 0}%
              </div>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default ONGDashboard;
