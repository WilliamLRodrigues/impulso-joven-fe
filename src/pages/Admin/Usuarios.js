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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
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
                    >
                      👁️ Ver Detalhes
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                    >
                      ✏️ Editar
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
            <button className="btn btn-primary btn-full">
              ➕ Criar Novo Usuário
            </button>
            <button className="btn btn-secondary btn-full">
              📊 Exportar Relatório
            </button>
            <button className="btn btn-secondary btn-full">
              📧 Enviar Notificação em Massa
            </button>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminUsuarios;
