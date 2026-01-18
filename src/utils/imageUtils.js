import React from 'react';

// URL do backend
const BACKEND_URL = 'https://impulso-jovem.onrender.com';
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Função para obter URL de imagem através da API
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Se já for uma URL completa, retorna como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Normaliza o caminho
  const fullPath = imagePath.startsWith('/') ? imagePath : `/uploads/${imagePath}`;
  
  // Em produção (Render estático não tem proxy), usa URL absoluta
  if (isProduction) {
    return `${BACKEND_URL}/api/assets${fullPath}`;
  }
  
  // Em desenvolvimento, usa URL relativa (setupProxy.js)
  return `/api/assets${fullPath}`;
};

// Função para fazer download de imagem (abre em nova aba)
export const downloadImage = (imagePath) => {
  const url = getImageUrl(imagePath);
  if (url) {
    window.open(url, '_blank');
  }
};
