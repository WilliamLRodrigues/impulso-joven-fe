import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { jovemService, serviceService } from '../../services';
import { getImageUrl } from '../../utils/imageUtils';
import api from '../../services/api';

const ONGJovens = () => {
  const { user } = useAuth();
  const [jovens, setJovens] = useState([]);
  const [selectedJovem, setSelectedJovem] = useState(null);
  const [jovemServices, setJovemServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingJovem, setEditingJovem] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [showSkillsSection, setShowSkillsSection] = useState(false);
  const [showScheduleSection, setShowScheduleSection] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    cpf: '',
    rg: '',
    address: '',
    country: 'Brasil',
    state: '',
    city: '',
    photo: '',
    description: '',
    skills: [],
    documents: [],
    workingSchedule: {
      'segunda-feira': { enabled: false, start: '08:00', end: '18:00' },
      'terça-feira': { enabled: false, start: '08:00', end: '18:00' },
      'quarta-feira': { enabled: false, start: '08:00', end: '18:00' },
      'quinta-feira': { enabled: false, start: '08:00', end: '18:00' },
      'sexta-feira': { enabled: false, start: '08:00', end: '18:00' },
      'sábado': { enabled: false, start: '08:00', end: '18:00' },
      'domingo': { enabled: false, start: '08:00', end: '18:00' }
    }
  });

  // Dias da semana
  const daysOfWeek = [
    { value: 'segunda-feira', label: 'Segunda-feira' },
    { value: 'terça-feira', label: 'Terça-feira' },
    { value: 'quarta-feira', label: 'Quarta-feira' },
    { value: 'quinta-feira', label: 'Quinta-feira' },
    { value: 'sexta-feira', label: 'Sexta-feira' },
    { value: 'sábado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

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

  useEffect(() => {
    loadJovens();
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await serviceService.getAll();
      const services = response.data;
      
      // Serviços cadastrados pelo Admin estão disponíveis para todas as ONGs
      setAvailableServices(services);
      setServiceCategories(services);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      setServiceCategories([]);
      setAvailableServices([]);
    }
  };

  const loadJovens = async () => {
    try {
      const response = await jovemService.getAll(user.id);
      setJovens(response.data);
    } catch (error) {
      console.error('Erro ao carregar jovens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJovem = async (jovem) => {
    setSelectedJovem(jovem);
    try {
      const response = await serviceService.getAll({ jovemId: jovem.id });
      setJovemServices(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços do jovem:', error);
    }
  };

  const handleToggleAvailability = async (jovemId, currentStatus) => {
    try {
      await jovemService.update(jovemId, { availability: !currentStatus });
      loadJovens();
      if (selectedJovem?.id === jovemId) {
        setSelectedJovem({ ...selectedJovem, availability: !currentStatus });
      }
      alert('Status atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar se pelo menos uma skill foi selecionada
    if (!formData.skills || formData.skills.length === 0) {
      alert('Por favor, selecione pelo menos uma habilidade/skill para o jovem!');
      return;
    }
    
    try {
      // Calcular idade a partir da data de nascimento
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));

      if (editingJovem) {
        // Modo edição
        await jovemService.update(editingJovem.id, {
          ...formData,
          age: age
        });
        alert('Jovem atualizado com sucesso!');
      } else {
        // Modo criação
        const response = await jovemService.create({
          ...formData,
          ongId: user.id,
          age: age,
          availability: true,
          stats: {
            completedServices: 0,
            rating: 0,
            points: 0
          }
        });
        
        // Mostrar senha temporária
        if (response.data.temporaryPassword) {
          alert(
            `✅ Jovem cadastrado com sucesso!\n\n` +
            `📧 Email: ${formData.email}\n` +
            `🔑 Senha Temporária: ${response.data.temporaryPassword}\n\n` +
            `⚠️ IMPORTANTE: Anote esta senha e forneça ao jovem.\n` +
            `O jovem deverá alterar a senha no primeiro acesso.`
          );
        } else {
          alert('Jovem cadastrado com sucesso!');
        }
      }
      
      setShowModal(false);
      setEditingJovem(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        photo: '',
        description: '',
        birthDate: '',
        cpf: '',
        rg: '',
        address: '',
        country: 'Brasil',
        state: '',
        city: '',
        skills: [],
        documents: [],
        workingSchedule: {
          'segunda-feira': { enabled: false, start: '08:00', end: '18:00' },
          'terça-feira': { enabled: false, start: '08:00', end: '18:00' },
          'quarta-feira': { enabled: false, start: '08:00', end: '18:00' },
          'quinta-feira': { enabled: false, start: '08:00', end: '18:00' },
          'sexta-feira': { enabled: false, start: '08:00', end: '18:00' },
          'sábado': { enabled: false, start: '08:00', end: '18:00' },
          'domingo': { enabled: false, start: '08:00', end: '18:00' }
        }
      });
      loadJovens();
    } catch (error) {
      console.error('Erro ao salvar jovem:', error);
      alert('Erro ao salvar jovem: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditJovem = (jovem) => {
    setEditingJovem(jovem);
    
    // Inicializar workingSchedule padrão
    const defaultSchedule = {
      'segunda-feira': { enabled: false, start: '08:00', end: '18:00' },
      'terça-feira': { enabled: false, start: '08:00', end: '18:00' },
      'quarta-feira': { enabled: false, start: '08:00', end: '18:00' },
      'quinta-feira': { enabled: false, start: '08:00', end: '18:00' },
      'sexta-feira': { enabled: false, start: '08:00', end: '18:00' },
      'sábado': { enabled: false, start: '08:00', end: '18:00' },
      'domingo': { enabled: false, start: '08:00', end: '18:00' }
    };
    
    // Converter formato antigo para novo se necessário
    let workingSchedule = { ...defaultSchedule };
    
    if (jovem.workingSchedule) {
      // Mesclar com dados existentes
      Object.keys(defaultSchedule).forEach(day => {
        if (jovem.workingSchedule[day]) {
          workingSchedule[day] = jovem.workingSchedule[day];
        }
      });
    } else if (jovem.availableDays && jovem.availableDays.length > 0) {
      // Migrar do formato antigo
      jovem.availableDays.forEach(day => {
        if (workingSchedule[day]) {
          workingSchedule[day] = {
            enabled: true,
            start: jovem.workingHours?.start || '08:00',
            end: jovem.workingHours?.end || '18:00'
          };
        }
      });
    }
    
    setFormData({
      name: jovem.name || '',
      email: jovem.email || '',
      phone: jovem.phone || '',
      birthDate: jovem.birthDate || '',
      cpf: jovem.cpf || '',
      rg: jovem.rg || '',
      address: jovem.address || '',
      country: jovem.country || 'Brasil',
      state: jovem.state || '',
      city: jovem.city || '',
      photo: jovem.photo || '',
      description: jovem.description || '',
      skills: jovem.skills || [],
      documents: jovem.documents || [],
      workingSchedule: workingSchedule
    });
    setShowModal(true);
  };

  const handleDeleteJovem = async (jovem) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${jovem.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await jovemService.delete(jovem.id);
      alert('Jovem excluído com sucesso!');
      setSelectedJovem(null);
      loadJovens();
    } catch (error) {
      console.error('Erro ao excluir jovem:', error);
      alert('Erro ao excluir jovem: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleResetPassword = async (jovem) => {
    if (!window.confirm(`Resetar a senha de ${jovem.name}?\n\nUma nova senha de 6 dígitos será gerada.`)) {
      return;
    }

    try {
      const response = await jovemService.resetPassword(jovem.id);
      const data = response.data;
      
      alert(
        `✅ Senha resetada com sucesso!\n\n` +
        `👤 Jovem: ${data.jovemName}\n` +
        `📧 Email: ${data.jovemEmail}\n` +
        `🔑 Nova Senha Temporária: ${data.temporaryPassword}\n\n` +
        `⚠️ IMPORTANTE: Anote esta senha e forneça ao jovem.\n` +
        `O jovem deverá alterar a senha no próximo acesso.`
      );
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      alert('Erro ao resetar senha: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = [];
      
      for (let file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('document', file);
        
        const response = await api.post('/upload/document', formDataUpload);
        
        if (response.data) {
          uploadedFiles.push({
            name: file.name,
            path: response.data.path,
            size: response.data.size
          });
        }
      }
      
      setFormData({
        ...formData,
        documents: [...formData.documents, ...uploadedFiles]
      });
      
      alert(`${uploadedFiles.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload dos arquivos');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar se é uma imagem
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG)');
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('photo', file);
      
      const response = await jovemService.uploadPhoto(formDataUpload);
      
      setFormData({
        ...formData,
        photo: response.data.path
      });
      
      alert('Foto enviada com sucesso!');
    } catch (error) {
      console.error('Erro no upload da foto:', error);
      alert('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = (index) => {
    const newDocuments = formData.documents.filter((_, i) => i !== index);
    setFormData({ ...formData, documents: newDocuments });
  };

  const handleToggleSkill = (skill) => {
    const currentSkills = formData.skills || [];
    if (currentSkills.includes(skill)) {
      setFormData({
        ...formData,
        skills: currentSkills.filter(s => s !== skill)
      });
    } else {
      setFormData({
        ...formData,
        skills: [...currentSkills, skill]
      });
    }
  };

  const handleToggleDay = (day) => {
    const currentSchedule = formData.workingSchedule || {};
    const daySchedule = currentSchedule[day] || { enabled: false, start: '08:00', end: '18:00' };
    
    setFormData({
      ...formData,
      workingSchedule: {
        ...currentSchedule,
        [day]: {
          ...daySchedule,
          enabled: !daySchedule.enabled
        }
      }
    });
  };

  const handleUpdateDaySchedule = (day, field, value) => {
    const currentSchedule = formData.workingSchedule || {};
    const daySchedule = currentSchedule[day] || { enabled: false, start: '08:00', end: '18:00' };
    
    setFormData({
      ...formData,
      workingSchedule: {
        ...currentSchedule,
        [day]: {
          ...daySchedule,
          [field]: value
        }
      }
    });
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
      <Header title="Gerenciar Jovens" />
      
      <div className="container">
        {/* Botão Adicionar */}
        <button 
          className="btn btn-primary btn-full"
          onClick={() => setShowModal(true)}
          style={{ marginTop: '20px' }}
        >
          ➕ Cadastrar Novo Jovem
        </button>

        {/* Lista de Jovens */}
        <Card style={{ marginTop: '20px' }}>
          <CardHeader>👨‍🎓 Jovens Cadastrados ({jovens.length})</CardHeader>
          {jovens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>
                Nenhum jovem cadastrado ainda
              </p>
            </div>
          ) : (
            <div>
              {jovens.map((jovem) => (
                <div 
                  key={jovem.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--light-gray)',
                    cursor: 'pointer',
                    background: selectedJovem?.id === jovem.id ? 'var(--light-gray)' : 'transparent'
                  }}
                  onClick={() => handleSelectJovem(jovem)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Foto do Jovem */}
                      {jovem.photo ? (
                        <img 
                          src={getImageUrl(jovem.photo)}
                          alt={jovem.name}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: '2px solid var(--primary-blue)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '50px', 
                          height: '50px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--light-gray)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          border: '2px solid #ddd'
                        }}>
                          👤
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                          {jovem.name}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                          📞 {jovem.phone}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${jovem.availability ? 'badge-success' : 'badge-danger'}`}>
                      {jovem.availability ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: 'var(--gray)' }}>⭐</span>
                      {' '}{jovem.stats?.rating?.toFixed(1) || '0.0'}
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray)' }}>💼</span>
                      {' '}{jovem.stats?.completedServices || 0} serviços
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray)' }}>🏆</span>
                      {' '}{jovem.stats?.points || 0} pontos
                    </div>
                  </div>

                  {selectedJovem?.id === jovem.id && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ flex: '1 1 45%', padding: '8px', fontSize: '14px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAvailability(jovem.id, jovem.availability);
                        }}
                      >
                        {jovem.availability ? '⏸️ Desativar' : '▶️ Ativar'}
                      </button>
                      <button 
                        className="btn btn-primary"
                        style={{ flex: '1 1 45%', padding: '8px', fontSize: '14px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditJovem(jovem);
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="btn"
                        style={{ 
                          flex: '1 1 100%', 
                          padding: '8px', 
                          fontSize: '14px',
                          backgroundColor: '#FF9800',
                          color: 'white'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetPassword(jovem);
                        }}
                      >
                        🔑 Resetar Senha
                      </button>
                      <button 
                        className="btn"
                        style={{ 
                          flex: '1 1 100%', 
                          padding: '8px', 
                          fontSize: '14px',
                          backgroundColor: '#f44336',
                          color: 'white'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJovem(jovem);
                        }}
                      >
                        🗑️ Excluir Jovem
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Detalhes do Jovem Selecionado */}
        {selectedJovem && (
          <>
            <Card style={{ marginTop: '20px' }}>
              <CardHeader>� Perfil de {selectedJovem.name}</CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                {/* Foto do Jovem */}
                {selectedJovem.photo ? (
                  <img 
                    src={getImageUrl(selectedJovem.photo)}
                    alt={selectedJovem.name}
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '3px solid var(--primary-blue)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--light-gray)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    border: '3px solid #ddd'
                  }}>
                    👤
                  </div>
                )}
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{selectedJovem.name}</h3>
                  <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '4px' }}>
                    📞 {selectedJovem.phone}
                  </div>
                  {selectedJovem.email && (
                    <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                      📧 {selectedJovem.email}
                    </div>
                  )}
                  {selectedJovem.city && selectedJovem.state && (
                    <div style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '4px' }}>
                      📍 {selectedJovem.city}, {selectedJovem.state}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedJovem.description && (
                <div style={{ 
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#F5F5F5',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--primary-blue)'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                    📝 Sobre
                  </div>
                  <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                    {selectedJovem.description}
                  </div>
                </div>
              )}
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>📊 Desempenho</CardHeader>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-blue)' }}>
                    {selectedJovem.stats?.completedServices || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Serviços</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-green)' }}>
                    ⭐ {selectedJovem.stats?.rating?.toFixed(1) || '0.0'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Avaliação</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFA726' }}>
                    {selectedJovem.stats?.points || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Pontos</div>
                </div>
              </div>
            </Card>

            <Card style={{ marginTop: '20px' }}>
              <CardHeader>💼 Serviços Recentes</CardHeader>
              {jovemServices.length === 0 ? (
                <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px' }}>
                  Nenhum serviço ainda
                </p>
              ) : (
                <div>
                  {jovemServices.slice(0, 5).map((service) => (
                    <div 
                      key={service.id}
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
                          {service.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                          {new Date(service.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <span className={`badge badge-${service.status === 'completed' ? 'success' : 'info'}`}>
                        {service.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {selectedJovem.skills && selectedJovem.skills.length > 0 && (
              <Card style={{ marginTop: '20px' }}>
                <CardHeader>🎯 Serviços que o Jovem Realiza</CardHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedJovem.skills.map((skillId, index) => {
                    const service = availableServices.find(s => s.id === skillId);
                    return service ? (
                      <div 
                        key={index}
                        style={{
                          padding: '10px',
                          backgroundColor: '#F5F5F5',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>
                            {service.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                            {service.category}
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-green)' }}>
                          R$ {service.price}
                        </div>
                      </div>
                    ) : (
                      <span key={index} className="badge badge-secondary">
                        {skillId}
                      </span>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Configurações de Disponibilidade */}
            <Card style={{ marginTop: '20px' }}>
              <CardHeader>⚙️ Configurações de Disponibilidade</CardHeader>
              
              {/* Horários por Dia */}
              {selectedJovem.workingSchedule && (
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--light-gray)' }}>
                  <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>
                    📅⏰ Horários de Trabalho
                  </div>
                  {Object.entries(selectedJovem.workingSchedule)
                    .filter(([_, schedule]) => schedule.enabled)
                    .map(([day, schedule]) => (
                      <div key={day} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#F5F5F5',
                        borderRadius: '6px',
                        marginBottom: '6px'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', textTransform: 'capitalize' }}>
                          {day}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--gray)' }}>
                          {schedule.start} - {schedule.end}
                        </span>
                      </div>
                    ))}
                  {Object.values(selectedJovem.workingSchedule).every(s => !s.enabled) && (
                    <div style={{ fontSize: '13px', color: '#FF9800' }}>
                      ⚠️ Nenhum dia configurado
                    </div>
                  )}
                </div>
              )}

              {/* Migração do formato antigo */}
              {!selectedJovem.workingSchedule && selectedJovem.availableDays && selectedJovem.availableDays.length > 0 && (
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--light-gray)' }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    📅 Dias Disponíveis (formato antigo)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedJovem.availableDays.map((day, index) => (
                      <span key={index} className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                        {day}
                      </span>
                    ))}
                  </div>
                  {selectedJovem.workingHours && (
                    <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '8px' }}>
                      ⏰ {selectedJovem.workingHours.start} às {selectedJovem.workingHours.end}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </>
        )}
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
          zIndex: 9999,
          padding: '20px',
          paddingBottom: '100px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}>
            <CardHeader>{editingJovem ? '✏️ Editar Jovem' : '➕ Cadastrar Novo Jovem'}</CardHeader>
            <form onSubmit={handleSubmit}>
              {/* Foto do Jovem */}
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#333', fontSize: '15px' }}>
                  📸 Foto do Jovem
                </label>
                
                {formData.photo && (
                  <div style={{ marginBottom: '12px' }}>
                    <img 
                      src={getImageUrl(formData.photo)}
                      alt="Foto do jovem"
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '3px solid var(--primary-blue)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    id="photo-upload"
                  />
                  <label 
                    htmlFor="photo-upload" 
                    className="btn btn-secondary"
                    style={{ 
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: uploading ? 0.6 : 1,
                      margin: 0
                    }}
                  >
                    {uploading ? '⏳ Enviando...' : formData.photo ? '🔄 Trocar Foto' : '📤 Adicionar Foto'}
                  </label>
                  
                  {formData.photo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo: '' })}
                      className="btn"
                      style={{ 
                        backgroundColor: '#f44336',
                        margin: 0
                      }}
                    >
                      🗑️ Remover
                    </button>
                  )}
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
                  Formatos aceitos: JPG, PNG (máx. 5MB)
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Nome completo do jovem"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    CPF *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    required
                    placeholder="000.000.000-00"
                    maxLength="14"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                    RG *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    required
                    placeholder="00.000.000-0"
                    maxLength="12"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Email *
                </label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="email@exemplo.com"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Telefone *
                </label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="2"
                  placeholder="Endereço completo"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Localização - País, Estado, Cidade */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#333', fontSize: '15px' }}>
                  📍 Área de Atendimento *
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>
                      País
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.country}
                      disabled
                      style={{ backgroundColor: '#F5F5F5', cursor: 'not-allowed' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>
                      Estado *
                    </label>
                    <select
                      className="input"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>
                    Cidade *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    placeholder="Nome da cidade"
                  />
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
                  ℹ️ Clientes da mesma cidade/estado poderão solicitar serviços deste jovem
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  📝 Descrição/Sobre o Jovem
                </label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  placeholder="Conte um pouco sobre o jovem, suas qualidades, experiências e diferenciais..."
                  style={{ resize: 'vertical' }}
                />
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                  Esta descrição será visível para os clientes
                </div>
              </div>

              {/* Habilidades/Skills - Dropdown */}
              <div style={{ marginBottom: '16px', border: '2px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                <div 
                  onClick={() => setShowSkillsSection(!showSkillsSection)}
                  style={{ 
                    padding: '14px',
                    backgroundColor: showSkillsSection ? '#E3F2FD' : '#F5F5F5',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>
                      🎯 Habilidades/Skills *
                    </span>
                    {formData.skills.length > 0 && (
                      <span style={{ 
                        marginLeft: '10px', 
                        fontSize: '12px', 
                        padding: '3px 8px',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {formData.skills.length}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '20px', transform: showSkillsSection ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </div>
                
                {showSkillsSection && (
                  <div style={{ padding: '16px', backgroundColor: 'white' }}>
                    <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px' }}>
                      Selecione os serviços que o jovem pode realizar:
                    </div>
                
                {serviceCategories.length === 0 ? (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    backgroundColor: '#FFF3E0', 
                    borderRadius: '8px',
                    border: '1px solid #FFB74D'
                  }}>
                    <div style={{ fontSize: '14px', color: '#E65100', marginBottom: '8px', fontWeight: '600' }}>
                      ⚠️ Nenhum serviço disponível
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Os serviços são cadastrados pelo Admin. Entre em contato com o administrador para cadastrar novos serviços.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {serviceCategories.map(service => (
                      <label
                        key={service.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: formData.skills.includes(service.id) ? '2px solid var(--primary-blue)' : '2px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: formData.skills.includes(service.id) ? '#E3F2FD' : 'white',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(service.id)}
                          onChange={() => handleToggleSkill(service.id)}
                          style={{ marginRight: '12px', cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: formData.skills.includes(service.id) ? '600' : '400' }}>
                            {service.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
                            {service.category} • R$ {service.price}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                
                {serviceCategories.length > 0 && formData.skills.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#f44336', marginTop: '8px' }}>
                    Selecione pelo menos um serviço
                  </div>
                )}
                  </div>
                )}
              </div>

              {/* Horários de Trabalho por Dia - Dropdown */}
              <div style={{ marginBottom: '16px', border: '2px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                <div 
                  onClick={() => setShowScheduleSection(!showScheduleSection)}
                  style={{ 
                    padding: '14px',
                    backgroundColor: showScheduleSection ? '#E3F2FD' : '#F5F5F5',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>
                      📅⏰ Horários de Trabalho por Dia
                    </span>
                    {Object.values(formData.workingSchedule || {}).filter(day => day.enabled).length > 0 && (
                      <span style={{ 
                        marginLeft: '10px', 
                        fontSize: '12px', 
                        padding: '3px 8px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {Object.values(formData.workingSchedule || {}).filter(day => day.enabled).length} dias
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '20px', transform: showScheduleSection ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </div>
                
                {showScheduleSection && (
                  <div style={{ padding: '16px', backgroundColor: 'white' }}>
                    <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px' }}>
                      Configure dias e horários individuais:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {daysOfWeek.map(day => (
                    <div
                      key={day.value}
                      style={{
                        padding: '12px',
                        border: formData.workingSchedule[day.value]?.enabled ? '2px solid var(--primary-blue)' : '2px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: formData.workingSchedule[day.value]?.enabled ? '#E3F2FD' : '#FAFAFA',
                        transition: 'all 0.2s'
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.workingSchedule[day.value]?.enabled || false}
                          onChange={() => handleToggleDay(day.value)}
                          style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: formData.workingSchedule[day.value]?.enabled ? '600' : '400' }}>
                          {day.label}
                        </span>
                      </label>
                      
                      {formData.workingSchedule[day.value]?.enabled && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginLeft: '28px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                              Início
                            </label>
                            <input
                              type="time"
                              className="input"
                              value={formData.workingSchedule[day.value]?.start || '08:00'}
                              onChange={(e) => handleUpdateDaySchedule(day.value, 'start', e.target.value)}
                              style={{ fontSize: '13px', padding: '6px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                              Término
                            </label>
                            <input
                              type="time"
                              className="input"
                              value={formData.workingSchedule[day.value]?.end || '18:00'}
                              onChange={(e) => handleUpdateDaySchedule(day.value, 'end', e.target.value)}
                              style={{ fontSize: '13px', padding: '6px' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  📎 Documentos (RG, CPF, Comprovante)
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="btn btn-secondary btn-full"
                  style={{
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.6 : 1,
                    textAlign: 'center'
                  }}
                >
                  {uploading ? '⏳ Enviando...' : '📤 Upload de Documentos'}
                </label>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px' }}>
                  Formatos aceitos: JPG, PNG, PDF (máx. 5MB cada)
                </div>
                
                {formData.documents.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>
                      Documentos anexados:
                    </div>
                    {formData.documents.map((doc, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          background: '#f8f9fa',
                          borderRadius: '4px',
                          marginBottom: '8px'
                        }}
                      >
                        <div style={{ fontSize: '14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          📄 {doc.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(index)}
                          style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginLeft: '8px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                  {editingJovem ? '💾 Salvar' : '✅ Cadastrar'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingJovem(null);
                  }}
                  style={{ flex: 1 }}
                  disabled={uploading}
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

export default ONGJovens;
