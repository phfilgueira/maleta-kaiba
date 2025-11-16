import React from 'react';
import { GridView2Icon, GridView3Icon, GridView4Icon } from './icons';

interface ViewModeControlProps {
  value: number;
  onChange: (value: number) => void;
}

const ViewModeControl: React.FC<ViewModeControlProps> = ({ value, onChange }) => {
  const modes = [2, 3, 4];
  const icons: { [key: number]: React.ReactElement } = {
    2: <GridView2Icon className="w-6 h-6" />,
    3: <GridView3Icon className="w-6 h-6" />,
    4: <GridView4Icon className="w-6 h-6" />,
  };

  return (
    <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 mr-2">View:</span>
        <div className="flex items-center bg-gray-700 rounded-lg p-1">
            {modes.map(mode => (
                <button
                key={mode}
                onClick={() => onChange(mode)}
                className={`p-1.5 rounded-md transition-colors ${
                    value === mode
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gray-600 hover:text-white'
                }`}
                aria-label={`Set grid to ${mode} columns`}
                aria-pressed={value === mode}
                >
                {icons[mode]}
                </button>
            ))}
        </div>
    </div>
  );
};

export default ViewModeControl;
