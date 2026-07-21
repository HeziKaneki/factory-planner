import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { ItemIcon } from './ItemIcon';

interface SearchableItemSelectorProps {
  value: string;
  onChange: (value: string) => void;
  items: Record<string, { name: string; icon_url?: string }>;
  allItemsList: string[];
  placeholder?: string;
}

export const SearchableItemSelector: React.FC<SearchableItemSelectorProps> = ({
  value,
  onChange,
  items,
  allItemsList,
  placeholder = 'Select item...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedItemName = items[value]?.name || value;
  const selectedItemIconUrl = items[value]?.icon_url;

  const filteredItems = allItemsList.filter(id => {
    const name = items[id]?.name || id;
    return id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="relative flex-1" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-zinc-950 text-white border border-zinc-800 hover:border-[#e58e26] px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-5 h-5 flex items-center justify-center shrink-0 bg-zinc-900/60 rounded border border-zinc-800">
            <ItemIcon id={value} size={14} customUrl={selectedItemIconUrl} />
          </div>
          <span className="truncate">{selectedItemName}</span>
        </div>
        <ChevronDown size={14} className="text-zinc-500 shrink-0 ml-1.5" />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-full min-w-[200px] bg-zinc-900 border border-zinc-950 rounded shadow-2xl z-50 flex flex-col max-h-60 overflow-hidden">
          {/* Dropdown Search Input */}
          <div className="p-2 border-b border-zinc-950 bg-zinc-950/80 relative flex items-center">
            <Search size={12} className="absolute left-4.5 text-zinc-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type to filter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded pl-7 pr-7 py-1 focus:border-[#e58e26] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* List of Filtered Items */}
          <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar bg-zinc-900/40">
            {filteredItems.map(id => {
              const name = items[id]?.name || id;
              const isSelected = id === value;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onChange(id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs text-left cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#e58e26]/20 border border-[#e58e26]/30 text-[#e58e26] font-bold'
                      : 'hover:bg-zinc-800 border border-transparent text-zinc-300 hover:text-white font-medium'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 bg-zinc-950/50 border border-zinc-900 rounded">
                    <ItemIcon id={id} size={14} customUrl={items[id]?.icon_url} />
                  </div>
                  <div className="truncate flex-1">
                    <span className="block truncate">{name}</span>
                    <span className="block text-[9px] text-zinc-500 font-mono -mt-0.5">{id}</span>
                  </div>
                </button>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="p-3 text-[10px] text-zinc-500 italic text-center">
                No items match filter
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
