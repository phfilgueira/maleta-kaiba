import React from 'react';

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
      <div className="w-24 h-24 border-4 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-purple-300 font-orbitron tracking-widest animate-pulse">
        IDENTIFYING CARD...
      </p>
    </div>
  );
};

export default LoadingOverlay;
