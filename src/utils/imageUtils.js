import React from 'react';

// Função para obter URL de imagem através da API (oculta backend)
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Se já for uma URL completa, retorna como está (para compatibilidade)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Se começar com /uploads, mantém o caminho completo
  // Se não começar com /, adiciona /uploads/
  const fullPath = imagePath.startsWith('/') ? imagePath : `/uploads/${imagePath}`;
  
  // Retorna caminho relativo - o proxy do frontend irá rotear para o backend
  // Funciona tanto em localhost quanto em produção (via vercel.json rewrites)
  return `/api/assets${fullPath}`;
};

// Função para fazer download de imagem (abre em nova aba)
export const downloadImage = (imagePath) => {
  const url = getImageUrl(imagePath);
  if (url) {
    window.open(url, '_blank');
  }
};
