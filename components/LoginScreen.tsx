import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
  onGuestAccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGuestAccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin(username);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl shadow-purple-900/50 w-full max-w-md border border-gray-700 z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-orbitron tracking-wider mb-2">
            Card Collection
          </h1>
          <p className="text-gray-400 text-sm">Manage your Yu-Gi-Oh! universe</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-xs text-purple-300 font-orbitron uppercase tracking-wider ml-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Duelist Name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs text-purple-300 font-orbitron uppercase tracking-wider ml-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-900/30 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              (isLoading || !username || !password) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Accessing...</span>
              </div>
            ) : (
              'Login'
            )}
          </button>

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-grow h-px bg-gray-700"></div>
            <span className="text-gray-500 text-xs uppercase">or</span>
            <div className="flex-grow h-px bg-gray-700"></div>
          </div>

          <button
            type="button"
            onClick={onGuestAccess}
            className="w-full bg-transparent border border-gray-600 hover:bg-gray-700/50 text-gray-300 font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Continue as Guest
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          v1.0.0 • Secure Access
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;