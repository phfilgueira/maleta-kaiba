import React, { useState } from 'react';
import { CloseIcon } from './icons';

interface ScanErrorDialogProps {
  message: string;
  onRetry: () => void;
  onManual: (cardCode: string, collectionCode: string) => Promise<void>;
  onClose: () => void;
}

const ScanErrorDialog: React.FC<ScanErrorDialogProps> = ({ message, onRetry, onManual, onClose }) => {
    const [mode, setMode] = useState<'options' | 'manual_input'>(message ? 'options' : 'manual_input');
    const [cardCode, setCardCode] = useState('');
    const [collectionCode, setCollectionCode] = useState('');
    const [manualError, setManualError] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!cardCode) {
            setManualError('Please enter the card code.');
            return;
        }
        setIsSearching(true);
        setManualError('');
        try {
            await onManual(cardCode, collectionCode);
            // On success, the parent component will close this dialog by setting its state
        } catch (e) {
            setManualError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleRetry = () => {
        onClose();
        onRetry();
    };
    
    const handleBack = () => {
        if (message) {
            setMode('options');
        } else {
            onClose();
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
                className="bg-gray-800 rounded-2xl shadow-2xl shadow-purple-900/50 w-full max-w-md m-4 border border-purple-700 relative p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
                    <CloseIcon className="w-6 h-6" />
                </button>
                
                {mode === 'options' && (
                    <div>
                        <h2 className="text-xl font-bold text-red-400 font-orbitron mb-2">Scan Failed</h2>
                        <p className="text-gray-300 mb-6">{message}</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleRetry}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => setMode('manual_input')}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Enter Manually
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'manual_input' && (
                    <div>
                        <h2 className="text-xl font-bold text-purple-300 font-orbitron mb-4">Manual Card Entry</h2>
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="cardCode" className="block text-sm font-medium text-gray-300 mb-1">Card Code</label>
                                <input
                                    id="cardCode"
                                    type="text"
                                    value={cardCode}
                                    onChange={(e) => setCardCode(e.target.value)}
                                    placeholder="e.g., 89631139"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">The 8-digit number on the bottom-left.</p>
                            </div>
                            <div>
                                <label htmlFor="collectionCode" className="block text-sm font-medium text-gray-300 mb-1">Collection Code (Optional)</label>
                                <input
                                    id="collectionCode"
                                    type="text"
                                    value={collectionCode}
                                    onChange={(e) => setCollectionCode(e.target.value)}
                                    placeholder="e.g., LOB-001"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Helps find the exact card print.</p>
                            </div>
                        </div>

                        {manualError && <p className="text-red-400 text-sm mt-4">{manualError}</p>}
                        
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                            <button
                                onClick={handleBack}
                                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-green-800 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isSearching ? (
                                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'Search Card'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanErrorDialog;