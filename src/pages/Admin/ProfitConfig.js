import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '../../components/Card';
import api from '../../services/api';

const ProfitConfig = () => {
  const [profitMargin, setProfitMargin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfitMargin();
  }, []);

  const fetchProfitMargin = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/profit-margin');
      setProfitMargin(response.data.profitMargin || 0);
    } catch (error) {
      console.error('Erro ao buscar margem:', error);
      setMessage({ text: 'Erro ao carregar margem de lucro', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (profitMargin < 0 || profitMargin > 100) {
      setMessage({ text: 'Margem deve ser entre 0 e 100%', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      await api.put('/admin/profit-margin', { profitMargin: parseFloat(profitMargin) });
      setMessage({ text: 'Margem de lucro atualizada com sucesso! ✅', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ 
        text: error.response?.data?.error || 'Erro ao atualizar margem de lucro', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <Card style={{ maxWidth: '700px', margin: '0 auto' }}>
        <CardHeader>⚙️ Configuração de Margem de Lucro</CardHeader>
        
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
            Configure a porcentagem de lucro que será adicionada ao preço base dos serviços.
            Esta margem será aplicada em todos os serviços executados pelos jovens.
          </p>

          <div style={{ 
            background: '#E3F2FD', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '25px',
            border: '1px solid #2196F3'
          }}>
            <p style={{ margin: 0, color: '#1565C0', fontSize: '14px' }}>
              💡 <strong>Como funciona:</strong> O cliente final verá o preço do serviço + esta margem.<br/>
              Exemplo: Serviço de R$ 100 com margem de 20% = R$ 120 para o cliente.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Margem de Lucro (%):
            </label>
            <input
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Digite um valor entre 0 e 100</small>
          </div>

          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#666' }}>Exemplo de cálculo:</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#66BB6A' }}>
              R$ 100 → R$ {(100 + (100 * profitMargin / 100)).toFixed(2)}
            </span>
          </div>

          {message.text && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              borderRadius: '8px',
              background: message.type === 'success' ? '#E8F5E9' : '#FFEBEE',
              color: message.type === 'success' ? '#2E7D32' : '#C62828',
              border: `1px solid ${message.type === 'success' ? '#4CAF50' : '#F44336'}`
            }}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: saving ? '#ccc' : '#66BB6A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {saving ? '💾 Salvando...' : '💾 Salvar Configuração'}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ProfitConfig;
