import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/global.css';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se já estiver logado, redireciona para o dashboard apropriado
    if (user) {
      const dashboardRoutes = {
        admin: '/admin/dashboard',
        cliente: '/cliente/dashboard',
        jovem: '/jovem/dashboard',
        ong: '/ong/dashboard'
      };
      const route = dashboardRoutes[user.userType];
      if (route) {
        navigate(route);
      }
    }
  }, [user, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient)' }}>
      <div className="container" style={{ paddingTop: '60px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', fontWeight: '700' }}>
          Impulso Jovem
        </h1>
        <p style={{ fontSize: '20px', marginBottom: '40px', opacity: 0.9 }}>
          Conectando jovens a oportunidades reais
        </p>

        <div className="card" style={{ marginTop: '40px', textAlign: 'left', color: '#333' }}>
          <h2 className="card-header" style={{ color: '#333' }}>🌟 Sobre a Plataforma</h2>
          <p style={{ marginBottom: '16px', lineHeight: '1.6', color: '#555' }}>
            A plataforma <strong>Impulso Jovem</strong> é uma solução digital voltada para a 
            inclusão produtiva de jovens em situação de vulnerabilidade, especialmente aqueles 
            que vivem ou viveram em abrigos.
          </p>
          <p style={{ lineHeight: '1.6', color: '#555' }}>
            Conectamos esses jovens a tarefas simples e remuneradas, promovendo oportunidades 
            reais de desenvolvimento pessoal, profissional e financeiro.
          </p>
        </div>

        <div className="card" style={{ marginTop: '20px', textAlign: 'left', color: '#333' }}>
          <h2 className="card-header" style={{ color: '#333' }}>✨ Funcionalidades</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '12px 0', borderBottom: '1px solid var(--light-gray)', color: '#555' }}>
              ✅ Sistema de pontuação e avaliações
            </li>
            <li style={{ padding: '12px 0', borderBottom: '1px solid var(--light-gray)', color: '#555' }}>
              🎯 Mecanismos de apoio e mentoria
            </li>
            <li style={{ padding: '12px 0', borderBottom: '1px solid var(--light-gray)', color: '#555' }}>
              🛡️ Camadas de segurança e verificação
            </li>
            <li style={{ padding: '12px 0', color: '#555' }}>
              🏆 Gamificação para incentivar participação
            </li>
          </ul>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', gap: '16px', flexDirection: 'column' }}>
          <Link to="/login" className="btn btn-primary btn-full">
            Fazer Login
          </Link>
          <Link to="/register" className="btn btn-secondary btn-full">
            Criar Conta
          </Link>
        </div>

        <div style={{ marginTop: '60px', paddingBottom: '40px', opacity: 0.8 }}>
          <p style={{ fontSize: '14px' }}>
            Desenvolvido com 💚 para transformar vidas através da tecnologia
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
