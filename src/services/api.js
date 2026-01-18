import axios from 'axios';

// URLs do backend
const LOCAL_API_URL = 'http://localhost:5001/api';
const CLOUD_API_URL = process.env.REACT_APP_API_URL || 'https://impulso-jovem.onrender.com/api';

// Detecta se está em produção (nuvem)
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Função para detectar se backend local está rodando
const checkLocalBackend = async () => {
  if (isProduction) {
    return false; // Se estamos na nuvem, sempre usa URL da nuvem
  }
  
  try {
    await axios.get(`${LOCAL_API_URL.replace('/api', '')}/health`, { timeout: 1000 });
    console.log('✅ Backend local detectado em http://localhost:5001');
    return true;
  } catch (error) {
    console.log('📡 Backend local não disponível, usando nuvem:', CLOUD_API_URL);
    return false;
  }
};

// Determina a URL base inicial
let currentBaseURL = isProduction ? CLOUD_API_URL : LOCAL_API_URL;

// Verifica backend local ao iniciar (apenas em desenvolvimento)
if (!isProduction) {
  checkLocalBackend().then(isLocal => {
    currentBaseURL = isLocal ? LOCAL_API_URL : CLOUD_API_URL;
    api.defaults.baseURL = currentBaseURL;
  });
}

const api = axios.create({
  baseURL: currentBaseURL,
  timeout: 10000 // 10 segundos de timeout
  // Removido Content-Type padrão para permitir FormData
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Se não for FormData, define Content-Type como JSON
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    // Se for FormData, deixa o axios definir automaticamente (multipart/form-data)
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros e fazer fallback automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Se erro de conexão e estamos em desenvolvimento, tenta trocar de backend
    if (!isProduction && error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      const isUsingLocal = api.defaults.baseURL === LOCAL_API_URL;
      
      if (isUsingLocal) {
        // Estava usando local, tenta nuvem
        console.log('⚠️ Erro no backend local, alternando para nuvem...');
        api.defaults.baseURL = CLOUD_API_URL;
        
        // Tenta reenviar a requisição original
        const config = error.config;
        config.baseURL = CLOUD_API_URL;
        return axios.request(config);
      }
    }
    
    // Tratamento de erro 401 (não autorizado)
    if (error.response?.status === 401) {
      // Não redireciona se já estiver na página de login ou registro
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Função auxiliar para verificar status da conexão
export const getConnectionStatus = () => {
  return {
    isProduction,
    currentURL: api.defaults.baseURL,
    isLocal: api.defaults.baseURL === LOCAL_API_URL
  };
};

// Função para obter URL base sem /api para recursos estáticos (uploads)
export const getStaticBaseURL = () => {
  return api.defaults.baseURL.replace('/api', '');
};

export default api;
