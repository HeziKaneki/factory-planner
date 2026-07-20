import React, { useState } from 'react';
import { ItemIcon } from './ItemIcon';
import { LineModifier } from '../types';
import { normalizeDatabase } from '../lib/plannerSolver';

interface MachineConfigModalProps {
  recipeId: string;
  initialMachineId: string;
  initialModifiers: LineModifier[];
  onClose: () => void;
  onSave: (config: {
    machineId: string;
    modifiers: LineModifier[];
  }) => void;
  customDb?: any;
}

export const MachineConfigModal: React.FC<MachineConfigModalProps> = ({
  recipeId,
  initialMachineId,
  initialModifiers = [],
  onClose,
  onSave,
  customDb
}) => {
  const { recipes, machines, modules: availableModifiers } = normalizeDatabase(customDb);
  const recipe = recipes[recipeId];
  if (!recipe) return null;

  // Find compatible machines
  const compatibleMachines = Object.values(machines).filter(
    m => m.category === recipe.category
  );

  const [selectedMachineId, setSelectedMachineId] = useState(initialMachineId);
  // Ensure we copy the array so we don't mutate state directly
  const [modifiers, setModifiers] = useState<LineModifier[]>(
    initialModifiers.map(m => ({ ...m }))
  );

  const activeMachine = machines[selectedMachineId] || compatibleMachines[0] || Object.values(machines)[0];

  if (!activeMachine) return null;

  // Modifiers operations
  const handleAddModifier = (modId: string) => {
    const existing = modifiers.find(m => m.id === modId);
    if (existing) {
      setModifiers(modifiers.map(m => m.id === modId ? { ...m, count: m.count + 1 } : m));
    } else {
      setModifiers([...modifiers, { id: modId, count: 1 }]);
    }
  };

  const handleUpdateCount = (modId: string, count: number) => {
    if (count <= 0) {
      handleRemoveModifier(modId);
      return;
    }
    setModifiers(modifiers.map(m => m.id === modId ? { ...m, count } : m));
  };

  const handleRemoveModifier = (modId: string) => {
    setModifiers(modifiers.filter(m => m.id !== modId));
  };

  // Live stat calculations
  let speedBonus = 0;
  let prodBonus = 0;
  let energyBonus = 0;

  modifiers.forEach(lm => {
    const mod = availableModifiers[lm.id];
    if (mod) {
      speedBonus += (mod.speedBonus || 0) * lm.count;
      prodBonus += (mod.productivityBonus || 0) * lm.count;
      energyBonus += (mod.energyBonus || 0) * lm.count;
    }
  });

  const speedMultiplier = Math.max(0.20, 1 + speedBonus);
  const productivityBonus = Math.max(0, prodBonus);
  const energyModifier = Math.max(0.20, 1 + energyBonus);

  const finalSpeed = activeMachine.speed * speedMultiplier;
  const finalEnergy = activeMachine.energy * energyModifier;

  const handleSave = () => {
    onSave({
      machineId: selectedMachineId,
      modifiers: modifiers.filter(m => m.count > 0)
    });
  };

  // Filter out modifiers already added so dropdown is clean, or just keep them all
  const unusedModifiers = Object.values(availableModifiers).filter(
    m => !modifiers.some(lm => lm.id === m.id)
  );

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="factorio-panel w-full max-w-2xl text-left select-none overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b-2 border-zinc-950 bg-zinc-900 p-3">
          <div className="flex items-center gap-2">
            <ItemIcon id={recipeId} size={28} />
            <h3 className="font-display font-bold text-lg text-[#e58e26] uppercase tracking-wider">
              Configure Machine & Modifiers: {recipe.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="factorio-btn-red px-2 py-1 text-sm rounded font-bold uppercase cursor-pointer"
          >
            Close (X)
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Machine selection & Live Preview */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                  1. Choose Production Machine
                </label>
                <div className="space-y-2">
                  {compatibleMachines.map(m => {
                    const isSelected = m.id === selectedMachineId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMachineId(m.id)}
                        className={`w-full flex items-center justify-between p-3 rounded border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/30 border-[#e58e26] text-white shadow-md'
                            : 'bg-zinc-800/50 border-zinc-900 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="factorio-slot w-10 h-10 flex items-center justify-center bg-zinc-950/50 rounded shadow-inner">
                            <ItemIcon id={m.id} size={28} />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-sm">{m.name}</div>
                            <div className="text-xs text-zinc-400">
                              Base speed: {m.speed} | Base Power: {m.energy} kW
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full led-green shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic stats box */}
              <div className="factorio-panel-inset p-4 rounded space-y-2.5 bg-zinc-950/40 border border-zinc-900">
                <h4 className="text-xs font-bold text-[#e58e26] uppercase tracking-wide border-b border-zinc-900 pb-1.5">
                  Live Equipment Multipliers
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-zinc-400">Base speed:</span>
                  <span className="text-right font-semibold text-zinc-200">{activeMachine.speed}</span>

                  <span className="text-zinc-400">Speed Multiplier:</span>
                  <span className={`text-right font-bold ${speedMultiplier >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {speedMultiplier >= 1 ? '+' : ''}{Math.round((speedMultiplier - 1) * 100)}% ({speedMultiplier.toFixed(2)}x)
                  </span>

                  <span className="text-zinc-400">Actual Speed:</span>
                  <span className="text-right font-mono font-bold text-white text-sm">
                    {finalSpeed.toFixed(3)}
                  </span>

                  <span className="text-zinc-400">Productivity Bonus:</span>
                  <span className="text-right font-bold text-yellow-400 font-mono">
                    +{Math.round(productivityBonus * 100)}%
                  </span>

                  <span className="text-zinc-400">Energy Multiplier:</span>
                  <span className={`text-right font-bold ${energyModifier <= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {energyModifier >= 1 ? '+' : ''}{Math.round((energyModifier - 1) * 100)}% ({energyModifier.toFixed(2)}x)
                  </span>

                  <span className="text-zinc-400">Machine Power Usage:</span>
                  <span className="text-right font-mono font-bold text-orange-400">
                    {finalEnergy.toFixed(1)} kW
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Modifier Management */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2.5 uppercase tracking-wide">
                  2. Apply Effects & Modifiers
                </label>
                
                {/* Modifier List */}
                <div className="space-y-2 bg-zinc-950/20 p-3 rounded border border-zinc-950 min-h-[160px] max-h-[250px] overflow-y-auto">
                  {modifiers.length > 0 ? (
                    modifiers.map((lm) => {
                      const mod = availableModifiers[lm.id];
                      if (!mod) return null;
                      return (
                        <div 
                          key={lm.id}
                          className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-950 text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="factorio-slot w-9 h-9 flex items-center justify-center bg-zinc-950 border border-zinc-850 shrink-0 rounded">
                              <ItemIcon id={lm.id} size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-zinc-100 truncate">{mod.name}</div>
                              <div className="flex gap-2 text-[10px] text-zinc-500 font-mono">
                                {mod.speedBonus !== 0 && (
                                  <span className={mod.speedBonus > 0 ? 'text-green-500' : 'text-red-500'}>
                                    S:{mod.speedBonus > 0 ? '+' : ''}{Math.round(mod.speedBonus * 100)}%
                                  </span>
                                )}
                                {mod.productivityBonus !== 0 && (
                                  <span className="text-yellow-500">
                                    P:+{Math.round(mod.productivityBonus * 100)}%
                                  </span>
                                )}
                                {mod.energyBonus !== 0 && (
                                  <span className={mod.energyBonus < 0 ? 'text-green-500' : 'text-red-500'}>
                                    E:{mod.energyBonus > 0 ? '+' : ''}{Math.round(mod.energyBonus * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Minus */}
                            <button
                              type="button"
                              onClick={() => handleUpdateCount(lm.id, lm.count - 1)}
                              className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:bg-zinc-900 flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            
                            {/* Count display */}
                            <input
                              type="number"
                              min="1"
                              value={lm.count}
                              onChange={(e) => {
                                const parsed = parseInt(e.target.value);
                                if (!isNaN(parsed)) {
                                  handleUpdateCount(lm.id, parsed);
                                }
                              }}
                              className="w-10 h-6 bg-zinc-950 text-white font-mono text-xs text-center border border-zinc-800 rounded focus:outline-none focus:border-[#e58e26]"
                            />

                            {/* Plus */}
                            <button
                              type="button"
                              onClick={() => handleUpdateCount(lm.id, lm.count + 1)}
                              className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:bg-zinc-900 flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleRemoveModifier(lm.id)}
                              className="w-6 h-6 text-red-500 hover:text-red-400 hover:bg-red-950/30 rounded flex items-center justify-center cursor-pointer ml-1"
                              title="Remove Modifier"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-xs py-10 italic">
                      No modifiers applied to this machine.
                    </div>
                  )}
                </div>
              </div>

              {/* Add Modifier Controls */}
              <div className="space-y-3 border-t border-zinc-900 pt-3">
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Add Modifier from Database (Grouped)
                </span>
                <div className="space-y-3.5 max-h-[180px] overflow-y-auto pr-1">
                  {(() => {
                    const groups: Record<string, typeof availableModifiers[string][]> = {};
                    const cats = customDb?.modifier_categories || {
                      'speed': 'Speed Enhancers',
                      'productivity': 'Productivity Boosters',
                      'efficiency': 'Efficiency Optimizers',
                      'no-category': 'No Category'
                    };
                    
                    // Initialize groups
                    Object.keys(cats).forEach(catKey => {
                      groups[catKey] = [];
                    });
                    if (!groups['no-category']) {
                      groups['no-category'] = [];
                    }

                    Object.values(availableModifiers).forEach(m => {
                      const cat = m.category && m.category in cats ? m.category : 'no-category';
                      if (!groups[cat]) {
                        groups[cat] = [];
                      }
                      groups[cat].push(m);
                    });

                    const filteredGroups = Object.entries(groups).filter(([_, list]) => list.length > 0);

                    return filteredGroups.map(([catKey, list]) => {
                      const catName = cats[catKey] || catKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <div key={catKey} className="space-y-1.5">
                          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wide flex items-center gap-1.5 border-b border-zinc-900/40 pb-0.5">
                            <span>✦</span>
                            <span>{catName}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {list.map((m) => {
                              const isAlreadyApplied = modifiers.some(lm => lm.id === m.id);
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleAddModifier(m.id)}
                                  className={`flex items-center gap-2 p-1.5 rounded text-left border text-xs transition-colors cursor-pointer ${
                                    isAlreadyApplied
                                      ? 'bg-amber-950/10 border-amber-900/40 text-amber-500 hover:bg-amber-950/20'
                                      : 'bg-zinc-900 border-zinc-950 text-zinc-300 hover:bg-zinc-850 hover:text-white'
                                  }`}
                                >
                                  <div className="factorio-slot w-7 h-7 flex items-center justify-center bg-zinc-950 shrink-0 rounded">
                                    <ItemIcon id={m.id} size={18} />
                                  </div>
                                  <span className="truncate font-semibold">{m.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer buttons */}
        <div className="border-t border-zinc-950 bg-zinc-900/50 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="factorio-btn px-4 py-2 uppercase font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="factorio-btn-orange px-6 py-2 uppercase font-bold text-xs rounded shadow cursor-pointer"
          >
            Apply and Save
          </button>
        </div>

      </div>
    </div>
  );
};
