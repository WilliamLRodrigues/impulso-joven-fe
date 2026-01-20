import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { adminService } from '../../services';

const AdminUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'cliente',
    phone: '',
    address: '',
    country: 'Brasil',
    state: '',
    city: '',
    birthDate: '',
    cpf: '',
    rg: '',
    description: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(formData);
      alert('Usuário criado com sucesso!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        userType: 'cliente',
        phone: '',
        address: '',
        country: 'Brasil',
        state: '',
        city: '',
        birthDate: '',
        cpf: '',
        rg: '',
        description: ''
      });
      loadUsers();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert(error.response?.data?.error || 'Erro ao criar usuário');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      await adminService.updateUser(selectedUser.id, updateData);
      alert('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        userType: 'cliente',
        phone: '',
        address: '',
        country: 'Brasil',
        state: '',
        city: '',
        birthDate: '',
        cpf: '',
        rg: '',
        description: ''
      });
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await adminService.deleteUser(selectedUser.id);
      alert('Usuário deletado com sucesso!');
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário');
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await adminService.exportReport();
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `relatorio_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      alert('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      userType: user.userType,
      phone: user.phone || '',
      address: user.address || '',
      country: user.country || 'Brasil',
      state: user.state || '',
      city: user.city || '',
      birthDate: user.birthDate || '',
      cpf: user.cpf || '',
      rg: user.rg || '',
      description: user.description || ''
    });
    setShowEditModal(true);
  };

  const openDetailModal = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || user.userType === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: users.length,
    admin: users.filter(u => u.userType === 'admin').length,
    ong: users.filter(u => u.userType === 'ong').length,
    jovem: users.filter(u => u.userType === 'jovem').length,
    cliente: users.filter(u => u.userType === 'cliente').length
  };

  const getUserTypeBadge = (type) => {
    const badges = {
      admin: 'badge-danger',
      ong: 'badge-info',
      jovem: 'badge-success',
      cliente: 'badge-warning'
    };
    return badges[type] || 'badge-info';
  };

  const getUserTypeLabel = (type) => {
    const labels = {
      admin: 'Admin',
      ong: 'ONG',
      jovem: 'Jovem',
      cliente: 'Cliente'
    };
    return labels[type] || type;
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
      <Header title="Gerenciar Usuários" />
      
      <div className="container">
        {/* Estatísticas */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px',
          marginTop: '20px'
        }}>
          <Card style={{ textAlign: 'center', padding: '16px', background: 'var(--gradient)', color: 'white' }}>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Usuários</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#EF5350' }}>{stats.admin}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Administradores</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-blue)' }}>{stats.ong}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>ONGs</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-green)' }}>{stats.jovem}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Jovens</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '16px', gridColumn: 'span 2' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFA726' }}>{stats.cliente}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Clientes</div>
          </Card>
        </div>

        {/* Busca */}
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            className="input"
            placeholder="🔍 Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '16px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('all')}
          >
            Todos ({stats.total})
          </button>
          <button
            className={`btn ${filter === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('admin')}
          >
            Admin ({stats.admin})
          </button>
          <button
            className={`btn ${filter === 'ong' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('ong')}
          >
            ONGs ({stats.ong})
          </button>
          <button
            className={`btn ${filter === 'jovem' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('jovem')}
          >
            Jovens ({stats.jovem})
          </button>
          <button
            className={`btn ${filter === 'cliente' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
            onClick={() => setFilter('cliente')}
          >
            Clientes ({stats.cliente})
          </button>
        </div>

        {/* Lista de Usuários */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>
            👥 Usuários ({filteredUsers.length})
          </CardHeader>
          {filteredUsers.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhum usuário encontrado
            </p>
          ) : (
            <div>
              {filteredUsers.map((user) => (
                <div 
                  key={user.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--light-gray)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '4px' }}>
                        ✉️ {user.email}
                      </div>
                      {user.phone && (
                        <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '4px' }}>
                          📞 {user.phone}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                        Cadastrado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <span className={`badge ${getUserTypeBadge(user.userType)}`} style={{ marginLeft: '12px' }}>
                      {getUserTypeLabel(user.userType)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                      onClick={() => openDetailModal(user)}
                    >
                      👁️ Ver Detalhes
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                      onClick={() => openEditModal(user)}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '12px', borderColor: '#EF5350', color: '#EF5350' }}
                      onClick={() => openDeleteModal(user)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Ações em Massa */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>⚡ Ações Administrativas</CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn btn-primary btn-full"
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  password: '',
                  userType: 'cliente',
                  phone: '',
                  address: ''
                });
                setShowCreateModal(true);
              }}
            >
              ➕ Criar Novo Usuário
            </button>
            <button 
              className="btn btn-secondary btn-full"
              onClick={handleExportReport}
            >
              📊 Exportar Relatório
            </button>
            <button className="btn btn-secondary btn-full">
              📧 Enviar Notificação em Massa
            </button>
          </div>
        </Card>

        {/* Modal Criar Usuário */}
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
              marginTop: '-12px',
              maxHeight: 'calc(100vh - 160px)',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>➕ Criar Novo Usuário</h2>
              <form onSubmit={handleCreateUser}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Nome Completo</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Senha</label>
                  <input
                    type="password"
                    className="input"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Tipo de Usuário</label>
                  <select
                    className="input"
                    required
                    value={formData.userType}
                    onChange={(e) => setFormData({...formData, userType: e.target.value})}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="jovem">Jovem</option>
                    <option value="ong">ONG</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Telefone</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Endereço</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                {formData.userType === 'jovem' && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="label">Data de Nascimento</label>
                      <input
                        type="date"
                        className="input"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label className="label">CPF</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">RG</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.rg}
                          onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label className="label">Estado</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">Cidade</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="label">Descrição</label>
                      <textarea
                        className="input"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Criar Usuário
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

        {/* Modal Editar Usuário */}
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
              marginTop: '-12px',
              maxHeight: 'calc(100vh - 160px)',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>✏️ Editar Usuário</h2>
              <form onSubmit={handleEditUser}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Nome Completo</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Nova Senha (deixe em branco para manter)</label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Tipo de Usuário</label>
                  <select
                    className="input"
                    required
                    value={formData.userType}
                    onChange={(e) => setFormData({...formData, userType: e.target.value})}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="jovem">Jovem</option>
                    <option value="ong">ONG</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Telefone</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Endereço</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                {formData.userType === 'jovem' && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="label">Data de Nascimento</label>
                      <input
                        type="date"
                        className="input"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label className="label">CPF</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">RG</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.rg}
                          onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label className="label">Estado</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">Cidade</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="label">Descrição</label>
                      <textarea
                        className="input"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </>
                )}
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

        {/* Modal Ver Detalhes */}
        {showDetailModal && selectedUser && (
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
              marginTop: '-12px',
              maxHeight: 'calc(100vh - 160px)',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>👤 Detalhes do Usuário</h2>
              <div style={{ marginBottom: '16px' }}>
                <strong>Nome:</strong> {selectedUser.name}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Tipo:</strong> <span className={`badge ${getUserTypeBadge(selectedUser.userType)}`}>
                  {getUserTypeLabel(selectedUser.userType)}
                </span>
              </div>
              {selectedUser.phone && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Telefone:</strong> {selectedUser.phone}
                </div>
              )}
              {selectedUser.address && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Endereço:</strong> {selectedUser.address}
                </div>
              )}
              {selectedUser.userType === 'jovem' && (
                <>
                  {selectedUser.birthDate && (
                    <div style={{ marginBottom: '16px' }}>
                      <strong>Data de Nascimento:</strong> {selectedUser.birthDate}
                    </div>
                  )}
                  {selectedUser.cpf && (
                    <div style={{ marginBottom: '16px' }}>
                      <strong>CPF:</strong> {selectedUser.cpf}
                    </div>
                  )}
                  {selectedUser.rg && (
                    <div style={{ marginBottom: '16px' }}>
                      <strong>RG:</strong> {selectedUser.rg}
                    </div>
                  )}
                  {(selectedUser.state || selectedUser.city) && (
                    <div style={{ marginBottom: '16px' }}>
                      <strong>Cidade/Estado:</strong> {selectedUser.city || '-'} / {selectedUser.state || '-'}
                    </div>
                  )}
                  {selectedUser.description && (
                    <div style={{ marginBottom: '16px' }}>
                      <strong>Descrição:</strong> {selectedUser.description}
                    </div>
                  )}
                </>
              )}
              <div style={{ marginBottom: '20px' }}>
                <strong>Cadastrado em:</strong> {new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')} às {new Date(selectedUser.createdAt).toLocaleTimeString('pt-BR')}
              </div>
              <button 
                className="btn btn-primary btn-full"
                onClick={() => setShowDetailModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modal Deletar Usuário */}
        {showDeleteModal && selectedUser && (
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
                Tem certeza que deseja excluir o usuário <strong>{selectedUser.name}</strong>? 
                Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, borderColor: '#EF5350', color: '#EF5350' }}
                  onClick={handleDeleteUser}
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

export default AdminUsuarios;
