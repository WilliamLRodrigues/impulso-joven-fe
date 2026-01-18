import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Card, { CardHeader } from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services';
import api from '../../services/api';

const ClienteServicos = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedJovem, setSelectedJovem] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [bookingDescription, setBookingDescription] = useState('');
  const [bookingPhotos, setBookingPhotos] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const categories = ['all', 'Limpeza', 'Organização', 'Eventos', 'Tecnologia', 'Outros', 'Jardinagem', 'Pintura', 'Mudança'];

  useEffect(() => {
    loadServices();
    generateAvailableDates();
    
    // Atualizar automaticamente a cada 10 segundos (silencioso)
    const interval = setInterval(() => {
      loadServices(true); // true = atualização silenciosa
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) { // Próximos 14 dias
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    setAvailableDates(dates);
  };

  const loadServices = async (silent = false) => {
    try {
      const response = await bookingService.getAvailableServices(user.id);
      setServices(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory && service.hasAvailability;
  });

  const handleRequestService = (service, jovem) => {
    setSelectedService(service);
    setSelectedJovem(jovem);
    setShowBookingModal(true);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
    setBookingDescription('');
    setBookingPhotos([]);
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    if (!date || !selectedJovem) return;
    
    setLoadingSlots(true);
    try {
      const response = await bookingService.getAvailableSlots(selectedJovem.id, selectedService.id, date);
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) {
      return;
    }

    if (!bookingDescription.trim()) {
      setShowWarningModal(true);
      return;
    }

    try {
      // Upload das fotos primeiro, se houver
      let uploadedPhotoUrls = [];
      if (bookingPhotos.length > 0) {
        const formData = new FormData();
        // bookingPhotos contém os arquivos File originais
        bookingPhotos.forEach(photo => {
          formData.append('photos', photo);
        });
        
        const uploadResponse = await api.post('/upload/service-photos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (uploadResponse.data) {
          uploadedPhotoUrls = uploadResponse.data.photos.map(p => p.url);
        }
      }

      await bookingService.create({
        serviceId: selectedService.id,
        clientId: user.id,
        jovemId: selectedJovem.id,
        serviceName: selectedService.title,
        date: selectedDate,
        time: selectedTime,
        duration: selectedService.duration,
        status: 'assigned',
        clientDescription: bookingDescription,
        clientPhotos: uploadedPhotoUrls
      });
      setShowBookingModal(false);
      setSelectedService(null);
      setSelectedJovem(null);
      setSelectedDate('');
      setSelectedTime('');
      setBookingDescription('');
      setBookingPhotos([]);
      setShowSuccessModal(true);
      loadServices();
    } catch (error) {
      alert('Erro ao solicitar serviço');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
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
      <Header title="Buscar Serviços" />
      
      <div className="container">
        {/* Barra de Busca */}
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            className="input"
            placeholder="🔍 Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categorias */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '16px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          {categories.map((category) => (
            <button
              key={category}
              className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? '📋 Todos' : category}
            </button>
          ))}
        </div>

        {/* Info sobre localização */}
        <Card style={{ marginTop: '20px', background: '#E3F2FD', border: '2px solid #1976D2' }}>
          <div style={{ fontSize: '14px', color: '#1565C0' }}>
            📍 <strong>Serviços na sua área:</strong> Mostrando apenas serviços disponíveis em {user.city || 'sua cidade'}, {user.state || 'seu estado'}.
          </div>
        </Card>

        {/* Aviso sobre materiais */}
        <Card style={{ marginTop: '16px', background: '#FFF3E0', border: '2px solid #FF9800' }}>
          <div style={{ fontSize: '14px', color: '#E65100' }}>
            ⚠️ <strong>IMPORTANTE:</strong> Você é responsável por fornecer <strong>TODOS os materiais</strong> necessários para o serviço. O jovem fornece apenas a mão de obra.
          </div>
        </Card>

        {/* Resultados */}
        <div style={{ marginTop: '20px' }}>
          {filteredServices.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <p style={{ color: 'var(--gray)', marginBottom: '8px' }}>
                Nenhum serviço encontrado na sua área
              </p>
              <p style={{ fontSize: '13px', color: 'var(--gray)' }}>
                Os serviços são filtrados pela sua localização
              </p>
            </Card>
          ) : (
            <>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--gray)', 
                marginBottom: '16px',
                fontWeight: '600'
              }}>
                {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''} disponíve{filteredServices.length !== 1 ? 'is' : 'l'}
              </div>
              
              {filteredServices.map((service) => (
                <Card key={service.id} style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
                      {service.title}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '12px' }}>
                      {service.description}
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Categoria</div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {service.category || 'Geral'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Valor</div>
                        <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary-green)' }}>
                          R$ {service.price || '50,00'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Duração</div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {service.duration || 2}h
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Jovens Disponíveis</div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          <span className="badge badge-success">{service.availableJovens?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Jovens Disponíveis */}
                    {service.availableJovens && service.availableJovens.length > 0 && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--gray)' }}>
                          👤 Jovens disponíveis para este serviço:
                        </div>
                        {service.availableJovens.map((jovem) => (
                          <div key={jovem.id} style={{ 
                            background: '#f8f9fa', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            marginBottom: '8px',
                            border: '1px solid #e0e0e0'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                                  {jovem.name}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '6px' }}>
                                  🏢 {jovem.ongName}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                  <div>
                                    ⭐ {jovem.rating > 0 ? jovem.rating.toFixed(1) : 'Novo'}
                                  </div>
                                  <div>
                                    ✅ {jovem.completedServices} serviços
                                  </div>
                                </div>
                              </div>
                              <button 
                                className="btn btn-primary"
                                style={{ padding: '8px 16px', fontSize: '13px' }}
                                onClick={() => handleRequestService(service, jovem)}
                              >
                                Agendar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modal de Agendamento */}
      {showBookingModal && selectedService && selectedJovem && (
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
          padding: '20px',
          paddingBottom: '100px',
          overflowY: 'auto'
        }}>
          <Card style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <CardHeader>📅 Agendar Serviço</CardHeader>
            
            {/* Informações do Serviço */}
            <div style={{ marginBottom: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                {selectedService.title}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '8px' }}>
                {selectedService.description}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-green)' }}>
                R$ {selectedService.price || '50,00'} • {selectedService.duration || 2}h
              </div>
            </div>

            {/* Informações do Jovem e ONG */}
            <div style={{ marginBottom: '20px', padding: '12px', background: '#E3F2FD', borderRadius: '8px', border: '1px solid #1976D2' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1565C0' }}>
                👤 Profissional Selecionado
              </div>
              <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                {selectedJovem.name}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', marginTop: '6px', marginBottom: '8px' }}>
                <div>⭐ {selectedJovem.rating > 0 ? selectedJovem.rating.toFixed(1) : 'Novo'}</div>
                <div>✅ {selectedJovem.completedServices} serviços completados</div>
              </div>
            </div>

            {/* Informações da ONG */}
            <div style={{ marginBottom: '20px', padding: '12px', background: '#E8F5E9', borderRadius: '8px', border: '2px solid #4CAF50' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2E7D32' }}>
                🏢 Organização Responsável
              </div>
              <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '6px' }}>
                {selectedJovem.ongName}
              </div>
              
              <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#424242' }}>
                {selectedJovem.ongCnpj && (
                  <div>
                    🏛️ CNPJ: {selectedJovem.ongCnpj}
                  </div>
                )}
                {selectedJovem.ongEmail && (
                  <div>
                    ✉️ Email: {selectedJovem.ongEmail}
                  </div>
                )}
                {selectedJovem.ongPhone && (
                  <div>
                    📞 Telefone: {selectedJovem.ongPhone}
                  </div>
                )}
                {selectedJovem.ongFullAddress && (
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #C8E6C9' }}>
                    📍 {selectedJovem.ongFullAddress}
                  </div>
                )}
              </div>
              
              <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '10px', padding: '8px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '6px', fontStyle: 'italic' }}>
                ℹ️ Esta ONG é responsável pelo treinamento e suporte ao jovem profissional
              </div>
            </div>

            {/* Seleção de Data */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                📅 Selecione a Data
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                gap: '8px' 
              }}>
                {availableDates.map((date) => (
                  <button
                    key={date}
                    className={`btn ${selectedDate === date ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ 
                      padding: '8px 4px', 
                      fontSize: '11px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                    onClick={() => handleDateChange(date)}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>

            {/* Seleção de Horário */}
            {selectedDate && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  🕐 Selecione o Horário
                </label>
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="spinner"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#856404' }}>
                      ⚠️ Nenhum horário disponível nesta data
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', 
                    gap: '8px' 
                  }}>
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        className={`btn ${selectedTime === slot.time ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '10px 8px', fontSize: '13px' }}
                        onClick={() => setSelectedTime(slot.time)}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Descrição Detalhada */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                📝 Descreva detalhadamente o serviço *
              </label>
              <textarea
                className="input"
                rows="4"
                placeholder="Exemplo: Preciso pintar uma parede de 3x4m na sala. A parede já está preparada e a tinta será fornecida por mim..."
                value={bookingDescription}
                onChange={(e) => setBookingDescription(e.target.value)}
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
              <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                Seja específico: tamanho, condições atuais, detalhes importantes, etc.
              </div>
            </div>

            {/* Upload de Fotos */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                📷 Fotos do local/serviço (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setBookingPhotos(files); // Armazenar os arquivos File originais
                }}
                style={{ fontSize: '14px', marginBottom: '12px' }}
              />
              {bookingPhotos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {bookingPhotos.map((photo, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img 
                        src={URL.createObjectURL(photo)} 
                        alt={`Foto ${idx + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '2px solid #ddd'
                        }}
                      />
                      <button
                        onClick={() => setBookingPhotos(bookingPhotos.filter((_, i) => i !== idx))}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disclaimer sobre materiais */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '12px', 
              background: '#FFF3E0', 
              borderRadius: '8px',
              border: '2px solid #FF9800'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#E65100', marginBottom: '8px' }}>
                ⚠️ IMPORTANTE - Materiais
              </div>
              <div style={{ fontSize: '13px', color: '#E65100', lineHeight: '1.6' }}>
                <strong>Você é responsável por fornecer TODOS os materiais necessários.</strong>
                <br/><br/>
                O jovem fornecerá apenas a mão de obra. Certifique-se de ter:
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Materiais específicos do serviço (tintas, ferramentas, etc.)</li>
                  <li>Equipamentos de segurança, se necessário</li>
                  <li>Qualquer item mencionado na descrição do serviço</li>
                </ul>
              </div>
            </div>

            {/* Resumo */}
            {selectedDate && selectedTime && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                background: '#d4edda', 
                borderRadius: '8px',
                border: '1px solid #c3e6cb'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#155724', marginBottom: '8px' }}>
                  ✓ Resumo do Agendamento
                </div>
                <div style={{ fontSize: '13px', color: '#155724' }}>
                  📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div style={{ fontSize: '13px', color: '#155724' }}>
                  🕐 {selectedTime}
                </div>
                <div style={{ fontSize: '13px', color: '#155724', marginTop: '4px' }}>
                  ⏱️ Duração: {selectedService.duration || 2} horas
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedService(null);
                  setSelectedJovem(null);
                  setSelectedDate('');
                  setSelectedTime('');
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleConfirmBooking}
              >
                Confirmar Agendamento
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Aviso - Descrição Obrigatória */}
      {showWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '450px', width: '100%', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
              
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#F57C00', marginBottom: '12px' }}>
                Descrição Obrigatória
              </div>
              
              <div style={{ 
                fontSize: '15px', 
                color: '#424242', 
                lineHeight: '1.6',
                marginBottom: '20px',
                textAlign: 'left',
                padding: '0 10px'
              }}>
                Para prosseguir, você precisa <strong>descrever detalhadamente</strong> o serviço que você precisa.
                <br/><br/>
                <div style={{ background: '#FFF3E0', padding: '12px', borderRadius: '8px', border: '2px solid #FFB74D' }}>
                  <strong>Por que isso é importante?</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
                    <li>O jovem precisa entender exatamente o que fazer</li>
                    <li>Evita mal-entendidos e refações</li>
                    <li>Permite um trabalho mais eficiente</li>
                    <li>Ajuda o jovem a se preparar adequadamente</li>
                  </ul>
                </div>
              </div>

              <div style={{
                background: '#E3F2FD',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #90CAF9'
              }}>
                <div style={{ fontSize: '13px', color: '#1565C0', fontWeight: '600', marginBottom: '6px' }}>
                  💡 Dica: Seja específico!
                </div>
                <div style={{ fontSize: '12px', color: '#1976D2', textAlign: 'left' }}>
                  • Descreva o tamanho/área<br/>
                  • Mencione condições atuais<br/>
                  • Liste requisitos especiais<br/>
                  • Informe sobre acesso/estacionamento
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '15px', padding: '12px' }}
              onClick={() => setShowWarningModal(false)}
            >
              Entendi, vou preencher a descrição
            </button>
          </Card>
        </div>
      )}

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '450px', width: '100%', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '72px', marginBottom: '16px' }}>✅</div>
              
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2E7D32', marginBottom: '12px' }}>
                Solicitação Enviada!
              </div>
              
              <div style={{ 
                fontSize: '15px', 
                color: '#424242', 
                lineHeight: '1.6',
                marginBottom: '20px'
              }}>
                Sua solicitação foi enviada com sucesso para o jovem.
              </div>

              <div style={{
                background: '#E8F5E9',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '2px solid #4CAF50',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '14px', color: '#2E7D32', fontWeight: '600', marginBottom: '12px' }}>
                  📋 Próximos Passos:
                </div>
                <div style={{ fontSize: '13px', color: '#2E7D32', lineHeight: '1.8' }}>
                  <strong>1.</strong> O jovem receberá sua solicitação<br/>
                  <strong>2.</strong> Ele analisará os detalhes do serviço<br/>
                  <strong>3.</strong> Você receberá uma notificação quando ele aceitar<br/>
                  <strong>4.</strong> Após aceito, ele receberá um PIN de check-in
                </div>
              </div>

              <div style={{
                background: '#E3F2FD',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #90CAF9'
              }}>
                <div style={{ fontSize: '13px', color: '#1565C0' }}>
                  💡 Acompanhe o status no painel <strong>"Meus Agendamentos"</strong>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '15px', padding: '12px' }}
              onClick={() => setShowSuccessModal(false)}
            >
              Entendi
            </button>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ClienteServicos;
