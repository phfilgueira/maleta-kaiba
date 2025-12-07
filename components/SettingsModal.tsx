import React, { useRef, useState } from 'react';
import { CloseIcon, DownloadIcon, UploadIcon, CheckCircleIcon, TrashIcon } from './icons';

interface SettingsModalProps {
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Clear input so selecting the same file triggers change again if needed
      e.target.value = '';
    }
  };

  const handleConfirmRestore = () => {
    if (selectedFile) {
        onImport(selectedFile);
        // We don't clear selectedFile here immediately so the user sees it processing, 
        // but App.tsx will close the modal on success.
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl shadow-purple-900/50 w-full max-w-md m-4 border border-gray-700 relative p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
          <CloseIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-purple-300 font-orbitron mb-2 flex items-center gap-2">
          Backup & Restore
        </h2>
        
        <p className="text-sm text-gray-400 mb-6 border-b border-gray-700 pb-4">
            Your collection is stored locally on this device. Use these tools to save your data to a file or move it to another device.
        </p>

        <div className="space-y-6">
            {/* Export Section */}
            <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/50">
                <h3 className="text-white font-bold mb-1">Save Collection</h3>
                <p className="text-xs text-gray-400 mb-3">Download a copy of your cards and decks to your device.</p>
                <button
                  onClick={onExport}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                >
                  <DownloadIcon className="w-5 h-5" />
                  <span>Download Backup File</span>
                </button>
            </div>

            {/* Import Section */}
            <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/50">
                <h3 className="text-white font-bold mb-1">Restore Collection</h3>
                <p className="text-xs text-gray-400 mb-3">Load a previously saved backup file. <span className="text-red-400">This replaces current data.</span></p>
                
                {!selectedFile ? (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors border border-gray-600 border-b-4 border-gray-900 active:border-b-0 active:translate-y-1"
                    >
                        <UploadIcon className="w-5 h-5" />
                        <span>Select Backup File</span>
                    </button>
                ) : (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between bg-gray-800 p-2 rounded mb-3 border border-gray-600">
                            <span className="text-sm text-gray-200 truncate flex-1 mr-2" title={selectedFile.name}>
                                {selectedFile.name}
                            </span>
                            <button 
                                onClick={() => setSelectedFile(null)}
                                className="text-gray-400 hover:text-red-400"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <button
                            onClick={handleConfirmRestore}
                            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-green-900/20"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>Confirm & Restore</span>
                        </button>
                    </div>
                )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".json"
            />
        </div>
        
        <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-500 font-mono">
                Yu-Gi-Oh! Card Collector • Offline Storage
            </p>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;