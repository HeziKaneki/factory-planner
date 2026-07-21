import React, { useState } from 'react';
import { ItemIcon } from './ItemIcon';
import { Item } from '../types';
import { normalizeDatabase } from '../lib/plannerSolver';

interface RecipeSelectorProps {
  title: string;
  onClose: () => void;
  onSelect: (recipeId: string) => void;
  selectedRecipeId?: string;
  customDb?: any;
}

export const RecipeSelector: React.FC<RecipeSelectorProps> = ({
  title,
  onClose,
  onSelect,
  selectedRecipeId,
  customDb
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Normalize current database state
  const { items, recipes } = normalizeDatabase(customDb);

  // Group items by category for beautiful inventory grid layout!
  const categories: Record<string, { name: string; items: Item[] }> = {};

  const dbCategories = (() => {
    const cats = customDb?.categories || {
      science: 'Research & Space',
      intermediate: 'Intermediate Components',
      fluid: 'Fluids & Gases',
      raw: 'Raw Resources',
      utility: 'Utilities'
    };
    if (!cats['no-category']) {
      return {
        'no-category': 'No Category',
        ...cats
      };
    }
    return cats;
  })();

  Object.entries(dbCategories).forEach(([catId, catName]: [string, any]) => {
    categories[catId] = { name: catName, items: [] };
  });

  // Populate categories based on items list
  Object.values(items).forEach(item => {
    const cat = (item.category && item.category in categories) ? item.category : 'no-category';
    if (categories[cat]) {
      categories[cat].items.push(item);
    }
  });

  const filterItems = (catItems: Item[]) => {
    return catItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="factorio-panel w-full max-w-lg text-left select-none overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[80vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b-2 border-zinc-950 bg-zinc-900 p-3">
          <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="factorio-btn-red px-2 py-0.5 text-xs rounded font-bold uppercase"
          >
            Close
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-zinc-900 bg-zinc-900/20">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-2 rounded text-sm font-medium"
            autoFocus
          />
        </div>

        {/* Categories / Grid */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {Object.entries(categories).map(([key, cat]) => {
            const filtered = filterItems(cat.items);
            if (filtered.length === 0) return null;

            return (
              <div key={key} className="space-y-1.5">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pb-1 border-b border-zinc-900">
                  {cat.name}
                </h4>
                
                <div className="flex flex-wrap gap-2 py-1">
                  {filtered.map(item => {
                    const isSelected = item.id === selectedRecipeId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelect(item.id);
                          onClose();
                        }}
                        title={item.name}
                        className={`factorio-slot w-12 h-12 relative group ${
                          isSelected ? 'border-[#e58e26] bg-[#e58e26]/10' : ''
                        }`}
                      >
                        <ItemIcon id={item.id} size={36} type="item" />
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs text-white rounded font-medium whitespace-nowrap shadow-xl z-20 pointer-events-none">
                          <div className="font-bold">{item.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.id}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {searchTerm && Object.values(categories).every(c => filterItems(c.items).length === 0) && (
            <div className="text-center py-8 text-zinc-500 text-sm italic">
              No recipes found matching "{searchTerm}"
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
