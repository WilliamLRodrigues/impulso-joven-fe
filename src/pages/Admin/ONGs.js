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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadOngs();
  }, []);

  const loadOngs = async () => {
    try {
      const response = await ongService.getAll();
      setOngs(response.data);
    } catch (error) {
      console.error('Erro ao carregar ONGs:', error);
      alert('Erro ao carregar ONGs');
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

  const handleCreateOng = async (e) => {
    e.preventDefault();
    try {
      await ongService.create(formData);
      alert('ONG criada com sucesso!');
      setShowCreateModal(false);
      setFormData({ name: '', address: '', phone: '', email: '' });
      loadOngs();
    } catch (error) {
      console.error('Erro ao criar ONG:', error);
      alert('Erro ao criar ONG');
    }
  };

  const handleEditOng = async (e) => {
    e.preventDefault();
    try {
      await ongService.update(selectedOng.id, formData);
      alert('ONG atualizada com sucesso!');
      setShowEditModal(false);
      setFormData({ name: '', address: '', phone: '', email: '' });
      loadOngs();
      setSelectedOng(null);
    } catch (error) {
      console.error('Erro ao atualizar ONG:', error);
      alert('Erro ao atualizar ONG');
    }
  };

  const handleDeleteOng = async () => {
    try {
      await ongService.delete(selectedOng.id);
      alert('ONG deletada com sucesso!');
      setShowDeleteModal(false);
      setSelectedOng(null);
      loadOngs();
    } catch (error) {
      console.error('Erro ao deletar ONG:', error);
      alert('Erro ao deletar ONG');
    }
  };

  const openEditModal = (ong) => {
    setSelectedOng(ong);
    setFormData({
      name: ong.name,
      address: ong.address,
      phone: ong.phone,
      email: ong.email || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (ong) => {
    setSelectedOng(ong);
    setShowDeleteModal(true);
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
        {/* Botão Criar Nova ONG */}
        <button 
          className="btn btn-primary btn-full"
          style={{ marginTop: '20px' }}
          onClick={() => {
            setFormData({ name: '', address: '', phone: '', email: '' });
            setShowCreateModal(true);
          }}
        >
          ➕ Cadastrar Nova ONG
        </button>

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
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(ong);
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '12px', borderColor: '#EF5350', color: '#EF5350' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(ong);
                      }}
                    >
                      🗑️ Excluir
                    </button>
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
                <button 
                  className="btn btn-primary btn-full"
                  onClick={() => openEditModal(selectedOng)}
                >
                  ✏️ Editar Informações
                </button>
                <button className="btn btn-secondary btn-full">
                  📊 Ver Relatório Completo
                </button>
                <button 
                  className="btn btn-secondary btn-full"
                  style={{ borderColor: '#EF5350', color: '#EF5350' }}
                  onClick={() => openDeleteModal(selectedOng)}
                >
                  🗑️ Excluir ONG
                </button>
              </div>
            </Card>
          </>
        )}

        {/* Modal Criar ONG */}
        {showCreateModal && (
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
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>➕ Cadastrar Nova ONG</h2>
              <form onSubmit={handleCreateOng}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Nome da ONG</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Endereço</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Telefone</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Criar ONG
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar ONG */}
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
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>✏️ Editar ONG</h2>
              <form onSubmit={handleEditOng}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Nome da ONG</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Endereço</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Telefone</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Salvar Alterações
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Deletar ONG */}
        {showDeleteModal && (
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
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%'
            }}>
              <h2 style={{ marginBottom: '16px', fontSize: '20px', color: '#EF5350' }}>⚠️ Confirmar Exclusão</h2>
              <p style={{ marginBottom: '20px', color: 'var(--gray)' }}>
                Tem certeza que deseja excluir a ONG <strong>{selectedOng?.name}</strong>? 
                Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, borderColor: '#EF5350', color: '#EF5350' }}
                  onClick={handleDeleteOng}
                >
                  Sim, Excluir
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminONGs;
