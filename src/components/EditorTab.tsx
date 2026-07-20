import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, ChevronDown, ChevronRight, Upload } from 'lucide-react';
import { ItemIcon } from './ItemIcon';

interface EditorTabProps {
  customDb: any;
  onSave: (newDb: any) => void;
}

type SectionType = 'items' | 'recipes' | 'machines' | 'modifiers' | 'categories';

export const EditorTab: React.FC<EditorTabProps> = ({ customDb, onSave }) => {
  const [activeSection, setActiveSection] = useState<SectionType>('items');
  const [categorySubTab, setCategorySubTab] = useState<'items' | 'machines'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Form States
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('no-category');
  const [itemIconUrl, setItemIconUrl] = useState('');

  const [machineId, setMachineId] = useState('');
  const [machineName, setMachineName] = useState('');
  const [machineSpeed, setMachineSpeed] = useState(1.0);
  const [machineSlots, setMachineSlots] = useState(2);
  const [machineCategory, setMachineCategory] = useState('assembling-machine');
  const [machineIconUrl, setMachineIconUrl] = useState('');

  const [recipeId, setRecipeId] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [recipeTime, setRecipeTime] = useState(1.0);
  const [recipeCategory, setRecipeCategory] = useState('assembling-machine');
  const [recipeIngredients, setRecipeIngredients] = useState<{ itemId: string; amount: number }[]>([]);
  const [recipeProducts, setRecipeProducts] = useState<{ itemId: string; amount: number }[]>([]);
  const [recipeIconUrl, setRecipeIconUrl] = useState('');

  const [modifierId, setModifierId] = useState('');
  const [modifierName, setModifierName] = useState('');
  const [modSpeed, setModSpeed] = useState(0.0);
  const [modProd, setModProd] = useState(0.0);
  const [modifierIconUrl, setModifierIconUrl] = useState('');

  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');

  // Available item list for selection in recipes
  const allItemsList = useMemo(() => {
    return Object.keys(customDb.items || {});
  }, [customDb.items]);

  // Available categories list
  const dbCategories = useMemo(() => {
    const cats = customDb.categories || {
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
  }, [customDb.categories]);

  // Available machine categories list
  const dbMachineCategories = useMemo(() => {
    const cats = customDb.machine_categories || {
      'assembling-machine': 'Assembling Machines',
      'furnace': 'Furnaces',
      'chemical-plant': 'Chemical Plants',
      'miner': 'Mining Drills'
    };
    return cats;
  }, [customDb.machine_categories]);

  const filteredEntries = useMemo(() => {
    let data = {};
    if (activeSection === 'categories') {
      data = categorySubTab === 'items'
        ? (customDb.categories || {})
        : (customDb.machine_categories || {
            'assembling-machine': 'Assembling Machines',
            'furnace': 'Furnaces',
            'chemical-plant': 'Chemical Plants',
            'miner': 'Mining Drills'
          });
    } else {
      data = customDb[activeSection] || {};
    }
    return Object.entries(data).filter(([id, val]: [string, any]) => {
      const name = typeof val === 'string' ? val : (val.name || '');
      return id.toLowerCase().includes(searchTerm.toLowerCase()) || 
             name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [customDb, activeSection, searchTerm, categorySubTab]);

  // Group items by category for cleaner display in EditorTab list
  const groupedItems = useMemo(() => {
    if (activeSection !== 'items') return null;
    
    const groups: Record<string, [string, any][]> = {};
    
    // Initialize groups with all dbCategories keys to preserve order
    Object.keys(dbCategories).forEach(catKey => {
      groups[catKey] = [];
    });
    
    // Ensure "no-category" group is always there
    if (!groups['no-category']) {
      groups['no-category'] = [];
    }

    filteredEntries.forEach(([id, val]: [string, any]) => {
      // If the item's category is specified and actually exists in dbCategories, use it. Otherwise, fall back to "no-category"
      const cat = (val.category && val.category in dbCategories) ? val.category : 'no-category';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push([id, val]);
    });

    // Only return groups that actually have matching items
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredEntries, activeSection, dbCategories]);

  // Group machines by category for cleaner display in EditorTab list
  const groupedMachines = useMemo(() => {
    if (activeSection !== 'machines') return null;
    
    const groups: Record<string, [string, any][]> = {};
    
    // Default machine categories
    const machineCategories: Record<string, string> = {
      'assembling-machine': 'Assembling Machines',
      'furnace': 'Furnaces',
      'chemical-plant': 'Chemical Plants',
      'miner': 'Mining Drills'
    };
    
    // Initialize groups with standard machine categories to preserve standard order
    Object.keys(machineCategories).forEach(catKey => {
      groups[catKey] = [];
    });
    
    filteredEntries.forEach(([id, val]: [string, any]) => {
      const cat = val.category || 'assembling-machine';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push([id, val]);
    });
    
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredEntries, activeSection]);

  // Load entry into form for editing
  const handleStartEdit = (id: string, val: any) => {
    setEditingId(id);
    if (activeSection === 'items') {
      setItemId(id);
      setItemName(val.name || '');
      setItemCategory(val.category || 'no-category');
      setItemIconUrl(val.icon_url || '');
    } else if (activeSection === 'machines') {
      setMachineId(id);
      setMachineName(val.name || '');
      setMachineSpeed(val.crafting_speed ?? 1.0);
      setMachineSlots(val.slots ?? 2);
      setMachineCategory(val.category || 'assembling-machine');
      setMachineIconUrl(val.icon_url || '');
    } else if (activeSection === 'recipes') {
      setRecipeId(id);
      setRecipeName(val.name || '');
      setRecipeTime(val.crafting_time ?? 1.0);
      setRecipeCategory(val.category || 'assembling-machine');
      setRecipeIngredients(val.ingredients ? [...val.ingredients] : []);
      setRecipeProducts(val.products ? [...val.products] : [{ itemId: id, amount: 1 }]);
      setRecipeIconUrl(val.icon_url || '');
    } else if (activeSection === 'modifiers') {
      setModifierId(id);
      setModifierName(val.name || '');
      setModSpeed(val.speed_bonus ?? 0.0);
      setModProd(val.productivity_bonus ?? 0.0);
      setModifierIconUrl(val.icon_url || '');
    } else if (activeSection === 'categories') {
      setCatId(id);
      setCatName(typeof val === 'string' ? val : (val.name || ''));
    }
  };

  const handleAddNew = () => {
    setEditingId('_new_');
    if (activeSection === 'items') {
      setItemId('');
      setItemName('');
      setItemCategory('no-category');
      setItemIconUrl('');
    } else if (activeSection === 'machines') {
      setMachineId('');
      setMachineName('');
      setMachineSpeed(1.0);
      setMachineSlots(2);
      setMachineCategory('assembling-machine');
      setMachineIconUrl('');
    } else if (activeSection === 'recipes') {
      setRecipeId('');
      setRecipeName('');
      setRecipeTime(1.0);
      setRecipeCategory('assembling-machine');
      setRecipeIngredients([]);
      setRecipeProducts([]);
      setRecipeIconUrl('');
    } else if (activeSection === 'modifiers') {
      setModifierId('');
      setModifierName('');
      setModSpeed(0.0);
      setModProd(0.0);
      setModifierIconUrl('');
    } else if (activeSection === 'categories') {
      setCatId('');
      setCatName('');
    }
  };

  const handleSave = () => {
    const updatedDb = { ...customDb };
    let idToSave = '';
    let valToSave: any = {};

    if (activeSection === 'items') {
      idToSave = itemId.trim() || itemName.trim().toLowerCase().replace(/\s+/g, '-');
      if (!idToSave) return;
      valToSave = { name: itemName, category: itemCategory, icon_url: itemIconUrl.trim() };
      updatedDb.items = { ...updatedDb.items, [idToSave]: valToSave };
    } else if (activeSection === 'machines') {
      idToSave = machineId.trim() || machineName.trim().toLowerCase().replace(/\s+/g, '-');
      if (!idToSave) return;
      valToSave = {
        name: machineName,
        crafting_speed: Number(machineSpeed),
        slots: Number(machineSlots),
        category: machineCategory,
        icon_url: machineIconUrl.trim()
      };
      updatedDb.machines = { ...updatedDb.machines, [idToSave]: valToSave };
    } else if (activeSection === 'recipes') {
      idToSave = recipeId.trim() || recipeName.trim().toLowerCase().replace(/\s+/g, '-');
      if (!idToSave) return;
      valToSave = {
        name: recipeName,
        crafting_time: Number(recipeTime),
        category: recipeCategory,
        ingredients: recipeIngredients,
        products: recipeProducts.length > 0 ? recipeProducts : [{ itemId: idToSave, amount: 1 }],
        icon_url: recipeIconUrl.trim()
      };
      updatedDb.recipes = { ...updatedDb.recipes, [idToSave]: valToSave };
    } else if (activeSection === 'modifiers') {
      idToSave = modifierId.trim() || modifierName.trim().toLowerCase().replace(/\s+/g, '-');
      if (!idToSave) return;
      valToSave = {
        name: modifierName,
        speed_bonus: Number(modSpeed),
        productivity_bonus: Number(modProd),
        icon_url: modifierIconUrl.trim()
      };
      updatedDb.modifiers = { ...updatedDb.modifiers, [idToSave]: valToSave };
    } else if (activeSection === 'categories') {
      idToSave = catId.trim() || catName.trim().toLowerCase().replace(/\s+/g, '-');
      if (!idToSave) return;
      valToSave = catName;
      if (categorySubTab === 'items') {
        if (!updatedDb.categories) updatedDb.categories = {};
        updatedDb.categories = { ...updatedDb.categories, [idToSave]: valToSave };
      } else {
        if (!updatedDb.machine_categories) {
          updatedDb.machine_categories = {
            'assembling-machine': 'Assembling Machines',
            'furnace': 'Furnaces',
            'chemical-plant': 'Chemical Plants',
            'miner': 'Mining Drills'
          };
        }
        updatedDb.machine_categories = { ...updatedDb.machine_categories, [idToSave]: valToSave };
      }
    }

    // If editing existing ID and ID has changed, delete old one
    if (editingId && editingId !== '_new_' && editingId !== idToSave) {
      if (activeSection === 'categories') {
        if (categorySubTab === 'items') {
          if (updatedDb.categories) {
            delete updatedDb.categories[editingId];
          }
        } else {
          if (updatedDb.machine_categories) {
            delete updatedDb.machine_categories[editingId];
          } else {
            const defaultMachineCats = {
              'assembling-machine': 'Assembling Machines',
              'furnace': 'Furnaces',
              'chemical-plant': 'Chemical Plants',
              'miner': 'Mining Drills'
            };
            const custom = { ...defaultMachineCats };
            delete custom[editingId];
            updatedDb.machine_categories = custom;
          }
        }
      } else {
        if (updatedDb[activeSection]) {
          delete updatedDb[activeSection][editingId];
        }
      }
    }

    onSave(updatedDb);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updatedDb = { ...customDb };
    if (activeSection === 'categories') {
      if (categorySubTab === 'items') {
        if (updatedDb.categories) {
          delete updatedDb.categories[id];
        }
      } else {
        if (!updatedDb.machine_categories) {
          updatedDb.machine_categories = {
            'assembling-machine': 'Assembling Machines',
            'furnace': 'Furnaces',
            'chemical-plant': 'Chemical Plants',
            'miner': 'Mining Drills'
          };
        }
        delete updatedDb.machine_categories[id];
      }
    } else {
      if (updatedDb[activeSection]) {
        delete updatedDb[activeSection][id];
      }
    }
    onSave(updatedDb);
    if (deleteConfirmId === id) {
      setDeleteConfirmId(null);
    }
    if (editingId === id) {
      setEditingId(null);
    }
  };

  // Recipe ingredients array tools
  const handleAddIngredient = () => {
    const firstItem = allItemsList[0] || '';
    setRecipeIngredients([...recipeIngredients, { itemId: firstItem, amount: 1 }]);
  };

  const handleUpdateIngredient = (index: number, key: 'itemId' | 'amount', value: any) => {
    const updated = [...recipeIngredients];
    updated[index] = {
      ...updated[index],
      [key]: key === 'amount' ? Number(value) : value
    };
    setRecipeIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  // Recipe products array tools
  const handleAddProduct = () => {
    const firstItem = allItemsList[0] || '';
    setRecipeProducts([...recipeProducts, { itemId: firstItem, amount: 1 }]);
  };

  const handleUpdateProduct = (index: number, key: 'itemId' | 'amount', value: any) => {
    const updated = [...recipeProducts];
    updated[index] = {
      ...updated[index],
      [key]: key === 'amount' ? Number(value) : value
    };
    setRecipeProducts(updated);
  };

  const handleRemoveProduct = (index: number) => {
    setRecipeProducts(recipeProducts.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-zinc-950/40 text-left h-full">
      {/* List Sidebar */}
      <div className="w-80 border-r border-zinc-950 flex flex-col shrink-0 min-h-0 bg-zinc-900/10">
        {/* Navigation Categories */}
        <div className="grid grid-cols-5 border-b border-zinc-950 bg-zinc-900/40">
          {(['items', 'recipes', 'machines', 'modifiers', 'categories'] as SectionType[]).map(sec => (
            <button
              key={sec}
              onClick={() => {
                setActiveSection(sec);
                setSearchTerm('');
                setEditingId(null);
              }}
              className={`py-2.5 text-[9px] font-bold uppercase text-center border-r border-zinc-950 last:border-0 transition-colors ${
                activeSection === sec
                  ? 'bg-amber-950/30 text-[#e58e26]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {sec === 'items' ? 'Items' : sec === 'recipes' ? 'Recipes' : sec === 'machines' ? 'Machines' : sec === 'modifiers' ? 'Mods' : 'Cats'}
            </button>
          ))}
        </div>

        {/* Sub-tab selection bar for Categories */}
        {activeSection === 'categories' && (
          <div className="grid grid-cols-2 border-b border-zinc-950 bg-zinc-950/60 p-1 gap-1 shrink-0">
            <button
              onClick={() => {
                setCategorySubTab('items');
                setEditingId(null);
              }}
              className={`py-1.5 text-[9px] font-bold uppercase rounded text-center transition-colors cursor-pointer select-none ${
                categorySubTab === 'items'
                  ? 'bg-[#e58e26] text-zinc-950'
                  : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Item & Recipe Cats
            </button>
            <button
              onClick={() => {
                setCategorySubTab('machines');
                setEditingId(null);
              }}
              className={`py-1.5 text-[9px] font-bold uppercase rounded text-center transition-colors cursor-pointer select-none ${
                categorySubTab === 'machines'
                  ? 'bg-[#e58e26] text-zinc-950'
                  : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Machine Cats
            </button>
          </div>
        )}

        {/* Search */}
        <div className="p-3 border-b border-zinc-950 relative shrink-0">
          <Search size={14} className="absolute left-6 top-5.5 text-zinc-500" />
          <input
            type="text"
            placeholder={`Search ${activeSection}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded pl-8 pr-3 py-1.5 focus:border-[#e58e26] focus:outline-none"
          />
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            onClick={handleAddNew}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-zinc-800 hover:border-[#e58e26] text-zinc-400 hover:text-[#e58e26] rounded text-xs font-bold transition-all"
          >
            <Plus size={14} />
            <span>Add New Entry</span>
          </button>

          {activeSection === 'items' && groupedItems ? (
            <div className="space-y-2 mt-2">
              {groupedItems.map(([catKey, itemsList]) => {
                const catName = dbCategories[catKey] || (catKey === 'no-category' ? 'No Category' : catKey);
                const isCollapsed = !!collapsedCategories[catKey];
                return (
                  <div key={catKey} className="space-y-1">
                    <button
                      onClick={() => {
                        setCollapsedCategories(prev => ({
                          ...prev,
                          [catKey]: !prev[catKey]
                        }));
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 bg-zinc-950/60 hover:bg-zinc-950 rounded border border-zinc-900 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[#e58e26]">✦</span>
                        <span>{catName}</span>
                        <span className="text-[9px] text-zinc-500 font-normal">({itemsList.length})</span>
                      </span>
                      {isCollapsed ? <ChevronRight size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-1 pl-1 pt-1">
                        {itemsList.map(([id, val]: [string, any]) => {
                          const displayName = typeof val === 'string' ? val : (val.name || id);
                          return (
                            <div
                              key={id}
                              className={`group flex items-center justify-between p-2 rounded border text-xs font-semibold transition-all ${
                                editingId === id
                                  ? 'bg-[#e58e26]/10 border-[#e58e26] text-white'
                                  : 'bg-zinc-900/10 hover:bg-zinc-800/20 border-transparent text-zinc-300'
                              }`}
                            >
                              <div
                                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                                onClick={() => handleStartEdit(id, val)}
                              >
                                <div className="p-0.5 rounded bg-zinc-950/30 shrink-0">
                                  <ItemIcon id={id} size={22} customUrl={val?.icon_url} />
                                </div>
                                <div className="truncate text-left">
                                  <div className="font-bold text-white">{displayName}</div>
                                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{id}</div>
                                </div>
                              </div>

                              <div className="flex gap-1 items-center">
                                {deleteConfirmId === id ? (
                                  <div className="flex items-center gap-1.5 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                                    <span className="text-[9px] text-red-200 uppercase font-bold">Sure?</span>
                                    <button
                                      onClick={() => handleDelete(id)}
                                      className="text-red-400 hover:text-red-200 cursor-pointer"
                                      title="Confirm delete"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setDeleteConfirmId(null);
                                        handleStartEdit(id, val);
                                      }}
                                      className="p-1 hover:text-white text-zinc-500 transition-colors cursor-pointer"
                                      title="Edit entry"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(id)}
                                      className="p-1 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer"
                                      title="Delete entry"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : activeSection === 'machines' && groupedMachines ? (
            <div className="space-y-2 mt-2">
              {groupedMachines.map(([catKey, machinesList]) => {
                const machineCategories: Record<string, string> = {
                  'assembling-machine': 'Assembling Machines',
                  'furnace': 'Furnaces',
                  'chemical-plant': 'Chemical Plants',
                  'miner': 'Mining Drills'
                };
                const catName = machineCategories[catKey] || catKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const isCollapsed = !!collapsedCategories[`machine-${catKey}`];
                return (
                  <div key={catKey} className="space-y-1">
                    <button
                      onClick={() => {
                        setCollapsedCategories(prev => ({
                          ...prev,
                          [`machine-${catKey}`]: !prev[`machine-${catKey}`]
                        }));
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 bg-zinc-950/60 hover:bg-zinc-950 rounded border border-zinc-900 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[#e58e26]">✦</span>
                        <span>{catName}</span>
                        <span className="text-[9px] text-zinc-500 font-normal">({machinesList.length})</span>
                      </span>
                      {isCollapsed ? <ChevronRight size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-1 pl-1 pt-1">
                        {machinesList.map(([id, val]: [string, any]) => {
                          const displayName = typeof val === 'string' ? val : (val.name || id);
                          return (
                            <div
                              key={id}
                              className={`group flex items-center justify-between p-2 rounded border text-xs font-semibold transition-all ${
                                editingId === id
                                  ? 'bg-[#e58e26]/10 border-[#e58e26] text-white'
                                  : 'bg-zinc-900/10 hover:bg-zinc-800/20 border-transparent text-zinc-300'
                              }`}
                            >
                              <div
                                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                                onClick={() => handleStartEdit(id, val)}
                              >
                                <div className="p-0.5 rounded bg-zinc-950/30 shrink-0">
                                  <ItemIcon id={id} size={22} customUrl={val?.icon_url} />
                                </div>
                                <div className="truncate text-left">
                                  <div className="font-bold text-white">{displayName}</div>
                                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{id}</div>
                                </div>
                              </div>

                              <div className="flex gap-1 items-center">
                                {deleteConfirmId === id ? (
                                  <div className="flex items-center gap-1.5 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                                    <span className="text-[9px] text-red-200 uppercase font-bold">Sure?</span>
                                    <button
                                      onClick={() => handleDelete(id)}
                                      className="text-red-400 hover:text-red-200 cursor-pointer"
                                      title="Confirm delete"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setDeleteConfirmId(null);
                                        handleStartEdit(id, val);
                                      }}
                                      className="p-1 hover:text-white text-zinc-500 transition-colors cursor-pointer"
                                      title="Edit entry"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(id)}
                                      className="p-1 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer"
                                      title="Delete entry"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            filteredEntries.map(([id, val]: [string, any]) => {
              const displayName = typeof val === 'string' ? val : (val.name || id);
              return (
                <div
                  key={id}
                  className={`group flex items-center justify-between p-2 rounded border text-xs font-semibold transition-all ${
                    editingId === id
                      ? 'bg-[#e58e26]/10 border-[#e58e26] text-white'
                      : 'bg-zinc-900/10 hover:bg-zinc-800/20 border-transparent text-zinc-300'
                  }`}
                >
                  <div
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleStartEdit(id, val)}
                  >
                    <div className="p-0.5 rounded bg-zinc-950/30 shrink-0">
                      <ItemIcon id={id} size={22} customUrl={val?.icon_url} />
                    </div>
                    <div className="truncate text-left">
                      <div className="font-bold text-white">{displayName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{id}</div>
                    </div>
                  </div>

                  <div className="flex gap-1 items-center">
                    {deleteConfirmId === id ? (
                      <div className="flex items-center gap-1.5 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                        <span className="text-[9px] text-red-200 uppercase font-bold">Sure?</span>
                        <button
                          onClick={() => handleDelete(id)}
                          className="text-red-400 hover:text-red-200 cursor-pointer"
                          title="Confirm delete"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                          title="Cancel"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setDeleteConfirmId(null);
                            handleStartEdit(id, val);
                          }}
                          className="p-1 hover:text-white text-zinc-500 transition-colors cursor-pointer"
                          title="Edit entry"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(id)}
                          className="p-1 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor Panel Form */}
      <div className="flex-1 p-5 overflow-y-auto min-h-0 bg-zinc-950/20">
        {editingId ? (
          <div className="factorio-panel max-w-xl p-5 rounded space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-950 pb-2.5">
              <div className="flex items-center gap-2">
                <ItemIcon 
                  id={editingId === '_new_' ? 'generic' : editingId} 
                  size={28} 
                  customUrl={
                    activeSection === 'items' ? itemIconUrl : 
                    activeSection === 'recipes' ? recipeIconUrl : 
                    activeSection === 'machines' ? machineIconUrl : 
                    activeSection === 'modifiers' ? modifierIconUrl : undefined
                  } 
                />
                <h3 className="font-display font-bold text-base text-[#e58e26] uppercase tracking-wider">
                  {editingId === '_new_' ? 'Create New' : 'Update'}: {activeSection.replace(/s$/, '')}
                </h3>
              </div>
              <button
                onClick={() => setEditingId(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* --- SECTION: ITEMS FORM --- */}
            {activeSection === 'items' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">ID (Unique slug):</label>
                    <input
                      type="text"
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                      disabled={editingId !== '_new_'}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                      placeholder="e.g. copper-plate"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Display Name:</label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-bold"
                      placeholder="e.g. Copper Plate"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">Category:</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    {Object.entries(dbCategories).map(([catKey, name]: [string, any]) => (
                      <option key={catKey} value={catKey}>{name} ({catKey})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">Custom Icon/Image URL (Optional):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={itemIconUrl}
                      onChange={(e) => setItemIconUrl(e.target.value)}
                      className="flex-1 bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono"
                      placeholder="e.g. /images/copper.png or base64 or URL"
                    />
                    <label className="factorio-btn text-[10px] px-3 py-1.5 font-bold uppercase cursor-pointer flex items-center gap-1 shrink-0 select-none">
                      <Upload size={12} />
                      Browse
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setItemIconUrl(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-zinc-500 italic block mt-1 leading-relaxed">
                    Supports local file paths, web URLs, base64 strings, or browse a local image file.
                  </span>
                </div>
              </div>
            )}

            {/* --- SECTION: MACHINES FORM --- */}
            {activeSection === 'machines' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">ID:</label>
                    <input
                      type="text"
                      value={machineId}
                      onChange={(e) => setMachineId(e.target.value)}
                      disabled={editingId !== '_new_'}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                      placeholder="assembling-machine-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Machine Name:</label>
                    <input
                      type="text"
                      value={machineName}
                      onChange={(e) => setMachineName(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-bold"
                      placeholder="Assembling Machine 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Base Speed Multiplier:</label>
                    <input
                      type="number"
                      step="any"
                      value={machineSpeed}
                      onChange={(e) => setMachineSpeed(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Module Slots:</label>
                    <input
                      type="number"
                      value={machineSlots}
                      onChange={(e) => setMachineSlots(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">Compatible Category:</label>
                  <select
                    value={machineCategory}
                    onChange={(e) => setMachineCategory(e.target.value)}
                    className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    {Object.entries(dbMachineCategories).map(([key, name]: [string, any]) => (
                      <option key={key} value={key}>{name} ({key})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">Custom Icon/Image URL (Optional):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={machineIconUrl}
                      onChange={(e) => setMachineIconUrl(e.target.value)}
                      className="flex-1 bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono"
                      placeholder="e.g. /images/machine.png or base64 or URL"
                    />
                    <label className="factorio-btn text-[10px] px-3 py-1.5 font-bold uppercase cursor-pointer flex items-center gap-1 shrink-0 select-none">
                      <Upload size={12} />
                      Browse
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setMachineIconUrl(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-zinc-500 italic block mt-1 leading-relaxed">
                    Supports local file paths, web URLs, base64 strings, or browse a local image file.
                  </span>
                </div>
              </div>
            )}

            {/* --- SECTION: RECIPES FORM --- */}
            {activeSection === 'recipes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Recipe ID:</label>
                    <input
                      type="text"
                      value={recipeId}
                      onChange={(e) => setRecipeId(e.target.value)}
                      disabled={editingId !== '_new_'}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                      placeholder="iron-gear-wheel"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Recipe Name:</label>
                    <input
                      type="text"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-bold"
                      placeholder="Iron Gear Wheel"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Crafting Time (seconds):</label>
                    <input
                      type="number"
                      step="any"
                      value={recipeTime}
                      onChange={(e) => setRecipeTime(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Produced In (Category):</label>
                    <select
                      value={recipeCategory}
                      onChange={(e) => setRecipeCategory(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-semibold"
                    >
                      {Object.entries(dbMachineCategories).map(([key, name]: [string, any]) => (
                        <option key={key} value={key}>{name} ({key})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">Custom Icon/Image URL (Optional):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={recipeIconUrl}
                      onChange={(e) => setRecipeIconUrl(e.target.value)}
                      className="flex-1 bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono"
                      placeholder="e.g. /images/custom_recipe.png or base64 or URL"
                    />
                    <label className="factorio-btn text-[10px] px-3 py-1.5 font-bold uppercase cursor-pointer flex items-center gap-1 shrink-0 select-none">
                      <Upload size={12} />
                      Browse
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setRecipeIconUrl(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-zinc-500 italic block mt-1 font-normal leading-relaxed">
                    Supports local file paths, web URLs, base64 strings, or browse a local image file.
                  </span>
                </div>

                {/* Ingredients Lists */}
                <div className="space-y-2 border-t border-zinc-950 pt-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] text-[#e58e26] font-bold uppercase">Recipe Ingredients:</label>
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="factorio-btn text-[10px] px-2.5 py-1 font-bold uppercase"
                    >
                      + Add Ingredient
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {recipeIngredients.map((ing, index) => (
                      <div key={index} className="flex gap-2 items-center bg-zinc-950/40 p-1.5 rounded border border-zinc-950">
                        <select
                          value={ing.itemId}
                          onChange={(e) => handleUpdateIngredient(index, 'itemId', e.target.value)}
                          className="flex-1 bg-zinc-950 text-white border border-zinc-800 px-2 py-1 rounded text-xs focus:outline-none"
                        >
                          {allItemsList.map(item => (
                            <option key={item} value={item}>{customDb.items[item]?.name || item}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={ing.amount}
                          onChange={(e) => handleUpdateIngredient(index, 'amount', e.target.value)}
                          className="w-20 bg-zinc-950 text-white border border-zinc-800 px-2 py-1 rounded text-xs font-mono font-bold focus:outline-none"
                          min="0.001"
                          step="any"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          className="text-red-500 hover:text-red-400 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    {recipeIngredients.length === 0 && (
                      <p className="text-[10px] text-zinc-500 italic">No ingredients added yet.</p>
                    )}
                  </div>
                </div>

                {/* Products Lists (Multi product) */}
                <div className="space-y-2 border-t border-zinc-950 pt-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] text-[#e58e26] font-bold uppercase">Recipe Products:</label>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="factorio-btn text-[10px] px-2.5 py-1 font-bold uppercase"
                    >
                      + Add Product
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {recipeProducts.map((p, index) => (
                      <div key={index} className="flex gap-2 items-center bg-zinc-950/40 p-1.5 rounded border border-zinc-950">
                        <select
                          value={p.itemId}
                          onChange={(e) => handleUpdateProduct(index, 'itemId', e.target.value)}
                          className="flex-1 bg-zinc-950 text-white border border-zinc-800 px-2 py-1 rounded text-xs focus:outline-none"
                        >
                          {allItemsList.map(item => (
                            <option key={item} value={item}>{customDb.items[item]?.name || item}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={p.amount}
                          onChange={(e) => handleUpdateProduct(index, 'amount', e.target.value)}
                          className="w-20 bg-zinc-950 text-white border border-zinc-800 px-2 py-1 rounded text-xs font-mono font-bold focus:outline-none"
                          min="0.001"
                          step="any"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-500 hover:text-red-400 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    {recipeProducts.length === 0 && (
                      <p className="text-[10px] text-zinc-500 italic">Default behavior produces 1 product matching recipe ID.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* --- SECTION: MODIFIERS FORM --- */}
            {activeSection === 'modifiers' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">ID:</label>
                    <input
                      type="text"
                      value={modifierId}
                      onChange={(e) => setModifierId(e.target.value)}
                      disabled={editingId !== '_new_'}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                      placeholder="speed-module-3"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Module Name:</label>
                    <input
                      type="text"
                      value={modifierName}
                      onChange={(e) => setModifierName(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-bold"
                      placeholder="Speed module 3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Speed Bonus (0.5 = +50%):</label>
                    <input
                      type="number"
                      step="any"
                      value={modSpeed}
                      onChange={(e) => setModSpeed(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Productivity Bonus (0.1 = +10%):</label>
                    <input
                      type="number"
                      step="any"
                      value={modProd}
                      onChange={(e) => setModProd(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">Custom Icon/Image URL (Optional):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modifierIconUrl}
                      onChange={(e) => setModifierIconUrl(e.target.value)}
                      className="flex-1 bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono"
                      placeholder="e.g. /images/speed_module.png or base64 or URL"
                    />
                    <label className="factorio-btn text-[10px] px-3 py-1.5 font-bold uppercase cursor-pointer flex items-center gap-1 shrink-0 select-none">
                      <Upload size={12} />
                      Browse
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setModifierIconUrl(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-zinc-500 italic block mt-1 leading-relaxed">
                    Supports local file paths, web URLs, base64 strings, or browse a local image file.
                  </span>
                </div>
              </div>
            )}

            {/* --- SECTION: CATEGORIES FORM --- */}
            {activeSection === 'categories' && (
              <div className="space-y-4">
                <div className="bg-zinc-950/40 p-2.5 rounded border border-zinc-900 text-[11px] font-bold text-zinc-400 mb-1">
                  Editing: <span className="text-[#e58e26] uppercase">{categorySubTab === 'items' ? 'Item & Recipe Category' : 'Machine Category'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block">Category ID:</label>
                    <input
                      type="text"
                      value={catId}
                      onChange={(e) => setCatId(e.target.value)}
                      disabled={editingId !== '_new_'}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-mono font-bold"
                      placeholder={categorySubTab === 'items' ? "e.g. intermediate" : "e.g. assembling-machine"}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#e58e26] font-bold uppercase block">Display Name:</label>
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-1.5 rounded text-xs font-bold"
                      placeholder={categorySubTab === 'items' ? "e.g. Intermediate Components" : "e.g. Assembling Machines"}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-zinc-950 pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="factorio-btn px-4 py-2 text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="factorio-btn-orange px-5 py-2 text-xs font-bold uppercase rounded shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-600 h-full">
            <ItemIcon id="generic" size={44} className="opacity-40 mb-2" />
            <p className="text-xs italic font-semibold">Select or create an entry in the left sidebar to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
};
