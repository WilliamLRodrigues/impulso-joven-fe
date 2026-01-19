import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { jovemService, serviceService, bookingService } from '../../services';
import { getImageUrl } from '../../utils/imageUtils';
import api from '../../services/api';
import { resolveTrainingModuleKey, getTrainingModule } from '../../modules/treinamento';
import TrainingModal from '../../components/TrainingModal';

const JovemDashboard = () => {
  const { user, setUser } = useAuth();
  const [jovemData, setJovemData] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainingCompletion, setTrainingCompletion] = useState({});
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [trainingModalKey, setTrainingModalKey] = useState(null);
  const [trainingMessage, setTrainingMessage] = useState(null);
  
  // Estados para edição de perfil
  const [activeView, setActiveView] = useState('dashboard');
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    state: '',
    city: '',
    description: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    loadUserProfile();
    
    // Atualizar automaticamente a cada 10 segundos (silencioso)
    const interval = setInterval(() => {
      loadData(true); // true = atualização silenciosa
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    setTrainingCompletion({});
  }, [user?.id]);

  // Estados brasileiros
  const estadosBrasileiros = [
    { uf: 'AC', nome: 'Acre' },
    { uf: 'AL', nome: 'Alagoas' },
    { uf: 'AP', nome: 'Amapá' },
    { uf: 'AM', nome: 'Amazonas' },
    { uf: 'BA', nome: 'Bahia' },
    { uf: 'CE', nome: 'Ceará' },
    { uf: 'DF', nome: 'Distrito Federal' },
    { uf: 'ES', nome: 'Espírito Santo' },
    { uf: 'GO', nome: 'Goiás' },
    { uf: 'MA', nome: 'Maranhão' },
    { uf: 'MT', nome: 'Mato Grosso' },
    { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MG', nome: 'Minas Gerais' },
    { uf: 'PA', nome: 'Pará' },
    { uf: 'PB', nome: 'Paraíba' },
    { uf: 'PR', nome: 'Paraná' },
    { uf: 'PE', nome: 'Pernambuco' },
    { uf: 'PI', nome: 'Piauí' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'RN', nome: 'Rio Grande do Norte' },
    { uf: 'RS', nome: 'Rio Grande do Sul' },
    { uf: 'RO', nome: 'Rondônia' },
    { uf: 'RR', nome: 'Roraima' },
    { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SP', nome: 'São Paulo' },
    { uf: 'SE', nome: 'Sergipe' },
    { uf: 'TO', nome: 'Tocantins' }
  ];

  const loadUserProfile = async () => {
    try {
      const response = await api.get(`/auth/user/${user.id}`);
      const userData = response.data;
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        state: userData.state || '',
        city: userData.city || '',
        description: userData.description || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleOpenEditModal = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordFields(false);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Validar senha se estiver tentando alterar
      if (showPasswordFields) {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
          alert('Preencha todos os campos de senha');
          setSaving(false);
          return;
        }
        
        if (passwordData.newPassword.length < 6) {
          alert('A nova senha deve ter pelo menos 6 caracteres');
          setSaving(false);
          return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert('As senhas não coincidem');
          setSaving(false);
          return;
        }
      }
      
      // Atualizar perfil
      await api.put(`/auth/user/${user.id}`, profileData);
      
      // Atualizar descrição do jovem especificamente
      if (profileData.description !== jovemData.description) {
        await api.put(`/jovens/${user.id}`, {
          description: profileData.description
        });
      }
      
      // Atualizar senha se necessário
      if (showPasswordFields && passwordData.currentPassword) {
        try {
          await api.put('/auth/change-password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          });
          alert('Perfil e senha atualizados com sucesso!');
        } catch (passwordError) {
          alert('Perfil atualizado, mas erro ao alterar senha: ' + (passwordError.response?.data?.error || passwordError.message));
          setSaving(false);
          return;
        }
      } else {
        alert('Perfil atualizado com sucesso!');
      }
      
      // Atualizar contexto do usuário
      setUser({ ...user, ...profileData });
      
      // Recarregar dados
      await loadData();
      
      // Resetar campos de senha
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordFields(false);
      setShowEditModal(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const loadData = async (silent = false) => {
    try {
      const jovemResponse = await jovemService.getById(user.id);
      let jovemDataResult = jovemResponse.data;
      
      // Verificar se tem skills com IDs antigos (serviceXXX) e migrar
      const hasOldSkills = jovemDataResult.skills?.some(skill => skill.startsWith('service'));
      if (hasOldSkills) {
        try {
          const migrateResponse = await api.post(`/jovens/${user.id}/migrate-skills`);
          jovemDataResult = migrateResponse.data.jovem;
        } catch (err) {
          console.error('Erro ao migrar skills:', err);
        }
      }
      
      setJovemData(jovemDataResult);

      const backendProgress = jovemDataResult?.trainingCompletion;
      if (backendProgress && typeof backendProgress === 'object') {
        setTrainingCompletion(backendProgress);
      } else {
        setTrainingCompletion({});
      }
      
      const currentSkills = jovemDataResult.skills || [];

      // Carregar TODOS os serviços do catálogo
      const servicesResponse = await serviceService.getAll({});
      const allServices = servicesResponse.data;
      
      // Filtrar serviços cujas categorias o jovem ainda NÃO tem nas skills
      const availableCategories = allServices.filter(service => 
        !currentSkills.includes(service.category)
      );
      
      // Remover duplicatas de categoria
      const uniqueCategories = [];
      const seenCategories = new Set();
      availableCategories.forEach(service => {
        if (!seenCategories.has(service.category)) {
          seenCategories.add(service.category);
          uniqueCategories.push(service);
        }
      });
      
      setAvailableServices(uniqueCategories);

      const myServicesResponse = await serviceService.getAll({ jovemId: user.id });
      setMyServices(myServicesResponse.data);
      
      const bookingsResponse = await bookingService.getAll({ jovemId: user.id });
      const allBookings = bookingsResponse.data;
      setBookings(allBookings);
      
      // Filtrar bookings pendentes (assignados mas não confirmados)
      const pending = allBookings.filter(b => 
        b.status === 'assigned' && b.jovemId === user.id
      );
      setPendingBookings(pending);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAcceptServiceCategory = async (service) => {
    try {
      await jovemService.addSkill(user.id, service.category);
      loadData();
      alert(`Categoria "${service.category}" adicionada com sucesso! Agora você pode receber solicitações deste tipo de serviço.`);
    } catch (error) {
      alert('Erro ao adicionar categoria');
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await bookingService.acceptByJovem(bookingId, user.id);
      loadData();
      alert('Serviço aceito com sucesso! PIN gerado e enviado ao cliente.');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao aceitar serviço');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = prompt('Por que você está rejeitando este serviço?');
    if (!reason) return;
    
    try {
      await bookingService.rejectByJovem(bookingId, user.id, reason);
      loadData();
      alert('Serviço rejeitado.');
    } catch (error) {
      alert('Erro ao rejeitar serviço');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const skillsWithTraining = (jovemData?.skills || []).map((skill) => {
    const moduleKey = resolveTrainingModuleKey(skill || '', skill || '');
    const module = moduleKey ? getTrainingModule(moduleKey) : null;
    return {
      skill,
      moduleKey,
      module,
      completed: moduleKey ? Boolean(trainingCompletion[moduleKey]) : true,
    };
  });

  const hasPendingTraining = skillsWithTraining.some((item) => item.moduleKey && !item.completed);

  const handleOpenTrainingModule = (moduleKey) => {
    if (!moduleKey) {
      setTrainingMessage('Conteúdo de treinamento em atualização. Avise o suporte.');
      return;
    }
    setTrainingMessage(null);
    setTrainingModalKey(moduleKey);
    setTrainingModalOpen(true);
  };

  const handleCloseTrainingModule = () => {
    setTrainingModalOpen(false);
    setTrainingModalKey(null);
  };

  const handleTrainingModuleComplete = (moduleKey) => {
    const resolvedKey = moduleKey || trainingModalKey;
    if (!resolvedKey) {
      return;
    }

    setTrainingCompletion((prev) => {
      if (prev?.[resolvedKey]) {
        return prev;
      }
      const nextState = { ...prev, [resolvedKey]: true };
      jovemService.update(user.id, { trainingCompletion: nextState }).catch((error) => {
        console.error('Erro ao salvar progresso de treinamento:', error);
      });
      return nextState;
    });

    setTrainingMessage('Treinamento concluído! Agora novos serviços dessa categoria podem ser encaminhados para você.');
    setTrainingModalOpen(false);
    setTrainingModalKey(null);
  };

  const dismissTrainingMessage = () => setTrainingMessage(null);

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header title="Dashboard Jovem" />
      
      <div className="container">
        {/* Navegação entre Dashboard e Perfil */}
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveView('dashboard')}
              style={{
                flex: 1,
                padding: '12px',
                border: activeView === 'dashboard' ? '2px solid #1976D2' : '1px solid #ddd',
                borderRadius: '8px',
                background: activeView === 'dashboard' ? '#E3F2FD' : 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeView === 'dashboard' ? '600' : '400',
                color: activeView === 'dashboard' ? '#1976D2' : '#666'
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveView('profile')}
              style={{
                flex: 1,
                padding: '12px',
                border: activeView === 'profile' ? '2px solid #1976D2' : '1px solid #ddd',
                borderRadius: '8px',
                background: activeView === 'profile' ? '#E3F2FD' : 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeView === 'profile' ? '600' : '400',
                color: activeView === 'profile' ? '#1976D2' : '#666'
              }}
            >
              👤 Meu Perfil
            </button>
          </div>
        </Card>

        {activeView === 'dashboard' && (
          <>
        {/* Perfil com Foto */}
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {jovemData?.photo ? (
              <img 
                src={getImageUrl(jovemData.photo)}
                alt={user.name}
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '3px solid var(--primary-blue)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                }}
              />
            ) : (
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--light-gray)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                border: '3px solid #ddd'
              }}>
                👤
              </div>
            )}
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{user.name}</h3>
              <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                {jovemData?.availability ? '✅ Disponível para trabalhar' : '❌ Indisponível'}
              </div>
            </div>
          </div>
          
          {jovemData?.description && (
            <div style={{ 
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#F5F5F5',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#333',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#666' }}>
                📝 Sua Descrição:
              </div>
              {jovemData.description}
            </div>
          )}
        </Card>

        {/* Estatísticas */}
        <Card style={{ background: 'var(--gradient)', color: 'white', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Olá, {user.name}!
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>
                  {jovemData?.stats?.completedServices || 0}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Serviços</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>
                  ⭐ {jovemData?.stats?.rating?.toFixed(1) || '0.0'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Avaliação</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>
                  {jovemData?.stats?.points || 0}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Pontos</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de Ganhos */}
        <Card style={{ marginTop: '20px', background: '#E8F5E9', border: '3px solid #4CAF50' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#2E7D32', marginBottom: '8px', fontWeight: '600' }}>
              💰 Total de Ganhos
            </div>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#1B5E20', marginBottom: '8px' }}>
              R$ {(jovemData?.stats?.totalEarnings || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '13px', color: '#2E7D32' }}>
              {bookings.filter(b => b.status === 'completed').length} serviços pagos
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Status</div>
              <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                {jovemData?.availability ? 'Disponível para trabalhar' : 'Indisponível'}
              </div>
            </div>
            <span className={`badge ${jovemData?.availability ? 'badge-success' : 'badge-danger'}`}>
              {jovemData?.availability ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </Card>

        {/* Categorias de Serviço Disponíveis para Aceitar */}
        {availableServices.length > 0 && (
          <Card style={{ marginTop: '20px', border: '3px solid #2196F3' }}>
            <CardHeader style={{ background: '#E3F2FD', color: '#1565C0', borderRadius: '8px 8px 0 0' }}>
              💼 Categorias de Serviço Disponíveis ({availableServices.length})
            </CardHeader>
            <div style={{ padding: '4px 0' }}>
              <div style={{ 
                background: '#E3F2FD', 
                padding: '12px', 
                marginBottom: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#1565C0'
              }}>
                💡 <strong>Aceite as categorias de serviço que você sabe fazer.</strong> Depois de aceitar, clientes poderão solicitar esses tipos de serviço!
              </div>
              {availableServices.map((service) => (
                <div 
                  key={service.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #BBDEFB',
                    marginBottom: '12px',
                    background: '#F5F9FF',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px', color: '#1565C0' }}>
                    {service.category}
                  </div>
                  
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#333' }}>
                    Exemplo: {service.title}
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                    {service.description}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      💰 Valor médio: R$ {service.price?.toFixed(2)} • ⏱️ Duração: {service.duration}h
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '10px', fontSize: '15px' }}
                    onClick={() => handleAcceptServiceCategory(service)}
                  >
                    ✅ Aceitar Categoria "{service.category}"
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Serviços Atribuídos pela ONG - Aguardando Aceitação */}
        {pendingBookings.length > 0 && (
          <Card style={{ marginTop: '20px', border: '3px solid #FF9800' }}>
            <CardHeader style={{ background: '#FFF3E0', color: '#E65100', borderRadius: '8px 8px 0 0' }}>
              ⚠️ Serviços Aguardando sua Aceitação ({pendingBookings.length})
            </CardHeader>
            <div style={{ padding: '4px 0' }}>
              <div style={{ 
                background: '#FFF3E0', 
                padding: '12px', 
                marginBottom: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#E65100'
              }}>
                💡 <strong>A ONG atribuiu estes serviços para você.</strong> Aceite para confirmar que pode realizá-los!
              </div>
              {pendingBookings.map((booking) => (
                <div 
                  key={booking.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #FFE0B2',
                    marginBottom: '12px',
                    background: '#FFFBF5',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px', color: '#E65100' }}>
                    {booking.serviceName}
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                    📅 Data: {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {booking.time && ` às ${booking.time}`}
                  </div>
                  
                  {booking.clientDescription && (
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#555',
                      marginBottom: '12px',
                      padding: '8px',
                      background: 'white',
                      borderRadius: '6px',
                      border: '1px solid #FFE0B2'
                    }}>
                      📝 {booking.clientDescription}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px' }}
                      onClick={() => handleAcceptBooking(booking.id)}
                    >
                      ✅ Aceitar Serviço
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '10px' }}
                      onClick={() => handleRejectBooking(booking.id)}
                    >
                      ❌ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Meus Serviços Ativos */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>📋 Serviços em Andamento</CardHeader>
          {bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress' || b.status === 'checked_in').length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
              Nenhum serviço em andamento
            </p>
          ) : (
            <div>
              {bookings
                .filter(b => b.status === 'confirmed' || b.status === 'in_progress' || b.status === 'checked_in')
                .slice(0, 3)
                .map((booking) => (
                  <div 
                    key={booking.id}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--light-gray)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {booking.serviceName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                        📅 {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <span className={`badge ${
                      booking.status === 'in_progress' ? 'badge-warning' : 
                      booking.status === 'checked_in' ? 'badge-info' : 'badge-success'
                    }`}>
                      {booking.status === 'confirmed' ? 'Confirmado' : 
                       booking.status === 'checked_in' ? 'Check-in Feito' : 
                       'Em Andamento'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Skills - Mostrar categorias de serviços */}
        {skillsWithTraining.length > 0 && (
          <Card style={{ marginTop: '20px' }}>
            <CardHeader>🎯 Minhas Habilidades de Serviço</CardHeader>
            {trainingMessage && (
              <div style={{
                marginTop: '8px',
                padding: '12px',
                background: '#E8F5E9',
                borderRadius: '8px',
                border: '1px solid #66BB6A',
                color: '#1B5E20',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>{trainingMessage}</span>
                <button
                  className="btn btn-secondary"
                  style={{ minWidth: '100px' }}
                  onClick={dismissTrainingMessage}
                >
                  Entendi
                </button>
              </div>
            )}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
              padding: '8px 0'
            }}>
              {skillsWithTraining.map(({ skill, moduleKey, completed, module }, index) => {
                const statusLabel = completed ? 'Treinamento concluído' : 'Treinamento pendente';
                const statusColor = completed ? '#C8E6C9' : '#FFE0B2';
                const statusTextColor = completed ? '#1B5E20' : '#8D6E63';
                const badgeEmoji = completed ? '✅' : '🔒';
                const descriptionText = completed
                  ? 'Pronto para aceitar serviços desta categoria.'
                  : 'Finalize o treinamento correspondente para liberar novos serviços.';

                return (
                  <div 
                    key={index}
                    style={{
                      padding: '12px',
                      background: completed ? 'var(--gradient)' : '#F5F5F5',
                      color: completed ? 'white' : '#37474F',
                      borderRadius: '8px',
                      textAlign: 'left',
                      fontSize: '13px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>
                      {skill}
                    </div>
                    {module && (
                      <div style={{
                        background: statusColor,
                        color: statusTextColor,
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px'
                      }}>
                        <span>{badgeEmoji}</span>
                        <span>{statusLabel}</span>
                      </div>
                    )}
                    <div style={{ fontSize: '12px', lineHeight: '1.5', opacity: completed ? 0.9 : 1 }}>
                      {descriptionText}
                    </div>
                    {module && (
                      <button
                        className="btn btn-secondary"
                        style={{
                          marginTop: 'auto',
                          fontSize: '12px',
                          padding: '8px',
                          background: completed ? 'rgba(255,255,255,0.2)' : '#E0E0E0',
                          color: completed ? 'white' : '#424242',
                          border: completed ? '1px solid rgba(255,255,255,0.4)' : '1px solid #B0BEC5'
                        }}
                        onClick={() => handleOpenTrainingModule(moduleKey)}
                      >
                        {completed ? 'Rever Treinamento' : 'Fazer Treinamento'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ 
              marginTop: '12px',
              padding: '12px',
              background: '#E3F2FD',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#1565C0'
            }}>
              {hasPendingTraining
                ? '💡 Existe treinamento pendente. Conclua os módulos para liberar todas as categorias com segurança.'
                : '💡 Todas as categorias listadas estão liberadas para você aceitar novos serviços com confiança.'}
            </div>
          </Card>
        )}
          </>
        )}

        {activeView === 'profile' && jovemData && (
          <>
            <Card style={{ marginTop: '20px' }}>
              <CardHeader>👤 Meu Perfil</CardHeader>
              <div style={{ padding: '20px' }}>
                {/* Foto */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  {jovemData.photo ? (
                    <img 
                      src={getImageUrl(jovemData.photo)}
                      alt={user.name}
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '4px solid var(--primary-blue)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--light-gray)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '60px',
                      border: '4px solid #ddd'
                    }}>
                      👤
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                    {jovemData.name}
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    📧 {jovemData.email}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    📞 {jovemData.phone || 'Não informado'}
                  </div>
                  {jovemData.city && jovemData.state && (
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      📍 {jovemData.city}, {jovemData.state}
                    </div>
                  )}
                  {jovemData.address && (
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      🏠 {jovemData.address}
                    </div>
                  )}
                  
                  {/* Descrição */}
                  {jovemData.description && (
                    <div style={{ 
                      marginTop: '16px',
                      padding: '16px',
                      background: '#F5F5F5',
                      borderRadius: '8px',
                      border: '2px solid #E0E0E0'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                        📝 Minha Descrição:
                      </div>
                      <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                        {jovemData.description}
                      </div>
                    </div>
                  )}
                  
                  {!jovemData.description && (
                    <div style={{ 
                      marginTop: '16px',
                      padding: '16px',
                      background: '#FFF3E0',
                      borderRadius: '8px',
                      border: '2px solid #FFB74D',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', color: '#E65100' }}>
                        💡 Adicione uma descrição para se destacar e receber mais solicitações!
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px',
                  background: jovemData.availability ? '#E8F5E9' : '#FFEBEE',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    Status de Disponibilidade:
                  </div>
                  <span className={`badge ${jovemData.availability ? 'badge-success' : 'badge-danger'}`}>
                    {jovemData.availability ? '✅ Disponível' : '❌ Indisponível'}
                  </span>
                </div>

                {/* Estatísticas */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#E3F2FD', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#1976D2' }}>
                      {jovemData.stats?.completedServices || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Serviços</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#FFF3E0', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#F57C00' }}>
                      ⭐ {jovemData.stats?.rating?.toFixed(1) || '0.0'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Avaliação</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: '#E8F5E9', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#388E3C' }}>
                      {jovemData.stats?.points || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Pontos</div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-full"
                  onClick={handleOpenEditModal}
                  style={{
                    background: 'var(--gradient)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  ✏️ Editar Perfil e Descrição
                </button>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Modal de Edição de Perfil */}
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
          zIndex: 9999,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}>
            <CardHeader>✏️ Editar Meu Perfil</CardHeader>
            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  className="input"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                  placeholder="Seu nome completo"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Email *
                </label>
                <input
                  type="email"
                  className="input"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                  placeholder="seu@email.com"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Telefone *
                </label>
                <input
                  type="tel"
                  className="input"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  required
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Endereço
                </label>
                <textarea
                  className="input"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  rows="2"
                  placeholder="Rua, número, bairro"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Estado *
                  </label>
                  <select
                    className="input"
                    value={profileData.state}
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    required
                    style={{ padding: '10px' }}
                  >
                    <option value="">Selecione</option>
                    {estadosBrasileiros.map(estado => (
                      <option key={estado.uf} value={estado.uf}>
                        {estado.nome} ({estado.uf})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    Cidade *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    required
                    placeholder="Nome da cidade"
                  />
                </div>
              </div>

              {/* Campo de Descrição */}
              <div style={{ 
                marginBottom: '16px',
                padding: '16px',
                background: '#E3F2FD',
                borderRadius: '8px',
                border: '2px solid #1976D2'
              }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1565C0' }}>
                  📝 Sua Descrição Profissional
                </label>
                <textarea
                  className="input"
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  rows="4"
                  placeholder="Conte um pouco sobre você, suas habilidades e experiências..."
                  style={{ resize: 'vertical', marginBottom: '8px' }}
                />
                <div style={{ fontSize: '12px', color: '#1565C0', lineHeight: '1.5' }}>
                  💡 <strong>Dica:</strong> Uma boa descrição ajuda clientes a conhecerem melhor seu trabalho e aumenta suas chances de ser escolhido!
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '16px' }}>
                ℹ️ Mantenha seus dados atualizados para facilitar o contato
              </div>

              {/* Seção de Alteração de Senha */}
              <div style={{ 
                borderTop: '2px solid #f0f0f0', 
                paddingTop: '16px', 
                marginTop: '16px',
                marginBottom: '16px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1976D2',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 0',
                    width: '100%',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>🔐 Alterar Senha</span>
                  <span>{showPasswordFields ? '▲' : '▼'}</span>
                </button>

                {showPasswordFields && (
                  <div style={{ marginTop: '16px', paddingLeft: '8px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Senha Atual *
                      </label>
                      <input
                        type="password"
                        className="input"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Digite sua senha atual"
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Nova Senha * (mínimo 6 caracteres)
                      </label>
                      <input
                        type="password"
                        className="input"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Digite a nova senha"
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Confirmar Nova Senha *
                      </label>
                      <input
                        type="password"
                        className="input"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Digite novamente a nova senha"
                      />
                      {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <div style={{ fontSize: '12px', color: '#f44336', marginTop: '4px' }}>
                          ⚠️ As senhas não coincidem
                        </div>
                      )}
                      {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                        <div style={{ fontSize: '12px', color: '#f44336', marginTop: '4px' }}>
                          ⚠️ A senha deve ter pelo menos 6 caracteres
                        </div>
                      )}
                    </div>

                    <div style={{ 
                      background: '#E3F2FD', 
                      padding: '12px', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#1976D2'
                    }}>
                      ℹ️ <strong>Dica:</strong> Use uma senha forte com letras, números e símbolos
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'var(--gradient)', border: 'none' }}
                  disabled={saving}
                >
                  {saving ? '💾 Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <TrainingModal
        isOpen={trainingModalOpen}
        moduleKey={trainingModalKey}
        onClose={handleCloseTrainingModule}
        onComplete={handleTrainingModuleComplete}
        successActionLabel="Concluir Treinamento"
      />

      <BottomNav />
    </div>
  );
};

export default JovemDashboard;
