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
  ArrowRight,
  HelpCircle, 
  Check, 
  X, 
  ChevronRight, 
  SlidersHorizontal,
  FolderOpen,
  GripVertical
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

// Format exact up to 3 decimal places without trailing zeros (e.g. 1.234)
export function formatExactTooltip(value: number): string {
  return (Math.round(value * 1000) / 1000).toString();
}

// Display up to 3 decimal places accurately on badge values (e.g. 1.234, 1.25, 1.2, 1)
export function formatBadgeValue(value: number): string {
  if (value === 0) return '0';
  let val = Math.round(value * 1000) / 1000;
  if (value > 0 && val === 0) val = 0.001;
  if (val >= 1000000) {
    const mValue = Math.round((value / 1000000) * 1000) / 1000;
    return `${mValue}M`;
  }
  if (val >= 1000) {
    const kValue = Math.round((value / 1000) * 1000) / 1000;
    return `${kValue}k`;
  }
  return `${val}`;
}

function normalizePages(loadedPages: FactoryPage[]): FactoryPage[] {
  return loadedPages.map(page => {
    if ((page as any).normalizedToSec) {
      return page;
    }

    const unit = page.rateUnit || 'minute';
    const beltSpeed = page.beltSpeed || 15;

    const convertToSec = (oldRate: number) => {
      if (unit === 'second') return oldRate;
      if (unit === 'minute') return oldRate / 60;
      return oldRate * beltSpeed;
    };

    const targetProducts = page.targetProducts || (page.targetItemId ? [{ itemId: page.targetItemId, rate: page.targetRate }] : []);
    const updatedTargets = targetProducts.map(t => ({
      ...t,
      rate: convertToSec(t.rate)
    }));

    const primaryTarget = updatedTargets[0];

    return {
      ...page,
      targetItemId: primaryTarget ? primaryTarget.itemId : (page.targetItemId || ''),
      targetRate: primaryTarget ? primaryTarget.rate : (convertToSec(page.targetRate) || 0),
      targetProducts: updatedTargets,
      normalizedToSec: true
    };
  });
}

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'planner' | 'editor' | 'database'>('planner');
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  const [customDb, setCustomDb] = useState(() => {
    const saved = localStorage.getItem('factory_planner_custom_db');
    return saved ? JSON.parse(saved) : initialCustomDb;
  });

  const [pages, setPages] = useState<FactoryPage[]>(() => {
    const saved = localStorage.getItem('factory_planner_pages');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_PAGES;
    return normalizePages(parsed);
  });

  const [selectedPageId, setSelectedPageId] = useState<string>(() => {
    const saved = localStorage.getItem('factory_planner_selected_id');
    return saved || (DEFAULT_PAGES[0]?.id || '');
  });

  const [searchPageTerm, setSearchPageTerm] = useState('');
  
  // Drag and drop state for factory lines
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);

  const handlePageDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pageId);
  };

  const handlePageDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPageId !== pageId) {
      setDragOverPageId(pageId);
    }
  };

  const handlePageDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    if (!draggedPageId || draggedPageId === targetPageId) {
      setDraggedPageId(null);
      setDragOverPageId(null);
      return;
    }

    const fromIndex = pages.findIndex(p => p.id === draggedPageId);
    const toIndex = pages.findIndex(p => p.id === targetPageId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const updatedPages = [...pages];
      const [movedPage] = updatedPages.splice(fromIndex, 1);
      updatedPages.splice(toIndex, 0, movedPage);
      setPages(updatedPages);
    }

    setDraggedPageId(null);
    setDragOverPageId(null);
  };

  const handlePageDragEnd = () => {
    setDraggedPageId(null);
    setDragOverPageId(null);
  };
  
  // Custom alerts, prompts and modals state
  const [activeLineIdForConfig, setActiveLineIdForConfig] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [rateEditItemId, setRateEditItemId] = useState<string | null>(null);
  
  // Custom Dialog boxes instead of window prompts
  const [customPromptType, setCustomPromptType] = useState<'rename' | 'new-page' | 'rate' | 'preferences' | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');

  // Step recipe cursor-following tooltip state
  const [hoveredRecipeTooltip, setHoveredRecipeTooltip] = useState<{
    recipe: any;
    recipeId: string;
    machineId?: string;
    machineCount?: number;
    x: number;
    y: number;
  } | null>(null);
  
  // Auto Load Icons from Assets state
  const [loadIconsStatus, setLoadIconsStatus] = useState<{
    state: 'idle' | 'loading' | 'success' | 'error';
    count?: number;
    error?: string;
  }>({ state: 'idle' });

  const handleAutoLoadIcons = async () => {
    setLoadIconsStatus({ state: 'loading' });
    try {
      const res = await fetch("/api/assets");
      const contentType = res.headers.get("content-type") || "";
      
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          try {
            const errData = await res.json();
            throw new Error(errData.message || errData.error || `HTTP ${res.status}`);
          } catch (e: any) {
            throw new Error(e.message || `HTTP ${res.status}`);
          }
        } else if (contentType.includes("text/html")) {
          throw new Error("Server is restarting or not ready (returned HTML). Please wait a few seconds.");
        } else {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
      }

      if (contentType.includes("text/html")) {
        throw new Error("Server is restarting or not ready. Please wait a few seconds and try again.");
      }
      const assetsMap = await res.json();

      const newDb = { ...customDb };
      let updatedCount = 0;

      // 1. Items
      if (newDb.items) {
        newDb.items = { ...newDb.items };
        Object.entries(newDb.items).forEach(([id, item]: [string, any]) => {
          if (!item.icon_url && assetsMap[`items:${id}`]) {
            newDb.items[id] = { ...item, icon_url: assetsMap[`items:${id}`] };
            updatedCount++;
          }
        });
      }

      // 2. Recipes
      if (newDb.recipes) {
        newDb.recipes = { ...newDb.recipes };
        Object.entries(newDb.recipes).forEach(([id, recipe]: [string, any]) => {
          if (!recipe.icon_url && assetsMap[`recipes:${id}`]) {
            newDb.recipes[id] = { ...recipe, icon_url: assetsMap[`recipes:${id}`] };
            updatedCount++;
          }
        });
      }

      // 3. Machines
      if (newDb.machines) {
        newDb.machines = { ...newDb.machines };
        Object.entries(newDb.machines).forEach(([id, machine]: [string, any]) => {
          if (!machine.icon_url && assetsMap[`machines:${id}`]) {
            newDb.machines[id] = { ...machine, icon_url: assetsMap[`machines:${id}`] };
            updatedCount++;
          }
        });
      }

      // 4. Modifiers
      if (newDb.modifiers) {
        newDb.modifiers = { ...newDb.modifiers };
        Object.entries(newDb.modifiers).forEach(([id, modifier]: [string, any]) => {
          if (!modifier.icon_url && assetsMap[`modifiers:${id}`]) {
            newDb.modifiers[id] = { ...modifier, icon_url: assetsMap[`modifiers:${id}`] };
            updatedCount++;
          }
        });
      }

      if (updatedCount > 0) {
        setCustomDb(newDb);
        setLoadIconsStatus({ state: 'success', count: updatedCount });
      } else {
        setLoadIconsStatus({ state: 'success', count: 0 });
      }
    } catch (err: any) {
      console.error(err);
      setLoadIconsStatus({ state: 'error', error: err?.message || "Unknown error" });
    }
  };

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

  const displayRate = (ratePerSec: number) => {
    const unit = activePage?.rateUnit || 'minute';
    const beltSpeed = activePage?.beltSpeed || 15;
    if (unit === 'second') return ratePerSec;
    if (unit === 'minute') return ratePerSec * 60;
    return ratePerSec / beltSpeed;
  };

  const convertDisplayToSec = (displayValue: number, unit: 'second' | 'minute' | 'belt', beltSpeed: number = 15) => {
    if (unit === 'second') return displayValue;
    if (unit === 'minute') return displayValue / 60;
    return displayValue * beltSpeed;
  };

  // Load from server API on mount
  useEffect(() => {
    async function loadFromServer() {
      try {
        const res = await fetch("/api/db");
        if (res.ok) {
          const data = await res.json();
          if (data.customDb) setCustomDb(data.customDb);
          if (data.pages) setPages(data.pages);
          if (data.selectedPageId) setSelectedPageId(data.selectedPageId);
        }
      } catch (err) {
        console.error("Error loading state from server:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadFromServer();
  }, []);

  // Save changes to local storage & server API
  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem('factory_planner_custom_db', JSON.stringify(customDb));
    localStorage.setItem('factory_planner_pages', JSON.stringify(pages));
    if (selectedPageId) {
      localStorage.setItem('factory_planner_selected_id', selectedPageId);
    }

    const saveToServer = async () => {
      setSaveStatus('saving');
      try {
        const res = await fetch("/api/db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ customDb, pages, selectedPageId })
        });
        if (res.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        console.error("Error saving state to server:", err);
        setSaveStatus('error');
      }
    };

    const timer = setTimeout(saveToServer, 500);
    return () => clearTimeout(timer);
  }, [customDb, pages, selectedPageId, isLoaded]);

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

  const handleSetRateUnit = (nextUnit: 'second' | 'minute' | 'belt') => {
    if (!activePage) return;
    handleUpdatePage({
      ...activePage,
      rateUnit: nextUnit
    });
  };

  const handleUpdateBeltSpeed = (speed: number) => {
    if (!activePage) return;
    handleUpdatePage({
      ...activePage,
      beltSpeed: speed
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

  const handleMoveLineOrder = (index: number, direction: 'up' | 'down', isShiftClick?: boolean) => {
    if (!activePage) return;
    if (index === 0 && direction === 'up') return;
    if (index === activePage.lines.length - 1 && direction === 'down') return;

    let updatedPageLines = [...activePage.lines];
    
    if (isShiftClick) {
      const element = updatedPageLines.splice(index, 1)[0];
      if (direction === 'up') {
        updatedPageLines.unshift(element);
      } else {
        updatedPageLines.push(element);
      }
    } else {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = updatedPageLines[index];
      updatedPageLines[index] = updatedPageLines[targetIndex];
      updatedPageLines[targetIndex] = temp;
    }

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
    modifiers: any[];
  }) => {
    if (!activePage || !activeLineIdForConfig) return;

    const existingIdx = activePage.lines.findIndex(l => l.id === activeLineIdForConfig);
    let updatedLines = [...activePage.lines];

    if (existingIdx !== -1) {
      updatedLines[existingIdx] = {
        ...updatedLines[existingIdx],
        machineId: config.machineId,
        modifiers: config.modifiers
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
      targetRate: 1, // Store as 1 item/second (corresponds to 60/minute)
      targetProducts: [{ itemId: targetItem || 'electronic-circuit', rate: 1 }],
      rateUnit: 'minute',
      solverMode: 'traditional',
      itemsViewMode: 'items-m',
      lines: [],
      beltSpeed: 15,
      normalizedToSec: true
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
        const rateInSec = convertDisplayToSec(newRate, activePage.rateUnit || 'minute', activePage.beltSpeed || 15);
        return { ...t, rate: rateInSec };
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
    <div className="h-screen max-h-screen overflow-hidden factorio-container factorio-bg-mesh flex flex-col font-sans select-none antialiased">
      
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

        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-500 font-mono" title="Saving changes directly to the server">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Syncing...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-500 font-mono" title="All changes saved to the server's db.json">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Synced to Server
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-500 font-mono" title="Unable to sync to server database">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              Sync Error
            </span>
          )}

          <div className="font-mono text-[10px] text-zinc-500 font-bold bg-zinc-950 px-3 py-1 rounded border border-zinc-900 hidden sm:block">
            ENGINE v4.2.0 // GAME: {customDb.game_name?.toUpperCase() || 'FACTORIO'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setPromptInputValue('');
              setLoadIconsStatus({ state: 'idle' });
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

              <div className="space-y-1 pl-1 text-left">
                {filteredPages.map(page => {
                  const isSelected = page.id === selectedPageId;
                  const isDragging = page.id === draggedPageId;
                  const isDragOver = page.id === dragOverPageId;

                  return (
                    <div
                      key={page.id}
                      draggable
                      onDragStart={(e) => handlePageDragStart(e, page.id)}
                      onDragOver={(e) => handlePageDragOver(e, page.id)}
                      onDrop={(e) => handlePageDrop(e, page.id)}
                      onDragEnd={handlePageDragEnd}
                      className={`relative group flex items-center rounded text-xs font-bold transition-all border text-left cursor-pointer select-none ${
                        isDragging ? 'opacity-30 scale-95' : 'opacity-100'
                      } ${
                        isDragOver ? 'border-t-2 border-t-[#e58e26] bg-[#e58e26]/10' : ''
                      } ${
                        isSelected
                          ? 'bg-[#e58e26] text-zinc-950 border-[#b06a11] shadow-md'
                          : 'bg-zinc-800/10 hover:bg-zinc-800/30 text-zinc-300 border-transparent hover:text-white'
                      }`}
                    >
                      {/* Drag handle icon */}
                      <div 
                        className={`pl-2 pr-0.5 py-2 cursor-grab active:cursor-grabbing shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${
                          isSelected ? 'text-zinc-950' : 'text-zinc-400'
                        }`}
                        title="Kéo thả để thay đổi vị trí"
                      >
                        <GripVertical size={13} />
                      </div>

                      <button
                        onClick={() => setSelectedPageId(page.id)}
                        className="flex-1 flex items-center gap-2 py-2 pr-2.5 min-w-0 text-left bg-transparent border-none cursor-pointer"
                      >
                        <div className={`p-0.5 rounded shrink-0 ${isSelected ? 'bg-zinc-950/10' : 'bg-zinc-950/30'}`}>
                          <ItemIcon id={page.targetItemId} size={18} type="item" />
                        </div>
                        <span className="truncate flex-1">{page.name}</span>
                        {isSelected && (
                          <ChevronRight size={14} className="text-zinc-950 shrink-0" />
                        )}
                      </button>
                    </div>
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
                
                {/* Left Side: Title */}
                <div className="flex items-center gap-4 flex-wrap text-left">
                  {/* Active page item title */}
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-zinc-950 border border-zinc-800">
                      <ItemIcon id={activePage.targetItemId} size={22} type="item" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                        {activePage.name}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Right Side: Rate units, Belt speed, Solver mode switch */}
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Belt speed input (shown only when 'belt' is selected) - placed to the left of rate switch */}
                  {activePage.rateUnit === 'belt' && (
                    <div className="flex items-center bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-xs font-bold gap-1.5">
                      <span className="text-zinc-400 uppercase text-[10px] tracking-wider">Belt Speed:</span>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={activePage.beltSpeed || 15}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            handleUpdateBeltSpeed(val);
                          }
                        }}
                        className="w-14 bg-zinc-900 border border-zinc-700 rounded px-1 text-center text-white text-xs font-mono font-bold focus:border-[#e58e26] focus:outline-none"
                      />
                      <span className="text-zinc-500 text-[10px]">items/s</span>
                    </div>
                  )}

                  {/* Rate switch - reordered: belt, /sec, /min */}
                  <div className="flex items-center bg-zinc-950 p-1 rounded border border-zinc-800 text-xs font-bold gap-1">
                    <button
                      onClick={() => handleSetRateUnit('belt')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                        activePage.rateUnit === 'belt'
                          ? 'bg-[#e58e26] text-zinc-950 font-bold shadow'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      belt
                    </button>
                    <button
                      onClick={() => handleSetRateUnit('second')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                        activePage.rateUnit === 'second'
                          ? 'bg-[#e58e26] text-zinc-950 font-bold shadow'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      /sec
                    </button>
                    <button
                      onClick={() => handleSetRateUnit('minute')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                        activePage.rateUnit === 'minute'
                          ? 'bg-[#e58e26] text-zinc-950 font-bold shadow'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      /min
                    </button>
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
                      return targets.map((t, idx, arr) => {
                        const displayVal = displayRate(t.rate);
                        return (
                          <div 
                            key={t.itemId + '-' + idx} 
                            className="factorio-slot w-12 h-12 shrink-0 relative group cursor-pointer hover:border-[#e58e26] transition-all"
                            title={`${items[t.itemId]?.name || t.itemId}: ${formatExactTooltip(displayVal)}${activePage.rateUnit === 'second' ? ' /s' : activePage.rateUnit === 'minute' ? ' /m' : ' belts'} (Left-click to change rate, Middle-click to remove)`}
                            onClick={() => {
                              setRateEditItemId(t.itemId);
                              const currentDisplayVal = displayRate(t.rate);
                              const displayValString = (Math.round(currentDisplayVal * 10000) / 10000).toString();
                              setPromptInputValue(displayValString);
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
                            <ItemIcon id={t.itemId} size={36} type="item" />
                            
                            {/* Target rate badge */}
                            <div
                              className="factorio-badge text-green-400 border border-zinc-800 bg-zinc-950/85 hover:text-[#e58e26] leading-none"
                            >
                              {formatBadgeValue(displayVal)}
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
                        );
                      });
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
                    {solverResult.byproductsSummary.map(bp => {
                      const displayVal = displayRate(bp.rate);
                      return (
                        <div 
                          key={bp.itemId} 
                          className="factorio-slot w-11 h-11 shrink-0 group relative cursor-help"
                          title={`${items[bp.itemId]?.name || bp.itemId}: ${formatExactTooltip(displayVal)}${activePage.rateUnit === 'second' ? ' /s' : activePage.rateUnit === 'minute' ? ' /m' : ' belts'}`}
                        >
                          <ItemIcon id={bp.itemId} size={32} type="item" />
                          <div className="factorio-badge text-green-400 font-mono">
                            {formatBadgeValue(displayVal)}
                          </div>
                        </div>
                      );
                    })}

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
                      const rateForUnit = displayRate(ing.rate);

                      return (
                        <div 
                          key={ing.itemId} 
                          onClick={() => setSelectedIngredientId(ing.itemId)}
                          className="factorio-slot w-11 h-11 shrink-0 group relative cursor-pointer hover:border-[#e58e26] transition-all"
                          title={`${items[ing.itemId]?.name || ing.itemId}: ${formatExactTooltip(rateForUnit)}${activePage.rateUnit === 'second' ? ' /s' : activePage.rateUnit === 'minute' ? ' /m' : ' belts'} (Click to select recipe)`}
                        >
                          <ItemIcon id={ing.itemId} size={32} type="item" />
                          <div className="factorio-badge text-xs font-mono">
                            {formatBadgeValue(rateForUnit)}
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
                  <thead className="bg-[#1b1b1b] border-b border-zinc-950 text-[11px] font-bold uppercase text-zinc-400 sticky top-0 z-10">
                    <tr>
                      <th className="w-20 px-2 py-1.5 tracking-wider border-r border-zinc-950 text-center">Step</th>
                      <th className="w-16 px-2 py-1.5 tracking-wider border-r border-zinc-950 text-center">Recipe</th>
                      <th className="w-44 px-3 py-1.5 tracking-wider border-r border-zinc-950">Machine & Count</th>
                      <th className="w-48 px-3 py-1.5 tracking-wider border-r border-zinc-950">Modifiers</th>
                      <th className="w-28 px-2 py-1.5 tracking-wider border-r border-zinc-950 text-center">Output Rate</th>
                      <th className="w-32 px-2 py-1.5 tracking-wider border-r border-zinc-950 text-center">Byproducts</th>
                      <th className="px-3 py-1.5 tracking-wider">Ingredient Requirements</th>
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
                          <td className="px-2 py-1 border-r border-zinc-950 text-center select-none">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Sorting arrows */}
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  onClick={(e) => handleMoveLineOrder(index, 'up', e.shiftKey)}
                                  disabled={index === 0}
                                  className="text-zinc-600 hover:text-white disabled:opacity-20 hover:scale-110 transition-transform cursor-pointer"
                                  title="Move up (Shift+Click to move to top)"
                                >
                                  <ArrowUp size={11} />
                                </button>
                                <button
                                  onClick={(e) => handleMoveLineOrder(index, 'down', e.shiftKey)}
                                  disabled={index === solverResult.lines.length - 1}
                                  className="text-zinc-600 hover:text-white disabled:opacity-20 hover:scale-110 transition-transform cursor-pointer"
                                  title="Move down (Shift+Click to move to bottom)"
                                >
                                  <ArrowDown size={11} />
                                </button>
                              </div>

                              {/* Active checkbox */}
                              <input
                                type="checkbox"
                                checked={line.enabled}
                                onChange={() => handleToggleLineEnabled(line.lineConfig.id)}
                                className="w-3.5 h-3.5 accent-[#e58e26] border-zinc-800 rounded bg-zinc-950 cursor-pointer"
                                title={line.enabled ? 'Click to disable' : 'Click to enable'}
                              />

                              {/* Remove step button */}
                              <button
                                onClick={() => handleRemoveLine(line.lineConfig.id)}
                                className="text-zinc-600 hover:text-red-500 hover:scale-110 transition-transform cursor-pointer ml-0.5"
                                title="Remove step"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>

                          {/* Column 2: Recipe Icon */}
                          <td className="px-1.5 py-1 border-r border-zinc-950 text-center">
                            <div className="flex justify-center">
                              <div 
                                className={`factorio-slot w-9 h-9 cursor-pointer relative ${
                                  stepTargetId === activePage.targetItemId ? 'border-amber-500 bg-[#e58e26]/5' : ''
                                }`}
                                onMouseEnter={(e) => setHoveredRecipeTooltip({
                                  recipe,
                                  recipeId: line.recipeId,
                                  machineId: line.machineId,
                                  machineCount: line.machineCount,
                                  x: e.clientX,
                                  y: e.clientY
                                })}
                                onMouseMove={(e) => setHoveredRecipeTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                                onMouseLeave={() => setHoveredRecipeTooltip(null)}
                              >
                                <ItemIcon id={line.recipeId} size={26} type="recipe" />
                              </div>
                            </div>
                          </td>

                          {/* Column 3: Machine & Count */}
                          <td className="px-3 py-1 border-r border-zinc-950">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveLineIdForConfig(line.lineConfig.id)}
                                className="factorio-slot w-9 h-9 shrink-0 relative group hover:border-[#e58e26] cursor-pointer"
                                title={`${machines[line.machineId]?.name || line.machineId} (Exact Count: ${formatExactTooltip(line.machineCount)}) - Click to config machine & modifiers`}
                              >
                                <ItemIcon id={line.machineId} size={26} type="machine" />
                                <div className="factorio-badge text-amber-500 font-bold bg-zinc-950/60 px-0.5 rounded leading-none border border-zinc-900/40">
                                  {formatBadgeValue(line.machineCount)}
                                </div>
                              </button>

                              <div className="flex flex-col flex-1 min-w-0 text-left justify-center leading-tight">
                                <span className="font-bold text-zinc-300 block text-xs truncate" title={machines[line.machineId]?.name}>
                                  {machines[line.machineId]?.name || line.machineId}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-semibold font-mono block uppercase" title={`Exact count: ${formatExactTooltip(line.machineCount)}`}>
                                  x{formatExactTooltip(line.machineCount)} {line.machineCount === 1 ? 'Machine' : 'Machines'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Column 4: Modifiers */}
                          <td className="px-3 py-1 border-r border-zinc-950">
                            <div className="flex items-center gap-1.5 max-w-full">
                              {line.lineConfig.modifiers && line.lineConfig.modifiers.length > 0 ? (
                                <div className="flex gap-1 overflow-x-auto max-w-full scrollbar-none">
                                  {line.lineConfig.modifiers.map((lm, lmIdx) => (
                                    <div 
                                      key={lmIdx} 
                                      onClick={() => setActiveLineIdForConfig(line.lineConfig.id)}
                                      className="factorio-slot w-8 h-8 flex items-center justify-center bg-zinc-950/50 border border-zinc-900 hover:border-[#e58e26] shrink-0 transition-colors rounded shadow-inner relative cursor-pointer"
                                      title={`${modules[lm.id]?.name || lm.id} x${lm.count}`}
                                    >
                                      <ItemIcon id={lm.id} size={20} type="modifier" />
                                      <div className="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold bg-[#e58e26] text-zinc-950 border border-zinc-950/60 leading-none py-0.5 px-0.5 rounded shadow">
                                        {lm.count}
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Compact Add button */}
                                  <button
                                    onClick={() => setActiveLineIdForConfig(line.lineConfig.id)}
                                    className="w-8 h-8 border border-dashed border-zinc-800 hover:border-zinc-600 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-300 text-xs shrink-0 cursor-pointer transition-colors bg-zinc-950/10"
                                    title="Add / Edit Modifiers"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setActiveLineIdForConfig(line.lineConfig.id)}
                                  className="text-[10px] font-semibold text-zinc-600 hover:text-zinc-400 flex items-center gap-1 px-2 py-1 rounded border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/10 cursor-pointer"
                                >
                                  <span>+ Modifiers</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Column 5: Output Rate */}
                          <td className="px-2 py-1 border-r border-zinc-950 text-center">
                            <div className="flex justify-center">
                              {(() => {
                                const outDisp = displayRate(line.outputRate);
                                return (
                                  <div 
                                    className="factorio-slot w-9 h-9 shrink-0 relative group cursor-default hover:border-[#e58e26] transition-all"
                                    title={`${items[stepTargetId]?.name || stepTargetId}: ${formatExactTooltip(outDisp)}${activePage.rateUnit === 'second' ? ' /s' : activePage.rateUnit === 'minute' ? ' /m' : ' belts'}`}
                                  >
                                    <ItemIcon id={stepTargetId} size={26} />
                                    <div className="factorio-badge text-green-400 font-mono">
                                      {formatBadgeValue(outDisp)}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Column 6: Byproducts Out Rate */}
                          <td className="px-2 py-1 border-r border-zinc-950 text-center">
                            <div className="flex justify-center">
                              {(() => {
                                const lineByproducts = recipe.products ? recipe.products.filter(p => p.itemId !== stepTargetId) : [];
                                return lineByproducts.length > 0 ? (
                                  <div className="flex flex-row overflow-x-auto max-w-[140px] gap-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                    {lineByproducts.map((p, pIdx) => {
                                      const primaryProductYield = recipe.products?.find(pr => pr.itemId === stepTargetId)?.amount || recipe.products?.[0]?.amount || 1;
                                      const byRate = line.outputRate * (p.amount / primaryProductYield);
                                      const byDisp = displayRate(byRate);
                                      return (
                                        <div 
                                          key={pIdx} 
                                          className="factorio-slot w-9 h-9 shrink-0 group relative cursor-help hover:border-[#e58e26] transition-all" 
                                          title={`${items[p.itemId]?.name || p.itemId}: ${formatExactTooltip(byDisp)}${activePage.rateUnit === 'second' ? ' /s' : activePage.rateUnit === 'minute' ? ' /m' : ' belts'}`}
                                        >
                                          <ItemIcon id={p.itemId} size={26} />
                                          <div className="factorio-badge text-green-400 font-mono">
                                            {formatBadgeValue(byDisp)}
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
                          <td className="px-3 py-1 text-left">
                            <div className="flex flex-row overflow-x-auto max-w-[350px] gap-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent justify-start">
                              {line.ingredients.map(ing => {
                                const ingRateForUnit = displayRate(ing.rate);

                                return (
                                  <div 
                                    key={ing.itemId} 
                                    className="factorio-slot w-9 h-9 shrink-0 group relative cursor-help hover:border-[#e58e26] transition-all"
                                    title={`${items[ing.itemId]?.name || ing.itemId}: ${formatExactTooltip(ingRateForUnit)}${activePage.rateUnit === 'second' ? ' /s' : activePage.rateUnit === 'minute' ? ' /m' : ' belts'}`}
                                  >
                                    <ItemIcon id={ing.itemId} size={26} type="item" />
                                    <div className="factorio-badge text-xs font-mono">
                                      {formatBadgeValue(ingRateForUnit)}
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {line.ingredients.length === 0 && (
                                <span className="text-zinc-600 text-[10px] italic py-1">
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
              initialModifiers={lineConfig.modifiers || []}
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
                    <label className="text-xs text-zinc-400 font-bold uppercase">Desired production rate (in {activePage?.rateUnit === 'minute' ? 'items/minute' : activePage?.rateUnit === 'second' ? 'items/second' : 'belts'}):</label>
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

                    <div className="p-3 rounded bg-zinc-950/40 border border-zinc-900 space-y-1.5">
                      <div className="font-bold text-[#e58e26] uppercase">Auto Scan & Load Icons</div>
                      <p className="text-zinc-400 font-normal leading-relaxed">
                        Scan all database items, recipes, machines, and modules that are missing an icon URL, and automatically map them to existing matching files in the assets directory.
                      </p>
                      {loadIconsStatus.state === 'idle' && (
                        <button 
                          onClick={handleAutoLoadIcons}
                          className="factorio-btn px-3 py-1 mt-1 text-[10px] font-bold uppercase hover:text-white cursor-pointer"
                        >
                          Scan & Load Icons
                        </button>
                      )}
                      {loadIconsStatus.state === 'loading' && (
                        <div className="text-zinc-400 font-mono text-[10px] uppercase font-bold animate-pulse mt-1">
                          Scanning folders and matching files...
                        </div>
                      )}
                      {loadIconsStatus.state === 'success' && (
                        <div className="space-y-1.5 mt-1">
                          <div className="text-green-500 font-mono text-[10px] uppercase font-bold">
                            Successfully resolved {loadIconsStatus.count} missing icons!
                          </div>
                          <button 
                            onClick={handleAutoLoadIcons}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline uppercase font-bold cursor-pointer"
                          >
                            Scan again
                          </button>
                        </div>
                      )}
                      {loadIconsStatus.state === 'error' && (
                        <div className="space-y-1.5 mt-1">
                          <div className="text-red-500 font-mono text-[10px] uppercase font-bold">
                            Error: {loadIconsStatus.error}
                          </div>
                          <button 
                            onClick={handleAutoLoadIcons}
                            className="factorio-btn px-3 py-1 text-[10px] font-bold uppercase hover:text-white cursor-pointer animate-pulse"
                          >
                            Retry scan
                          </button>
                        </div>
                      )}
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
                <ItemIcon id={selectedIngredientId} size={24} type="item" />
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
                          <ItemIcon id={recipe.id} size={28} type="recipe" />
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
                                  <ItemIcon id={ing.itemId} size={14} type="item" />
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
                                    <ItemIcon id={p.itemId} size={14} type="item" />
                                    <span className="font-mono text-green-400 font-bold">{p.amount}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px]" title={items[recipe.id]?.name || recipe.id}>
                                  <ItemIcon id={recipe.id} size={14} type="item" />
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

      {/* Step Recipe Cursor-Following Tooltip */}
      {hoveredRecipeTooltip && (() => {
        const { recipe, recipeId, x, y } = hoveredRecipeTooltip;
        const tooltipWidth = 280;
        const tooltipHeight = 110;
        
        const left = (x + 18 + tooltipWidth > window.innerWidth) ? Math.max(10, x - tooltipWidth - 10) : x + 18;
        const top = (y + 18 + tooltipHeight > window.innerHeight) ? Math.max(10, y - tooltipHeight - 10) : y + 18;

        const categoryName = (customDb?.categories && recipe.category && customDb.categories[recipe.category]?.name) || recipe.category;

        const ingredients = recipe.ingredients || [];
        const products = (recipe.products && recipe.products.length > 0) 
          ? recipe.products 
          : [{ itemId: recipeId, amount: 1 }];

        return (
          <div 
            style={{ left: `${left}px`, top: `${top}px` }}
            className="fixed z-50 pointer-events-none factorio-panel border border-amber-600/60 rounded-md p-2.5 shadow-2xl text-left bg-zinc-950/95 backdrop-blur-md text-xs space-y-2 min-w-[220px] max-w-[320px]"
          >
            {/* Header: Recipe Name & Category */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5">
              <div className="font-bold text-xs text-[#e58e26] truncate uppercase tracking-wide">
                {recipe.name || recipeId}
              </div>
              {categoryName && (
                <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400 shrink-0">
                  {categoryName}
                </span>
              )}
            </div>

            {/* Recipe Production Flow: Inputs -> [Time + Arrow] -> Outputs */}
            <div className="flex items-center justify-between gap-2 bg-zinc-900/80 p-2 rounded border border-zinc-800/60">
              
              {/* Left: Ingredients */}
              <div className="flex items-center gap-1 flex-wrap justify-start min-w-[40px]">
                {ingredients.length > 0 ? (
                  ingredients.map((ing: any, idx: number) => {
                    const ingItemId = ing.itemId || ing.id;
                    const ingAmount = ing.count ?? ing.amount ?? 1;
                    const itemObj = items[ingItemId];
                    return (
                      <div 
                        key={idx} 
                        className="factorio-slot w-8 h-8 shrink-0 relative group"
                        title={`${itemObj?.name || ingItemId}: ${ingAmount}`}
                      >
                        <ItemIcon id={ingItemId} size={22} type="item" />
                        <div className="factorio-badge text-[9px] text-amber-400 font-mono font-bold leading-none">
                          {formatBadgeValue(ingAmount)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-[10px] text-zinc-500 italic px-1">Raw</span>
                )}
              </div>

              {/* Middle: Crafting Time & Arrow */}
              <div className="flex flex-col items-center justify-center shrink-0 px-1.5 text-center">
                <span className="text-[10px] font-mono font-bold text-amber-400/90 whitespace-nowrap leading-none mb-0.5">
                  ⏱️ {recipe.time ?? recipe.crafting_time ?? 1}s
                </span>
                <ArrowRight size={16} className="text-[#e58e26]" />
              </div>

              {/* Right: Products */}
              <div className="flex items-center gap-1 flex-wrap justify-end min-w-[40px]">
                {products.map((prod: any, idx: number) => {
                  const prodItemId = prod.itemId || prod.id || recipeId;
                  const prodAmount = prod.amount ?? prod.count ?? 1;
                  const itemObj = items[prodItemId];
                  return (
                    <div 
                      key={idx} 
                      className="factorio-slot w-8 h-8 shrink-0 relative group"
                      title={`${itemObj?.name || prodItemId}: ${prodAmount}`}
                    >
                      <ItemIcon id={prodItemId} size={22} type="item" />
                      <div className="factorio-badge text-[9px] text-green-400 font-mono font-bold leading-none">
                        {formatBadgeValue(prodAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
