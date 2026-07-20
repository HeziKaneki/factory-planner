import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  HelpCircle, 
  Check, 
  X, 
  ChevronRight, 
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';

import { ItemIcon } from './components/ItemIcon';
import { MachineConfigModal } from './components/MachineConfigModal';
import { RecipeSelector } from './components/RecipeSelector';
import { FactoryPage, FactoryPlannerLine } from './types';
import { solveFactoryPage, createDefaultLine, normalizeDatabase } from './lib/plannerSolver';
import { DEFAULT_PAGES } from './data/defaultPages';
import { initialCustomDb } from './data/initialDb';
import { EditorTab } from './components/EditorTab';
import { DatabaseTab } from './components/DatabaseTab';

// Format quantities cleanly with k prefix for high density visual layout
export function formatQuantity(value: number): string {
  if (value === 0) return '0';
  if (value >= 1000) {
    const kValue = value / 1000;
    return kValue % 1 === 0 ? `${kValue.toFixed(0)}k` : `${kValue.toFixed(1)}k`;
  }
  return value % 1 === 0 ? `${value.toFixed(0)}` : `${value.toFixed(1)}`;
}

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'planner' | 'editor' | 'database'>('planner');
  
  const [customDb, setCustomDb] = useState(() => {
    const saved = localStorage.getItem('factory_planner_custom_db');
    return saved ? JSON.parse(saved) : initialCustomDb;
  });

  const [pages, setPages] = useState<FactoryPage[]>(() => {
    const saved = localStorage.getItem('factory_planner_pages');
    return saved ? JSON.parse(saved) : DEFAULT_PAGES;
  });

  const [selectedPageId, setSelectedPageId] = useState<string>(() => {
    const saved = localStorage.getItem('factory_planner_selected_id');
    return saved || (DEFAULT_PAGES[0]?.id || '');
  });

  const [searchPageTerm, setSearchPageTerm] = useState('');
  
  // Custom alerts, prompts and modals state
  const [activeLineIdForConfig, setActiveLineIdForConfig] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [rateEditItemId, setRateEditItemId] = useState<string | null>(null);
  
  // Custom Dialog boxes instead of window prompts
  const [customPromptType, setCustomPromptType] = useState<'rename' | 'new-page' | 'rate' | 'preferences' | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');
  
  // Ingredient recipe selector state
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);

  // Normalize dynamic custom database values
  const { items, recipes, machines, modules } = useMemo(() => {
    return normalizeDatabase(customDb);
  }, [customDb]);

  // Active page selection
  const activePage = useMemo(() => {
    return pages.find(p => p.id === selectedPageId) || pages[0] || null;
  }, [pages, selectedPageId]);

  // Save changes to local storage
  useEffect(() => {
    localStorage.setItem('factory_planner_custom_db', JSON.stringify(customDb));
  }, [customDb]);

  useEffect(() => {
    localStorage.setItem('factory_planner_pages', JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    if (selectedPageId) {
      localStorage.setItem('factory_planner_selected_id', selectedPageId);
    }
  }, [selectedPageId]);

  // --- SOLVER COMPUTATIONS ---
  const solverResult = useMemo(() => {
    if (!activePage) return null;
    return solveFactoryPage(activePage, customDb);
  }, [activePage, customDb]);

  const matchingRecipes = useMemo(() => {
    if (!selectedIngredientId) return [];
    const list: any[] = [];
    Object.entries(recipes).forEach(([recipeId, recipe]: [string, any]) => {
      const produces = recipe.products
        ? recipe.products.some((p: any) => p.itemId === selectedIngredientId)
        : recipeId === selectedIngredientId;
      if (produces) {
        list.push(recipe);
      }
    });
    return list;
  }, [selectedIngredientId, recipes]);

  const handleAddRecipeStep = (recipeId: string, targetItemId?: string) => {
    if (!activePage) return;
    const defaultLine = createDefaultLine(recipeId, customDb, targetItemId);
    defaultLine.id = `line-${Date.now()}-${Math.random()}`;
    defaultLine.enabled = true;
    
    handleUpdatePage({
      ...activePage,
      lines: [...activePage.lines, defaultLine]
    });
    setSelectedIngredientId(null);
  };

  // --- HANDLERS & MODIFIERS ---
  const handleUpdatePage = (updated: FactoryPage) => {
    setPages(pages.map(p => p.id === updated.id ? updated : p));
  };

  const updatePageTargets = (page: FactoryPage, newTargets: { itemId: string; rate: number }[]) => {
    const primary = newTargets[0];
    return {
      ...page,
      targetItemId: primary ? primary.itemId : '',
      targetRate: primary ? primary.rate : 0,
      targetProducts: newTargets
    };
  };

  const handleToggleRateUnit = () => {
    if (!activePage) return;
    const isMin = activePage.rateUnit === 'minute';
    const targets = activePage.targetProducts || (activePage.targetItemId ? [{ itemId: activePage.targetItemId, rate: activePage.targetRate }] : []);
    
    const updatedTargets = targets.map(t => {
      const newRate = isMin ? t.rate / 60 : t.rate * 60;
      return {
        ...t,
        rate: Math.round(newRate * 100) / 100
      };
    });

    const nextUnit = isMin ? 'second' : 'minute';
    const updatedPage = updatePageTargets(activePage, updatedTargets);

    handleUpdatePage({
      ...updatedPage,
      rateUnit: nextUnit
    });
  };

  const handleToggleItemsViewMode = (mode: 'items-m' | 'items-s') => {
    if (!activePage) return;
    handleUpdatePage({
      ...activePage,
      itemsViewMode: mode
    });
  };

  const handleToggleSolverMode = () => {
    if (!activePage) return;
    handleUpdatePage({
      ...activePage,
      solverMode: activePage.solverMode === 'traditional' ? 'matrix' : 'traditional'
    });
  };

  const handleToggleLineEnabled = (lineId: string) => {
    if (!activePage) return;
    
    const existingIndex = activePage.lines.findIndex(l => l.id === lineId);
    let newLines = [...activePage.lines];

    if (existingIndex !== -1) {
      newLines[existingIndex] = {
        ...newLines[existingIndex],
        enabled: !newLines[existingIndex].enabled
      };
    }

    handleUpdatePage({
      ...activePage,
      lines: newLines
    });
  };

  const handleMoveLineOrder = (index: number, direction: 'up' | 'down') => {
    if (!activePage) return;
    if (index === 0 && direction === 'up') return;
    if (index === activePage.lines.length - 1 && direction === 'down') return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    let updatedPageLines = [...activePage.lines];
    
    const temp = updatedPageLines[index];
    updatedPageLines[index] = updatedPageLines[targetIndex];
    updatedPageLines[targetIndex] = temp;

    handleUpdatePage({
      ...activePage,
      lines: updatedPageLines
    });
  };

  const handleRemoveLine = (lineId: string) => {
    if (!activePage) return;
    handleUpdatePage({
      ...activePage,
      lines: activePage.lines.filter(l => l.id !== lineId)
    });
  };

  const handleSaveMachineConfig = (config: {
    machineId: string;
    modules: string[];
    beaconCount: number;
    beaconId: string | null;
    beaconModules: string[];
  }) => {
    if (!activePage || !activeLineIdForConfig) return;

    const existingIdx = activePage.lines.findIndex(l => l.id === activeLineIdForConfig);
    let updatedLines = [...activePage.lines];

    if (existingIdx !== -1) {
      updatedLines[existingIdx] = {
        ...updatedLines[existingIdx],
        ...config
      };
    }

    handleUpdatePage({
      ...activePage,
      lines: updatedLines
    });
    setActiveLineIdForConfig(null);
  };

  const handleCreatePage = (name: string, targetItem: string) => {
    const id = `page-${Date.now()}`;
    const newPage: FactoryPage = {
      id,
      name: name || 'New Factory Line',
      targetItemId: targetItem || 'electronic-circuit',
      targetRate: 60,
      targetProducts: [{ itemId: targetItem || 'electronic-circuit', rate: 60 }],
      rateUnit: 'minute',
      solverMode: 'traditional',
      itemsViewMode: 'items-m',
      lines: []
    };

    setPages([...pages, newPage]);
    setSelectedPageId(id);
    setCustomPromptType(null);
  };

  const handleRenamePage = (newName: string) => {
    if (!activePage || !newName.trim()) return;
    handleUpdatePage({
      ...activePage,
      name: newName.trim()
    });
    setCustomPromptType(null);
  };

  const handleDuplicatePage = () => {
    if (!activePage) return;
    const duplicated: FactoryPage = {
      ...activePage,
      id: `page-dup-${Date.now()}`,
      name: `${activePage.name} (Copy)`,
      lines: activePage.lines.map(line => ({ ...line, id: `line-dup-${Date.now()}-${Math.random()}` }))
    };

    setPages([...pages, duplicated]);
    setSelectedPageId(duplicated.id);
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) return;
    const remaining = pages.filter(p => p.id !== selectedPageId);
    setPages(remaining);
    setSelectedPageId(remaining[0].id);
  };

  const handleUpdateTargetRate = (newRate: number) => {
    if (!activePage || isNaN(newRate) || newRate <= 0 || !rateEditItemId) return;
    
    const targets = activePage.targetProducts || [{ itemId: activePage.targetItemId, rate: activePage.targetRate }];
    const updatedTargets = targets.map(t => {
      if (t.itemId === rateEditItemId) {
        return { ...t, rate: newRate };
      }
      return t;
    });

    handleUpdatePage(updatePageTargets(activePage, updatedTargets));
    setCustomPromptType(null);
    setRateEditItemId(null);
  };

  const filteredPages = useMemo(() => {
    return pages.filter(p => 
      p.name.toLowerCase().includes(searchPageTerm.toLowerCase()) ||
      (items[p.targetItemId]?.name || '').toLowerCase().includes(searchPageTerm.toLowerCase())
    );
  }, [pages, searchPageTerm, items]);

  return (
    <div className="min-h-screen factorio-container factorio-bg-mesh flex flex-col font-sans select-none antialiased">
      
      {/* 1. TOP HEADER STATUS BAR */}
      <header className="border-b-2 border-zinc-950 bg-zinc-900/95 py-2 px-4 flex items-center justify-between shadow-lg relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full led-green animate-pulse"></div>
          <h1 className="font-display font-bold uppercase tracking-widest text-[#e58e26] text-sm flex items-center gap-2">
            <span>⚙️</span> Factorio Planner
          </h1>

          {/* Navigation Tab bar */}
          <div className="flex bg-zinc-950 p-0.5 rounded border border-zinc-800 text-xs ml-4">
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-3 py-1.5 rounded font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-amber-950/50 text-[#e58e26] border border-[#a06010]/30 font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Planner
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-amber-950/50 text-[#e58e26] border border-[#a06010]/30 font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-amber-950/50 text-[#e58e26] border border-[#a06010]/30 font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Database (JSON)
            </button>
          </div>
        </div>

        <div className="font-mono text-[10px] text-zinc-500 font-bold bg-zinc-950 px-3 py-1 rounded border border-zinc-900 hidden sm:block">
          ENGINE v4.2.0 // GAME: {customDb.game_name?.toUpperCase() || 'FACTORIO'}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setPromptInputValue('');
              setCustomPromptType('preferences');
            }}
            className="factorio-btn text-xs px-3 py-1.5 flex items-center gap-1.5 uppercase font-bold"
          >
            <Settings size={14} className="text-[#e58e26]" />
            Preferences
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE OR MODULAR TABS */}
      {activeTab === 'editor' ? (
        <EditorTab customDb={customDb} onSave={setCustomDb} />
      ) : activeTab === 'database' ? (
        <DatabaseTab customDb={customDb} onSave={setCustomDb} />
      ) : (
        /* --- TAB 1: PLANNER --- */
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: ACTIVE PLANS TREE */}
          <aside className="w-80 border-r-2 border-zinc-950 bg-zinc-900/40 backdrop-blur-sm flex flex-col relative z-10 shrink-0">
            {/* Action buttons */}
            <div className="p-3 bg-zinc-950/40 border-b border-zinc-950 flex gap-1.5 justify-between">
              <button
                onClick={() => {
                  setPromptInputValue('');
                  setCustomPromptType('new-page');
                }}
                title="Create New Factory Line"
                className="factorio-btn p-2 flex-1 hover:text-white"
              >
                <Plus size={16} className="text-green-500" />
              </button>
              <button
                onClick={() => {
                  if (activePage) {
                    setPromptInputValue(activePage.name);
                    setCustomPromptType('rename');
                  }
                }}
                title="Rename Factory Line"
                className="factorio-btn p-2 flex-1 hover:text-white"
                disabled={!activePage}
              >
                <Edit2 size={15} className="text-[#e58e26]" />
              </button>
              <button
                onClick={handleDuplicatePage}
                title="Duplicate Factory Line"
                className="factorio-btn p-2 flex-1 hover:text-white"
                disabled={!activePage}
              >
                <Copy size={15} className="text-blue-400" />
              </button>
              <button
                onClick={handleDeletePage}
                title="Delete Factory Line"
                className="factorio-btn p-2 flex-1 hover:text-white"
                disabled={pages.length <= 1 || !activePage}
              >
                <Trash2 size={15} className="text-red-400" />
              </button>
            </div>

            {/* Search container */}
            <div className="p-3 bg-zinc-950/10 border-b border-zinc-950 relative">
              <Search size={14} className="absolute left-6 top-5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search factory plans..."
                value={searchPageTerm}
                onChange={(e) => setSearchPageTerm(e.target.value)}
                className="w-full bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded pl-8 pr-3 py-1.5 focus:border-[#e58e26] focus:outline-none"
              />
            </div>

            {/* Sơ đồ sản xuất list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-zinc-950/20">
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-zinc-500 uppercase tracking-wide">
                <FolderOpen size={12} className="text-zinc-500" />
                <span>Your Factory Lines</span>
              </div>

              <div className="space-y-0.5 pl-2 text-left">
                {filteredPages.map(page => {
                  const isSelected = page.id === selectedPageId;
                  return (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPageId(page.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-bold transition-all border text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#e58e26] text-zinc-950 border-[#b06a11] shadow-md'
                          : 'bg-zinc-800/10 hover:bg-zinc-800/30 text-zinc-300 border-transparent hover:text-white'
                      }`}
                    >
                      <div className={`p-0.5 rounded ${isSelected ? 'bg-zinc-950/10' : 'bg-zinc-950/30'}`}>
                        <ItemIcon id={page.targetItemId} size={18} />
                      </div>
                      <span className="truncate flex-1">{page.name}</span>
                      {isSelected && (
                        <ChevronRight size={14} className="text-zinc-950 shrink-0" />
                      )}
                    </button>
                  );
                })}

                {filteredPages.length === 0 && (
                  <div className="text-center py-6 text-zinc-600 text-xs italic">
                    No factory lines found
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* MAIN PRODUCTION WORKSPACE */}
          {activePage && solverResult ? (
            <main className="flex-1 flex flex-col overflow-hidden bg-[#181818]/95">
              
              {/* WORKSPACE SUB HEADER TAB */}
              <div className="border-b border-zinc-950 bg-zinc-900/60 p-3 flex flex-wrap items-center justify-between gap-3 shadow-md relative z-10">
                
                {/* Active page item title */}
                <div className="flex items-center gap-2 text-left">
                  <div className="p-1 rounded bg-zinc-950 border border-zinc-800">
                    <ItemIcon id={activePage.targetItemId} size={22} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                      {activePage.name}
                    </h2>
                  </div>
                </div>

                {/* View toggles & units */}
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Rate switch */}
                  <div className="flex items-center bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-xs font-bold gap-3">
                    <span className={activePage.rateUnit === 'second' ? 'text-[#e58e26]' : 'text-zinc-500'}>/sec</span>
                    <button
                      onClick={handleToggleRateUnit}
                      className="w-8 h-4 rounded-full bg-zinc-800 relative transition-colors duration-100 border border-zinc-950 cursor-pointer"
                    >
                      <div 
                        className={`w-3.5 h-3.5 rounded-full bg-[#e58e26] absolute top-px transition-all duration-100 ${
                          activePage.rateUnit === 'minute' ? 'left-4' : 'left-px'
                        }`}
                      ></div>
                    </button>
                    <span className={activePage.rateUnit === 'minute' ? 'text-[#e58e26]' : 'text-zinc-500'}>/min</span>
                  </div>

                  {/* Solver mode switch */}
                  <div className="flex items-center bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-xs font-bold gap-2">
                    <span className="text-zinc-400 uppercase text-[10px] tracking-wider">Solver:</span>
                    <span className="text-white uppercase text-[10px]">Traditional</span>
                    <button
                      onClick={handleToggleSolverMode}
                      className="w-8 h-4 rounded-full bg-zinc-800 relative transition-colors duration-100 border border-zinc-950 cursor-pointer"
                    >
                      <div 
                        className={`w-3.5 h-3.5 rounded-full bg-cyan-400 absolute top-px transition-all duration-100 ${
                          activePage.solverMode === 'matrix' ? 'left-4' : 'left-px'
                        }`}
                      ></div>
                    </button>
                    <span className="text-cyan-400 uppercase text-[10px]">Matrix</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${activePage.solverMode === 'matrix' ? 'led-yellow' : 'led-green'}`}></div>
                  </div>
                </div>

              </div>

              {/* THREE DYNAMIC SUMMARY BLOCKS (PRODUCTS, BYPRODUCTS, INGREDIENTS) */}
              <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 border-b border-zinc-950 bg-zinc-900/25 relative z-10 text-left">
                
                {/* 1. Products Block (Width: 1/4) */}
                <div className="lg:col-span-1 factorio-panel p-3 rounded flex flex-col justify-between min-h-[105px]">
                  <div className="flex items-center justify-between border-b border-zinc-950 pb-1.5 mb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Products</span>
                    <span className="w-1.5 h-1.5 rounded-full led-green"></span>
                  </div>

                  {/* Horizontal Scroll row for Products */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                    {(() => {
                      const targets = activePage.targetProducts || (activePage.targetItemId ? [{ itemId: activePage.targetItemId, rate: activePage.targetRate }] : []);
                      if (targets.length === 0) {
                        return <span className="text-[10px] text-zinc-500 italic">No products. Click + to add.</span>;
                      }
                      return targets.map((t, idx, arr) => (
                        <div 
                          key={t.itemId + '-' + idx} 
                          className="factorio-slot w-12 h-12 shrink-0 relative group cursor-pointer hover:border-[#e58e26] transition-all"
                          title={`${items[t.itemId]?.name || t.itemId}: ${t.rate} /s (Left-click to change rate, Middle-click to remove)`}
                          onClick={() => {
                            setRateEditItemId(t.itemId);
                            setPromptInputValue(t.rate.toString());
                            setCustomPromptType('rate');
                          }}
                          onAuxClick={(e) => {
                            if (e.button === 1) { // 1 is middle mouse button
                              e.preventDefault();
                              const updated = arr.filter((_, i) => i !== idx);
                              handleUpdatePage(updatePageTargets(activePage, updated));
                            }
                          }}
                        >
                          <ItemIcon id={t.itemId} size={36} />
                          
                          {/* Target rate badge */}
                          <div
                            className="factorio-badge text-green-400 border border-zinc-800 bg-zinc-950/85 hover:text-[#e58e26] leading-none"
                          >
                            {formatQuantity(t.rate)}
                          </div>

                          {/* Delete Target button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = arr.filter((_, i) => i !== idx);
                              handleUpdatePage(updatePageTargets(activePage, updated));
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border border-zinc-950 shadow cursor-pointer z-10"
                            title="Remove product"
                          >
                            ×
                          </button>
                        </div>
                      ));
                    })()}

                    {/* Add target product button next to last icon */}
                    <button 
                      onClick={() => setIsAddingProduct(true)}
                      className="factorio-slot w-10 h-10 border-dashed border-zinc-800 bg-zinc-950/10 hover:border-zinc-500 shrink-0 cursor-pointer"
                      title="Add another product"
                    >
                      <div className="text-zinc-600 font-bold text-lg">+</div>
                    </button>
                  </div>
                </div>

                {/* 2. Byproducts Block (Width: 1/4) */}
                <div className="lg:col-span-1 factorio-panel p-3 rounded flex flex-col justify-between min-h-[105px]">
                  <div className="flex items-center justify-between border-b border-zinc-950 pb-1.5 mb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Byproducts</span>
                    <span className="text-[9px] font-mono text-zinc-600">{solverResult.byproductsSummary.length} ACTIVE</span>
                  </div>

                  {/* Horizontal Scroll row for Byproducts */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                    {solverResult.byproductsSummary.map(bp => (
                      <div 
                        key={bp.itemId} 
                        className="factorio-slot w-11 h-11 shrink-0 group relative cursor-help"
                        title={`${items[bp.itemId]?.name || bp.itemId}: ${bp.rate.toFixed(1)}`}
                      >
                        <ItemIcon id={bp.itemId} size={32} />
                        <div className="factorio-badge text-green-400 font-mono">
                          {formatQuantity(bp.rate)}
                        </div>
                      </div>
                    ))}

                    {solverResult.byproductsSummary.length === 0 && (
                      <span className="text-zinc-600 text-[11px] italic py-2 pl-1 leading-normal">
                        No surplus byproducts
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Ingredients Block (Width: 2/4) */}
                <div className="lg:col-span-2 factorio-panel p-3 rounded flex flex-col justify-between min-h-[105px]">
                  <div className="flex items-center justify-between border-b border-zinc-950 pb-1.5 mb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Ingredients</span>
                    <span className="text-[10px] font-mono text-zinc-600">INPUTS</span>
                  </div>

                  {/* Horizontal Scroll row for Ingredients */}
                  <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                    {solverResult.ingredientsSummary.map(ing => {
                      const rateForUnit = ing.rate;

                      return (
                        <div 
                          key={ing.itemId} 
                          onClick={() => setSelectedIngredientId(ing.itemId)}
                          className="factorio-slot w-11 h-11 shrink-0 group relative cursor-pointer hover:border-[#e58e26] transition-all"
                          title={`${items[ing.itemId]?.name || ing.itemId}: ${rateForUnit.toFixed(1)} (Click to select recipe)`}
                        >
                          <ItemIcon id={ing.itemId} size={32} />
                          <div className="factorio-badge text-xs font-mono">
                            {formatQuantity(rateForUnit)}
                          </div>
                        </div>
                      );
                    })}
                    
                    {solverResult.ingredientsSummary.length === 0 && (
                      <span className="text-zinc-600 text-[11px] italic py-2 pl-1 leading-normal">
                        No raw ingredients required
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* 4. MAIN PRODUCTION STEPS TABLE */}
              <div className="flex-1 overflow-auto bg-[#131313] relative">
                <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                  
                  {/* Table Header */}
                  <thead className="bg-[#1b1b1b] border-b border-zinc-950 text-xs font-bold uppercase text-zinc-400 sticky top-0 z-10">
                    <tr>
                      <th className="w-24 px-4 py-2.5 tracking-wider border-r border-zinc-950 text-center">Step</th>
                      <th className="w-20 px-3 py-2.5 tracking-wider border-r border-zinc-950 text-center">Recipe</th>
                      <th className="w-48 px-4 py-2.5 tracking-wider border-r border-zinc-950">Machine & Count</th>
                      <th className="w-48 px-4 py-2.5 tracking-wider border-r border-zinc-950">Beacon Transmitter</th>
                      <th className="w-32 px-3 py-2.5 tracking-wider border-r border-zinc-950 text-center">Output Rate</th>
                      <th className="w-36 px-3 py-2.5 tracking-wider border-r border-zinc-950 text-center">Byproducts</th>
                      <th className="px-4 py-2.5 tracking-wider">Ingredient Requirements</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-zinc-950 font-medium text-left">
                    {solverResult.lines.map((line, index) => {
                      const recipe = recipes[line.recipeId];
                      if (!recipe) return null;
                      
                      const stepTargetId = line.lineConfig.targetItemId || recipe.products?.[0]?.itemId || line.recipeId;

                      return (
                        <tr 
                          key={line.lineConfig.id} 
                          className={`transition-colors text-xs ${
                            !line.enabled 
                              ? 'opacity-40 bg-zinc-950/30' 
                              : stepTargetId === activePage.targetItemId 
                                ? 'bg-amber-950/5 hover:bg-amber-950/10' 
                                : 'hover:bg-zinc-900/30'
                          }`}
                        >
                          
                          {/* Column 1: Step Order & Enabled Checkbox */}
                          <td className="px-3 py-3.5 border-r border-zinc-950 text-center select-none">
                            <div className="flex items-center justify-center gap-2">
                              {/* Sorting arrows */}
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  onClick={() => handleMoveLineOrder(index, 'up')}
                                  disabled={index === 0}
                                  className="text-zinc-600 hover:text-white disabled:opacity-20 hover:scale-110 transition-transform cursor-pointer"
                                  title="Move up"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  onClick={() => handleMoveLineOrder(index, 'down')}
                                  disabled={index === solverResult.lines.length - 1}
                                  className="text-zinc-600 hover:text-white disabled:opacity-20 hover:scale-110 transition-transform cursor-pointer"
                                  title="Move down"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>

                              {/* Active checkbox */}
                              <input
                                type="checkbox"
                                checked={line.enabled}
                                onChange={() => handleToggleLineEnabled(line.lineConfig.id)}
                                className="w-4 h-4 accent-[#e58e26] border-zinc-800 rounded bg-zinc-950 cursor-pointer"
                                title={line.enabled ? 'Click to disable' : 'Click to enable'}
                              />

                              {/* Remove step button */}
                              <button
                                onClick={() => handleRemoveLine(line.lineConfig.id)}
                                className="text-zinc-600 hover:text-red-500 hover:scale-110 transition-transform cursor-pointer ml-1"
                                title="Remove step"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>

                          {/* Column 2: Recipe Icon */}
                          <td className="px-2 py-3.5 border-r border-zinc-950 text-center">
                            <div className="flex justify-center">
                              <div 
                                className={`factorio-slot w-11 h-11 cursor-default ${
                                  stepTargetId === activePage.targetItemId ? 'border-amber-500 bg-[#e58e26]/5' : ''
                                  }`}
                                title={`${recipe.name} (producing ${items[stepTargetId]?.name || stepTargetId})`}
                              >
                                <ItemIcon id={line.recipeId} size={32} />
                              </div>
                            </div>
                          </td>

                          {/* Column 3: Machine & Count */}
                          <td className="px-4 py-3.5 border-r border-zinc-950">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setActiveLineIdForConfig(line.lineConfig.id)}
                                className="factorio-slot w-11 h-11 shrink-0 relative group hover:border-[#e58e26] cursor-pointer"
                                title="Click to config machine & modules"
                              >
                                <ItemIcon id={line.machineId} size={32} />
                                <div className="factorio-badge text-amber-500 font-bold bg-zinc-950/60 px-0.5 rounded leading-none border border-zinc-900/40">
                                  {formatQuantity(line.machineCount)}
                                </div>
                              </button>

                              <div className="flex flex-col gap-1 flex-1 min-w-0 text-left">
                                <span className="font-bold text-zinc-300 block text-[11px] truncate" title={machines[line.machineId]?.name}>
                                  {machines[line.machineId]?.name || line.machineId}
                                </span>
                                
                                <div className="flex gap-1">
                                  {line.lineConfig.modules.length > 0 ? (
                                    line.lineConfig.modules.map((modId, mIdx) => (
                                      <div 
                                        key={mIdx} 
                                        className="w-5 h-5 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center shrink-0"
                                        title={modules[modId]?.name}
                                      >
                                        <ItemIcon id={modId} size={15} />
                                      </div>
                                    ))
                                  ) : (
                                    <button
                                      onClick={() => setActiveLineIdForConfig(line.lineConfig.id)}
                                      className="text-[10px] text-zinc-500 hover:text-zinc-300 font-semibold uppercase flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <span>+ Modules</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 4: Beacon slots */}
                          <td className="px-4 py-3.5 border-r border-zinc-950">
                            {line.lineConfig.beaconCount > 0 ? (
                              <div className="flex items-center gap-3 text-left">
                                <button
                                  onClick={() => setActiveLineIdForConfig(line.lineConfig.id)}
                                  className="factorio-slot w-11 h-11 shrink-0 relative group hover:border-cyan-500 cursor-pointer"
                                  title="Edit beacon transmitter"
                                >
                                  <ItemIcon id="beacon" size={32} />
                                  <div className="factorio-badge text-cyan-400 font-bold bg-zinc-950/60 px-0.5 rounded leading-none border border-zinc-900/40">
                                    {line.lineConfig.beaconCount}
                                  </div>
                                </button>

                                <div className="flex flex-col gap-1">
                                  <span className="text-[11px] font-bold text-cyan-400">Beacon x{line.lineConfig.beaconCount}</span>
                                  <div className="flex gap-1">
                                    {line.lineConfig.beaconModules.map((modId, bIdx) => (
                                      <div 
                                        key={bIdx} 
                                        className="w-5 h-5 bg-zinc-950 border border-cyan-950 rounded flex items-center justify-center shrink-0"
                                        title={modules[modId]?.name}
                                      >
                                        <ItemIcon id={modId} size={14} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  const existingIdx = activePage.lines.findIndex(l => l.id === line.lineConfig.id);
                                  if (existingIdx !== -1) {
                                    let updated = [...activePage.lines];
                                    updated[existingIdx] = {
                                      ...updated[existingIdx],
                                      beaconCount: 8,
                                      beaconId: 'beacon',
                                      beaconModules: ['speed-module-3', 'speed-module-3']
                                    };
                                    handleUpdatePage({
                                      ...activePage,
                                      lines: updated
                                    });
                                  }
                                  setActiveLineIdForConfig(line.lineConfig.id);
                                }}
                                className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-400 flex items-center gap-1.5 px-3 py-2 rounded border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/10 cursor-pointer"
                              >
                                <span>+ Enable Beacon</span>
                              </button>
                            )}
                          </td>

                          {/* Column 5: Output Rate */}
                          <td className="px-3 py-3.5 border-r border-zinc-950 text-center">
                            <div className="flex justify-center">
                              <div 
                                className="factorio-slot w-11 h-11 shrink-0 relative group cursor-default hover:border-[#e58e26] transition-all"
                                title={`${items[stepTargetId]?.name || stepTargetId}: ${line.outputRate.toFixed(2)}`}
                              >
                                <ItemIcon id={stepTargetId} size={32} />
                                <div className="factorio-badge text-green-400 font-mono">
                                  {formatQuantity(line.outputRate)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 6: Byproducts Out Rate */}
                          <td className="px-3 py-3.5 border-r border-zinc-950 text-center">
                            <div className="flex justify-center">
                              {(() => {
                                const lineByproducts = recipe.products ? recipe.products.filter(p => p.itemId !== stepTargetId) : [];
                                return lineByproducts.length > 0 ? (
                                  <div className="flex flex-row overflow-x-auto max-w-[150px] pb-1 gap-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                    {lineByproducts.map((p, pIdx) => {
                                      const primaryProductYield = recipe.products?.find(pr => pr.itemId === stepTargetId)?.amount || recipe.products?.[0]?.amount || 1;
                                      const byRate = line.outputRate * (p.amount / primaryProductYield);
                                      return (
                                        <div 
                                          key={pIdx} 
                                          className="factorio-slot w-11 h-11 shrink-0 group relative cursor-help hover:border-[#e58e26] transition-all" 
                                          title={`${items[p.itemId]?.name || p.itemId}: ${byRate.toFixed(2)}`}
                                        >
                                          <ItemIcon id={p.itemId} size={32} />
                                          <div className="factorio-badge text-green-400 font-mono">
                                            {formatQuantity(byRate)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-wider">-</span>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Column 7: Step Ingredients Requirements */}
                          <td className="px-4 py-3.5 text-left">
                            <div className="flex flex-row overflow-x-auto max-w-[350px] pb-1 gap-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent justify-start">
                              {line.ingredients.map(ing => {
                                const ingRateForUnit = ing.rate;

                                return (
                                  <div 
                                    key={ing.itemId} 
                                    className="factorio-slot w-11 h-11 shrink-0 group relative cursor-help hover:border-[#e58e26] transition-all"
                                    title={`${items[ing.itemId]?.name || ing.itemId}: ${ingRateForUnit.toFixed(2)}`}
                                  >
                                    <ItemIcon id={ing.itemId} size={32} />
                                    <div className="factorio-badge text-xs font-mono">
                                      {formatQuantity(ingRateForUnit)}
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {line.ingredients.length === 0 && (
                                <span className="text-zinc-600 text-[11px] italic py-2">
                                  Direct raw mining / input
                                </span>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>

                </table>
              </div>

              {/* STATUS FOOTER BAR FOR INFO DETAIL */}
              <footer className="border-t-2 border-zinc-950 bg-zinc-950 py-2.5 px-4 flex flex-wrap items-center justify-between text-xs text-zinc-500 font-mono">
                <div className="flex items-center gap-4">
                  <span>GAME DATABASE: {customDb.game_name?.toUpperCase() || 'FACTORY PLANNER'}</span>
                  <span className="text-zinc-700">|</span>
                  <span>ACTIVE STEPS: <span className="text-amber-500 font-bold">
                    {solverResult.lines.filter(l => l.enabled).length}
                  </span></span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <HelpCircle size={12} className="text-zinc-600" />
                  <span>Production planner supports multi-product recipe co-products</span>
                </div>
              </footer>

            </main>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-8 text-center bg-[#181818]/95">
              <SlidersHorizontal size={48} className="text-zinc-700 mb-3 animate-pulse" />
              <p className="text-sm font-semibold">No factory planner is selected or active.</p>
              <button 
                onClick={() => handleCreatePage('Electronic Circuit Assembly', 'electronic-circuit')}
                className="factorio-btn mt-4 px-4 py-2 font-bold text-sm cursor-pointer"
              >
                Create Sample Factory
              </button>
            </div>
          )}

        </div>
      )}

      {/* --- ALL INTERACTIVE MODALS & OVERLAYS --- */}

      {/* A. TARGET RECIPE SELECTOR MODAL */}
      {isAddingProduct && activePage && (
        <RecipeSelector
          title="Select Target Product"
          selectedRecipeId={activePage.targetItemId}
          customDb={customDb}
          onClose={() => setIsAddingProduct(false)}
          onSelect={(itemId) => {
            const targets = activePage.targetProducts || (activePage.targetItemId ? [{ itemId: activePage.targetItemId, rate: activePage.targetRate }] : []);
            if (targets.some(t => t.itemId === itemId)) return; // duplicate block guard
            const updated = [...targets, { itemId, rate: activePage.rateUnit === 'minute' ? 60 : 1 }];
            handleUpdatePage(updatePageTargets(activePage, updated));
          }}
        />
      )}

      {/* B. STEP CONFIGURATION MODAL (MACHINE & MODULE CONFIG) */}
      {activeLineIdForConfig && activePage && (
        (() => {
          const lineConfig = activePage.lines.find(l => l.id === activeLineIdForConfig);
          if (!lineConfig) return null;
          return (
            <MachineConfigModal
              recipeId={lineConfig.recipeId}
              initialMachineId={lineConfig.machineId}
              initialModules={lineConfig.modules}
              initialBeaconCount={lineConfig.beaconCount}
              initialBeaconModules={lineConfig.beaconModules}
              onClose={() => setActiveLineIdForConfig(null)}
              onSave={handleSaveMachineConfig}
              customDb={customDb}
            />
          );
        })()
      )}

      {/* C. INLINE CUSTOM DIALOG PROMPTS */}
      <AnimatePresence>
        {customPromptType && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="factorio-panel w-full max-w-md p-5 text-left select-none overflow-hidden"
            >
              {/* Rename page dialog */}
              {customPromptType === 'rename' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-white uppercase tracking-wider border-b border-zinc-950 pb-2">
                    Rename Factory Line
                  </h3>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 font-bold uppercase">Factory Line Name:</label>
                    <input
                      type="text"
                      value={promptInputValue}
                      onChange={(e) => setPromptInputValue(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 px-3 py-2 rounded focus:border-[#e58e26] focus:outline-none text-sm font-medium"
                      placeholder="Enter new name..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenamePage(promptInputValue);
                        if (e.key === 'Escape') setCustomPromptType(null);
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setCustomPromptType(null)} className="factorio-btn px-4 py-1.5 uppercase font-bold text-xs cursor-pointer">Cancel</button>
                    <button onClick={() => handleRenamePage(promptInputValue)} className="factorio-btn-orange px-5 py-1.5 uppercase font-bold text-xs cursor-pointer">Save</button>
                  </div>
                </div>
              )}

              {/* New Page Creation dialog */}
              {customPromptType === 'new-page' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-white uppercase tracking-wider border-b border-zinc-950 pb-2">
                    Create New Factory Line
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1 text-left">
                      <label className="text-xs text-zinc-400 font-bold uppercase">Factory Line Name:</label>
                      <input
                        type="text"
                        value={promptInputValue}
                        onChange={(e) => setPromptInputValue(e.target.value)}
                        className="w-full bg-zinc-950 text-white border border-zinc-800 px-3 py-2 rounded focus:border-[#e58e26] focus:outline-none text-sm font-medium"
                        placeholder="e.g. Advanced Circuit Assembly"
                        autoFocus
                      />
                    </div>
                    
                    <div className="space-y-1 text-left">
                      <label className="text-xs text-zinc-400 font-bold uppercase">Default Target Product:</label>
                      <div className="text-xs text-zinc-500 italic leading-normal">
                        Electronic Circuit is selected by default. You can add or modify targets after creation.
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setCustomPromptType(null)} className="factorio-btn px-4 py-1.5 uppercase font-bold text-xs cursor-pointer">Cancel</button>
                    <button onClick={() => handleCreatePage(promptInputValue, 'electronic-circuit')} className="factorio-btn-orange px-5 py-1.5 uppercase font-bold text-xs cursor-pointer">Create</button>
                  </div>
                </div>
              )}

              {/* Rate changes dialog */}
              {customPromptType === 'rate' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-white uppercase tracking-wider border-b border-zinc-950 pb-2">
                    Change Required Production Rate
                  </h3>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs text-zinc-400 font-bold uppercase">Desired production rate (per {activePage?.rateUnit === 'minute' ? 'minute' : 'second'}):</label>
                    <input
                      type="number"
                      value={promptInputValue}
                      onChange={(e) => setPromptInputValue(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 px-3 py-2 rounded focus:border-[#e58e26] focus:outline-none text-sm font-mono font-bold"
                      placeholder="e.g. 45, 120, 360"
                      autoFocus
                      min="0.1"
                      step="any"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateTargetRate(parseFloat(promptInputValue));
                        if (e.key === 'Escape') setCustomPromptType(null);
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setCustomPromptType(null)} className="factorio-btn px-4 py-1.5 uppercase font-bold text-xs cursor-pointer">Cancel</button>
                    <button onClick={() => handleUpdateTargetRate(parseFloat(promptInputValue))} className="factorio-btn-orange px-5 py-1.5 uppercase font-bold text-xs cursor-pointer">Update</button>
                  </div>
                </div>
              )}

              {/* Preferences details modal */}
              {customPromptType === 'preferences' && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-white uppercase tracking-wider border-b border-zinc-950 pb-2">
                    System Dashboard
                  </h3>
                  
                  <div className="space-y-2.5 text-xs text-zinc-300 text-left">
                    <div className="p-3 rounded bg-zinc-950/40 border border-zinc-900 space-y-1.5">
                      <div className="font-bold text-[#e58e26] uppercase">Reset Planner Lines</div>
                      <p className="text-zinc-400 font-normal leading-relaxed">
                        Reset all factory planner pages to original templates. This will overwrite current lines.
                      </p>
                      <button 
                        onClick={() => {
                          setPages(DEFAULT_PAGES);
                          setSelectedPageId(DEFAULT_PAGES[0].id);
                          setCustomPromptType(null);
                        }}
                        className="factorio-btn px-3 py-1 mt-1 text-[10px] font-bold uppercase hover:text-white cursor-pointer"
                      >
                        Reset to Defaults
                      </button>
                    </div>

                    <div className="p-3 rounded bg-zinc-950/40 border border-zinc-900 space-y-1 font-normal leading-relaxed text-zinc-400">
                      <div className="font-bold text-zinc-300 uppercase">System Information</div>
                      <div>• Calculations: Real-time supply & demand relaxation solver</div>
                      <div>• Format: Full JSON database editing and importing</div>
                      <div>• Capability: Parallel solving for multi-product recipes</div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button onClick={() => setCustomPromptType(null)} className="factorio-btn px-5 py-1.5 uppercase font-bold text-xs cursor-pointer">Close</button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* D. INGREDIENT RECIPE SELECTOR MODAL */}
      {selectedIngredientId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="factorio-panel w-full max-w-2xl p-5 text-left select-none overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-950 pb-2 mb-4 shrink-0">
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                <ItemIcon id={selectedIngredientId} size={24} />
                Select Recipe for {items[selectedIngredientId]?.name || selectedIngredientId}
              </h3>
              <button 
                onClick={() => setSelectedIngredientId(null)}
                className="text-zinc-500 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Recipes List (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {matchingRecipes.length > 0 ? (
                matchingRecipes.map((recipe: any) => {
                  return (
                    <div 
                      key={recipe.id}
                      className="p-4 rounded border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-950 hover:border-[#e58e26] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Recipe Info & Ingredients */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <ItemIcon id={recipe.id} size={28} />
                          <div>
                            <div className="text-sm font-bold text-white leading-tight">{recipe.name || recipe.id}</div>
                            <div className="text-zinc-500 text-[10px] uppercase font-mono">
                              Category: {recipe.category} • Time: {recipe.crafting_time || recipe.time}s
                            </div>
                          </div>
                        </div>

                        {/* Ingredients & Products Row */}
                        <div className="flex flex-wrap items-center gap-4 pt-1">
                          {/* Ingredients */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 font-bold text-[10px] uppercase">Needs:</span>
                            <div className="flex gap-1.5">
                              {recipe.ingredients.map((ing: any, i: number) => (
                                <div key={i} className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px]" title={items[ing.itemId]?.name || ing.itemId}>
                                  <ItemIcon id={ing.itemId} size={14} />
                                  <span className="font-mono text-zinc-300 font-bold">{ing.count || ing.amount}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="text-zinc-600 font-bold">→</div>

                          {/* Yield Products */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 font-bold text-[10px] uppercase">Yields:</span>
                            <div className="flex gap-1.5">
                              {recipe.products ? (
                                recipe.products.map((p: any, i: number) => (
                                  <div key={i} className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px]" title={items[p.itemId]?.name || p.itemId}>
                                    <ItemIcon id={p.itemId} size={14} />
                                    <span className="font-mono text-green-400 font-bold">{p.amount}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px]" title={items[recipe.id]?.name || recipe.id}>
                                  <ItemIcon id={recipe.id} size={14} />
                                  <span className="font-mono text-green-400 font-bold">{recipe.yield || 1}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Select Button */}
                      <div className="shrink-0">
                        <button
                          onClick={() => handleAddRecipeStep(recipe.id, selectedIngredientId || undefined)}
                          className="factorio-btn-orange w-full md:w-auto px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Select Recipe
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-zinc-500 space-y-3">
                  <p className="text-sm">
                    No recipes produce <span className="text-white font-bold">{items[selectedIngredientId]?.name || selectedIngredientId}</span>.
                  </p>
                  <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed font-normal">
                    This is a raw resource or raw input. You must provide this material from external source extraction/mining (like coal, copper-ore, iron-ore, crude-oil, stone, water) rather than assembling it.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-950 mt-4 shrink-0">
              <button 
                onClick={() => setSelectedIngredientId(null)} 
                className="factorio-btn px-5 py-2 uppercase font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
