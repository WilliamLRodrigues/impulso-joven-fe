import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { serviceService } from '../../services';

const AdminServicos = () => {
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    duration: ''
  });

  const categories = [
    'Limpeza',
    'Jardinagem',
    'Pintura',
    'Organização',
    'Mudança',
    'Manutenção',
    'Entregas',
    'Assistência',
    'Outro'
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await serviceService.getAll({});
      setServices(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      alert('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await serviceService.create({
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        status: 'available',
        createdAt: new Date().toISOString()
      });
      
      alert('Serviço criado com sucesso!');
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        duration: ''
      });
      loadServices();
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      alert('Erro ao criar serviço');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;
    
    try {
      await serviceService.delete(id);
      alert('Serviço excluído com sucesso!');
      loadServices();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      alert('Erro ao excluir serviço');
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
      <Header title="Gerenciar Serviços" showBack />
      
      <div className="container">
        {/* Botão Adicionar */}
        <button 
          className="btn btn-primary btn-full"
          onClick={() => setShowModal(true)}
          style={{ marginTop: '20px' }}
        >
          ➕ Cadastrar Novo Serviço
        </button>

        {/* Resumo */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>
              {services.length}
            </div>
            <div style={{ fontSize: '16px', opacity: '0.9' }}>
              Serviços Cadastrados
            </div>
          </div>
        </Card>

        {/* Lista de Serviços */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>💼 Todos os Serviços</CardHeader>
          {services.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gray)', padding: '20px' }}>
              Nenhum serviço cadastrado ainda
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {services.map(service => (
                <Card key={service.id} style={{ backgroundColor: '#f8f9fa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#333' }}>
                        {service.title}
                      </h3>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                        {service.description}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          background: 'var(--primary-blue)', 
                          color: 'white', 
                          borderRadius: '4px' 
                        }}>
                          {service.category}
                        </span>
                        <span style={{ color: '#666' }}>💰 R$ {service.price?.toFixed(2)}</span>
                        <span style={{ color: '#666' }}>⏱️ {service.duration}h</span>
                        <span style={{ 
                          padding: '4px 8px', 
                          background: service.status === 'available' ? '#66BB6A' : '#FFA726',
                          color: 'white', 
                          borderRadius: '4px' 
                        }}>
                          {service.status === 'available' ? 'Disponível' : 'Indisponível'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(service.id)}
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginLeft: '12px'
                      }}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Cadastro */}
      {showModal && (
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
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <CardHeader>➕ Novo Serviço</CardHeader>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Título do Serviço
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ex: Limpeza de jardim"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Descrição
                </label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows="3"
                  placeholder="Descreva o serviço..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Categoria
                </label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Preço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Duração (horas)
                </label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                  placeholder="Ex: 2"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  ✅ Cadastrar
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1 }}
                >
                  ❌ Cancelar
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

export default AdminServicos;
