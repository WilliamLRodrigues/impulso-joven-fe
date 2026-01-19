import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '../../components/Card';
import api from '../../services/api';

const ProfitReport = () => {
  const [loading, setLoading] = useState(true);
  const [profitData, setProfitData] = useState(null);
  const [sortBy, setSortBy] = useState('totalProfit');

  useEffect(() => {
    fetchProfitReport();
  }, []);

  const fetchProfitReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/profit-report');
      setProfitData(response.data);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (event) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    
    if (profitData) {
      const sortedData = [...profitData.profitByOng].sort((a, b) => {
        if (newSortBy === 'totalProfit') return b.totalProfit - a.totalProfit;
        if (newSortBy === 'totalServices') return b.totalServices - a.totalServices;
        if (newSortBy === 'avgProfitPerService') return b.avgProfitPerService - a.avgProfitPerService;
        return 0;
      });
      
      setProfitData({
        ...profitData,
        profitByOng: sortedData
      });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Carregando relatório...</p>
      </div>
    );
  }

  if (!profitData) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ background: '#FFEBEE', padding: '15px', borderRadius: '8px', color: '#C62828' }}>
          ❌ Erro ao carregar relatório de lucros
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💰</div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Lucro Total</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#66BB6A' }}>
              R$ {profitData.totalProfit.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📊</div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Margem Atual</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
              {profitData.profitMargin}%
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Serviços Completados</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {profitData.totalCompletedServices}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📈</div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Lucro Médio/Serviço</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
              R$ {profitData.totalCompletedServices > 0 
                ? (profitData.totalProfit / profitData.totalCompletedServices).toFixed(2) 
                : '0.00'}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>🏆 Ranking de Lucros por ONG</CardHeader>
        
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontWeight: '500' }}>Ordenar por:</span>
            <select 
              value={sortBy}
              onChange={handleSortChange}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="totalProfit">💰 Maior Lucro Total</option>
              <option value="totalServices">📊 Mais Serviços</option>
              <option value="avgProfitPerService">📈 Maior Lucro Médio</option>
            </select>
          </div>

          {profitData.profitByOng.length === 0 ? (
            <div style={{ background: '#E3F2FD', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              ℹ️ Nenhum serviço completado ainda. Os lucros aparecerão aqui quando os serviços forem concluídos.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Pos</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ONG</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Serviços</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Receita Base</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Lucro Total</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Lucro Médio</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Receita Total</th>
                  </tr>
                </thead>
                <tbody>
                  {profitData.profitByOng.map((ong, index) => (
                    <tr 
                      key={ong.ongId}
                      style={{ 
                        background: index === 0 ? '#E8F5E9' : (index % 2 === 0 ? '#fafafa' : 'white'),
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index === 0 ? '#E8F5E9' : (index % 2 === 0 ? '#fafafa' : 'white')}
                    >
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        {index === 0 ? (
                          <span style={{ 
                            background: '#66BB6A', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            🏆 #1
                          </span>
                        ) : `#${index + 1}`}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: '500' }}>
                        {ong.ongName}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        <span style={{ 
                          background: '#2196F3', 
                          color: 'white', 
                          padding: '4px 12px', 
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {ong.totalServices}
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                        R$ {ong.baseRevenue.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold', color: '#66BB6A' }}>
                        R$ {ong.totalProfit.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right', color: '#FF9800' }}>
                        R$ {ong.avgProfitPerService.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: '500' }}>
                        R$ {ong.totalRevenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProfitReport;
