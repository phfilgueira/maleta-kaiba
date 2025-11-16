import React from 'react';

const GoogleIcon = () => (
    <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M24 9.5c3.23 0 6.13 1.11 8.4 3.29l6.3-6.3C34.93 2.87 29.83 1 24 1 14.7 1 6.88 6.57 3.53 14.54l7.4 5.79C12.55 14.12 17.84 9.5 24 9.5z"></path>
        <path fill="#34A853" d="M46.47 24.5c0-1.66-.15-3.27-.42-4.82H24v9.09h12.58c-.54 2.9-2.12 5.37-4.58 7.08l7.21 5.62c4.22-3.88 6.67-9.58 6.67-16.97z"></path>
        <path fill="#FBBC05" d="M10.93 20.33c-.39-1.18-.61-2.43-.61-3.73s.22-2.55.61-3.73l-7.4-5.79C1.56 10.37 0 14.07 0 18.2c0 4.13 1.56 7.83 4.14 11.1l7.4-5.79c-.61-1.18-.94-2.52-.94-3.98z"></path>
        <path fill="#EA4335" d="M24 47c5.83 0 10.93-1.92 14.57-5.18l-7.21-5.62c-1.93 1.3-4.4 2.08-7.36 2.08-6.16 0-11.45-4.62-13.07-10.74l-7.4 5.79C6.88 40.43 14.7 47 24 47z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);


const LoginScreen: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 p-4 text-center">
      <div className="max-w-md w-full bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-900/40">
        <h1 className="text-3xl font-bold text-purple-300 font-orbitron mb-4">
          Welcome to Yu-Gi-Oh! Card Collector
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Sign in with Google to manage your card collection and build decks.
        </p>
        <button
          onClick={onSignIn}
          className="inline-flex items-center justify-center bg-white text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-gray-200 transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
        >
          <GoogleIcon />
          <span>Sign In with Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;