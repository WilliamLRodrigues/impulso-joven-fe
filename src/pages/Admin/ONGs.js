import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { ongService, jovemService } from '../../services';

const AdminONGs = () => {
  const [ongs, setOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState(null);
  const [ongJovens, setOngJovens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOngs();
  }, []);

  const loadOngs = async () => {
    try {
      const response = await ongService.getAll();
      setOngs(response.data);
    } catch (error) {
      console.error('Erro ao carregar ONGs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOng = async (ong) => {
    setSelectedOng(ong);
    try {
      const response = await jovemService.getAll(ong.id);
      setOngJovens(response.data);
    } catch (error) {
      console.error('Erro ao carregar jovens da ONG:', error);
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
      <Header title="Gerenciar ONGs" />
      
      <div className="container">
        {/* Resumo */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
              {ongs.length}
            </div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>
              ONGs Cadastradas
            </div>
          </div>
        </Card>

        {/* Lista de ONGs */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>🏢 Todas as ONGs</CardHeader>
          {ongs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
              <p style={{ color: 'var(--gray)' }}>
                Nenhuma ONG cadastrada ainda
              </p>
            </div>
          ) : (
            <div>
              {ongs.map((ong) => (
                <div 
                  key={ong.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--light-gray)',
                    cursor: 'pointer',
                    background: selectedOng?.id === ong.id ? 'var(--light-gray)' : 'transparent'
                  }}
                  onClick={() => handleSelectOng(ong)}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                      {ong.name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '8px' }}>
                      📍 {ong.address}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                      📞 {ong.phone}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: 'var(--gray)' }}>👨‍🎓</span>
                      {' '}{ong.jovens?.length || 0} jovens
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray)' }}>💼</span>
                      {' '}{ong.stats?.totalServices || 0} serviços
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray)' }}>⭐</span>
                      {' '}{ong.stats?.rating?.toFixed(1) || '0.0'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Detalhes da ONG Selecionada */}
        {selectedOng && (
          <>
            <Card style={{ marginTop: '20px' }}>
              <CardHeader>📊 Estatísticas de {selectedOng.name}</CardHeader>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--primary-blue)' }}>
                    {selectedOng.jovens?.length || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Jovens</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--primary-green)' }}>
                    {selectedOng.stats?.activeJovens || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Ativos</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#FFA726' }}>
                    {selectedOng.stats?.totalServices || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Serviços</div>
                </div>
              </div>
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>👨‍🎓 Jovens Vinculados ({ongJovens.length})</CardHeader>
              {ongJovens.length === 0 ? (
                <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
                  Nenhum jovem vinculado
                </p>
              ) : (
                <div>
                  {ongJovens.map((jovem) => (
                    <div 
                      key={jovem.id}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--light-gray)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                          {jovem.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
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

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>⚙️ Ações</CardHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-primary btn-full">
                  ✏️ Editar Informações
                </button>
                <button className="btn btn-secondary btn-full">
                  📊 Ver Relatório Completo
                </button>
                <button 
                  className="btn btn-secondary btn-full"
                  style={{ borderColor: '#EF5350', color: '#EF5350' }}
                >
                  🗑️ Desativar ONG
                </button>
              </div>
            </Card>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminONGs;
