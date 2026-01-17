import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { jovemService, serviceService } from '../../services';

const ONGJovens = () => {
  const { user } = useAuth();
  const [jovens, setJovens] = useState([]);
  const [selectedJovem, setSelectedJovem] = useState(null);
  const [jovemServices, setJovemServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    cpf: '',
    rg: '',
    address: '',
    skills: [],
    documents: []
  });

  // Categorias de serviço disponíveis
  const serviceCategories = [
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
    loadJovens();
  }, []);

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

      await jovemService.create({
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
      
      alert('Jovem cadastrado com sucesso!');
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        cpf: '',
        rg: '',
        address: '',
        skills: [],
        documents: []
      });
      loadJovens();
    } catch (error) {
      console.error('Erro ao cadastrar jovem:', error);
      alert('Erro ao cadastrar jovem: ' + (error.response?.data?.error || error.message));
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
        
        const response = await fetch('http://localhost:5001/api/upload/document', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataUpload
        });
        
        const data = await response.json();
        if (response.ok) {
          uploadedFiles.push({
            name: file.name,
            path: data.path,
            size: data.size
          });
        }
      }
      
      setFormData({
        ...formData,
        documents: [...formData.documents, ...uploadedFiles]
      });
      
      alert(`${uploadedFiles.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload dos documentos');
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
                    <div>
                      <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                        {jovem.name}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--gray)' }}>
                        📞 {jovem.phone}
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
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '8px', fontSize: '14px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAvailability(jovem.id, jovem.availability);
                        }}
                      >
                        {jovem.availability ? '⏸️ Desativar' : '▶️ Ativar'}
                      </button>
                      <button 
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '8px', fontSize: '14px' }}
                      >
                        ✏️ Editar
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
              <CardHeader>📊 Desempenho de {selectedJovem.name}</CardHeader>
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
                <CardHeader>🎯 Habilidades</CardHeader>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedJovem.skills.map((skill, index) => (
                    <span key={index} className="badge badge-info">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
            )}
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <CardHeader>➕ Cadastrar Novo Jovem</CardHeader>
            <form onSubmit={handleSubmit}>
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  🎯 Habilidades/Skills * 
                </label>
                <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px' }}>
                  Selecione as categorias de serviços que o jovem pode realizar:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {serviceCategories.map(category => (
                    <label
                      key={category}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px',
                        border: formData.skills.includes(category) ? '2px solid var(--primary-blue)' : '2px solid #e0e0e0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: formData.skills.includes(category) ? '#E3F2FD' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.skills.includes(category)}
                        onChange={() => handleToggleSkill(category)}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: formData.skills.includes(category) ? '600' : '400' }}>
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
                {formData.skills.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#f44336', marginTop: '8px' }}>
                    Selecione pelo menos uma habilidade
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
                  ✅ Cadastrar
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
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
