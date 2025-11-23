import React from 'react';

interface SortControlProps {
  value: string;
  onChange: (value: string) => void;
}

const sortOptions = [
    { value: 'date-desc', label: 'Date Added (Newest)' },
    { value: 'date-asc', label: 'Date Added (Oldest)' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'rarity-desc', label: 'Rarity (Highest First)' },
    { value: 'rarity-asc', label: 'Rarity (Lowest First)' },
    { value: 'collection-asc', label: 'Collection Code (A-Z)' },
    { value: 'collection-desc', label: 'Collection Code (Z-A)' },
];

const SortControl: React.FC<SortControlProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <label htmlFor="sort-order" className="text-sm text-gray-400 whitespace-nowrap">Sort by:</label>
      <select
        id="sort-order"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 appearance-none flex-grow sm:flex-grow-0 w-full sm:w-auto"
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortControl;