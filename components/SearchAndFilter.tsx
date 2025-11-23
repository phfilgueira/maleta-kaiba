import React, { useState } from 'react';
import { FilterIcon, SearchIcon, CloseIcon } from './icons';
import { CARD_MAIN_TYPES, MONSTER_ATTRIBUTES, MONSTER_TYPES, MONSTER_SUB_TYPES, SPELL_TYPES, TRAP_TYPES, RARITIES } from '../constants';

type FilterValue = string | number | undefined;

interface Filters {
  mainType?: FilterValue;
  attribute?: FilterValue;
  race?: FilterValue;
  subType?: FilterValue;
  level?: FilterValue;
  spellType?: FilterValue;
  trapType?: FilterValue;
  rarity?: FilterValue;
  releaseDate?: FilterValue;
  [key: string]: FilterValue;
}

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onClearFilters: () => void;
}

const FilterSelect: React.FC<{
  label: string;
  name: keyof Filters;
  value: FilterValue;
  options: readonly string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}> = ({ label, name, value, options, onChange }) => (
  <div>
    <label htmlFor={String(name)} className="block text-xs text-purple-300 font-orbitron mb-1">{label}</label>
    <select
      id={String(name)}
      name={String(name)}
      value={value || ''}
      onChange={onChange}
      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 appearance-none"
      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
    >
      <option value="">All</option>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ searchQuery, onSearchChange, filters, onFilterChange, onClearFilters }) => {
    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery !== '';
    const levelOptions = Array.from({ length: 12 }, (_, i) => String(i + 1));

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange(e.target.name as keyof Filters, e.target.value);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange('releaseDate', e.target.value);
    };

    return (
        <div className="p-4 bg-gray-800/50 sticky top-[60px] z-10 backdrop-blur-sm">
            <div className="flex gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or effect..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                     {searchQuery && (
                        <button onClick={() => onSearchChange('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <CloseIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${showFilters ? 'bg-purple-700' : 'bg-gray-600 hover:bg-gray-500'}`}
                    aria-expanded={showFilters}
                >
                    <FilterIcon className="w-5 h-5" />
                    <span>Filters</span>
                </button>
            </div>
            {showFilters && (
                 <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FilterSelect label="Card Type" name="mainType" value={filters.mainType} options={CARD_MAIN_TYPES} onChange={handleSelectChange} />
                        <FilterSelect label="Rarity" name="rarity" value={filters.rarity} options={RARITIES} onChange={handleSelectChange} />
                        
                        <div>
                            <label htmlFor="releaseDate" className="block text-xs text-purple-300 font-orbitron mb-1">Released Before</label>
                            <input
                                type="date"
                                id="releaseDate"
                                name="releaseDate"
                                value={filters.releaseDate as string || ''}
                                onChange={handleDateChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 [color-scheme:dark]"
                            />
                        </div>

                        {filters.mainType === 'Monster' && (
                            <>
                                <FilterSelect label="Attribute" name="attribute" value={filters.attribute} options={MONSTER_ATTRIBUTES} onChange={handleSelectChange} />
                                <FilterSelect label="Type" name="race" value={filters.race} options={MONSTER_TYPES} onChange={handleSelectChange} />
                                <FilterSelect label="Sub-Type" name="subType" value={filters.subType} options={MONSTER_SUB_TYPES} onChange={handleSelectChange} />
                                <FilterSelect label="Level/Rank" name="level" value={filters.level} options={levelOptions} onChange={handleSelectChange} />
                            </>
                        )}
                        {filters.mainType === 'Spell' && (
                           <FilterSelect label="Spell Type" name="spellType" value={filters.spellType} options={SPELL_TYPES} onChange={handleSelectChange} />
                        )}
                         {filters.mainType === 'Trap' && (
                           <FilterSelect label="Trap Type" name="trapType" value={filters.trapType} options={TRAP_TYPES} onChange={handleSelectChange} />
                        )}
                    </div>
                     {hasActiveFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                            <button onClick={onClearFilters} className="text-sm text-purple-300 hover:text-white hover:underline">
                                Clear All Filters & Search
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchAndFilter;