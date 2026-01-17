import React from 'react';

const Card = ({ children, className = '', style = {} }) => {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`card-header ${className}`}>{children}</div>;
};

export default Card;
