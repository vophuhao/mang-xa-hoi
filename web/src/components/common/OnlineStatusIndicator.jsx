import React from 'react';

const OnlineStatusIndicator = ({ 
  isOnline, 
  size = 'sm', 
  className = '',
  showBorder = true 
}) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const borderClasses = showBorder ? 'border-2 border-white' : '';
  const bgColor = isOnline ? 'bg-green-500' : 'bg-red-500';

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${bgColor} 
        ${borderClasses}
        rounded-full 
        absolute 
        bottom-0 
        right-0 
        ${className}
      `}
      title={isOnline ? 'Đang online' : 'Offline'}
    />
  );
};

export default OnlineStatusIndicator;