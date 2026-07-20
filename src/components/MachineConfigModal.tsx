import React, { useState, useEffect } from 'react';
import { ItemIcon } from './ItemIcon';
import { Recipe, Machine, Module } from '../types';
import { normalizeDatabase } from '../lib/plannerSolver';

interface MachineConfigModalProps {
  recipeId: string;
  initialMachineId: string;
  initialModules: string[];
  initialBeaconCount: number;
  initialBeaconModules: string[];
  onClose: () => void;
  onSave: (config: {
    machineId: string;
    modules: string[];
    beaconCount: number;
    beaconId: string | null;
    beaconModules: string[];
  }) => void;
  customDb?: any;
}

export const MachineConfigModal: React.FC<MachineConfigModalProps> = ({
  recipeId,
  initialMachineId,
  initialModules,
  initialBeaconCount,
  initialBeaconModules,
  onClose,
  onSave,
  customDb
}) => {
  const { recipes, machines, modules: availableModules } = normalizeDatabase(customDb);
  const recipe = recipes[recipeId];
  if (!recipe) return null;

  // Find compatible machines
  const compatibleMachines = Object.values(machines).filter(
    m => m.category === recipe.category
  );

  const [selectedMachineId, setSelectedMachineId] = useState(initialMachineId);
  const [modules, setModules] = useState<string[]>([...initialModules]);
  const [beaconCount, setBeaconCount] = useState(initialBeaconCount);
  const [beaconModules, setBeaconModules] = useState<string[]>([...initialBeaconModules]);

  const activeMachine = machines[selectedMachineId] || compatibleMachines[0] || Object.values(machines)[0];

  // Synchronize modules if slots change due to changing machine type
  useEffect(() => {
    if (!activeMachine) return;
    const slots = activeMachine.slots || 0;
    if (modules.length > slots) {
      setModules(modules.slice(0, slots));
    } else {
      const newModules = [...modules];
      while (newModules.length < slots) {
        newModules.push(''); // empty slots represented as empty strings
      }
      setModules(newModules);
    }
  }, [selectedMachineId]);

  if (!activeMachine) return null;

  // Handle setting a module in a specific slot
  const setModuleAtSlot = (index: number, moduleId: string) => {
    const updated = [...modules];
    updated[index] = moduleId;
    setModules(updated);
  };

  // Set beacon module slot (beacons always have 2 slots)
  const setBeaconModuleAtSlot = (index: number, moduleId: string) => {
    const updated = [...beaconModules];
    while (updated.length < 2) updated.push('');
    updated[index] = moduleId;
    setBeaconModules(updated);
  };

  // Live stat multipliers calculation
  let speedBonus = 0;
  let prodBonus = 0;

  // Machine modules stats
  modules.forEach(modId => {
    const mod = availableModules[modId];
    if (mod) {
      speedBonus += mod.speedBonus;
      prodBonus += mod.productivityBonus;
    }
  });

  // Beacon modules stats
  if (beaconCount > 0) {
    beaconModules.forEach(modId => {
      const mod = availableModules[modId];
      if (mod) {
        speedBonus += beaconCount * 0.5 * mod.speedBonus;
      }
    });
  }

  const speedMultiplier = Math.max(0.20, 1 + speedBonus);
  const productivityBonus = Math.max(0, prodBonus);

  const finalSpeed = activeMachine.speed * speedMultiplier;

  const handleSave = () => {
    // Filter out empty modules before saving
    const savedModules = modules.filter(m => m !== '');
    const savedBeaconModules = beaconModules.filter(m => m !== '');
    
    onSave({
      machineId: selectedMachineId,
      modules: savedModules,
      beaconCount,
      beaconId: beaconCount > 0 ? 'beacon' : null,
      beaconModules: savedBeaconModules
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="factorio-panel w-full max-w-2xl text-left select-none overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b-2 border-zinc-950 bg-zinc-900 p-3">
          <div className="flex items-center gap-2">
            <ItemIcon id={recipeId} size={28} />
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
              Machine Config: {recipe.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="factorio-btn-red px-2 py-1 text-sm rounded font-bold uppercase"
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
                <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                  1. Choose Production Machine
                </label>
                <div className="space-y-2">
                  {compatibleMachines.map(m => {
                    const isSelected = m.id === selectedMachineId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMachineId(m.id)}
                        className={`w-full flex items-center justify-between p-3 rounded border transition-all ${
                          isSelected
                            ? 'bg-amber-950/30 border-[#e58e26] text-white shadow-md'
                             : 'bg-zinc-800/50 border-zinc-900 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ItemIcon id={m.id} size={32} />
                          <div className="text-left">
                            <div className="font-bold">{m.name}</div>
                            <div className="text-xs text-zinc-400">
                              Speed: {m.speed} | Module slots: {m.slots}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full led-green"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic stats box */}
              <div className="factorio-panel-inset p-4 rounded space-y-2.5">
                <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wide border-b border-zinc-900 pb-1.5">
                  Actual Equipment Stats
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-zinc-400">Base speed:</span>
                  <span className="text-right font-semibold text-zinc-200">{activeMachine.speed}</span>

                  <span className="text-zinc-400">Speed multiplier:</span>
                  <span className={`text-right font-bold ${speedMultiplier >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {speedMultiplier >= 1 ? '+' : ''}{Math.round((speedMultiplier - 1) * 100)}% ({speedMultiplier.toFixed(2)}x)
                  </span>

                  <span className="text-zinc-400">Actual speed:</span>
                  <span className="text-right font-mono font-bold text-white text-base">
                    {finalSpeed.toFixed(3)}
                  </span>

                  <span className="text-zinc-400">Productivity bonus:</span>
                  <span className="text-right font-bold text-yellow-400 font-mono">
                    +{Math.round(productivityBonus * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Modules and Beacons */}
            <div className="space-y-6">
              {/* Machine modules */}
              {activeMachine.slots > 0 ? (
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2.5 uppercase tracking-wide">
                    2. Installed Modules ({activeMachine.slots} slots)
                  </label>
                  <div className="flex gap-3 bg-zinc-900/40 p-3 rounded border border-zinc-950">
                    {Array.from({ length: activeMachine.slots }).map((_, index) => {
                      const currentModId = modules[index] || '';
                      return (
                        <div key={index} className="flex flex-col items-center gap-1.5">
                          <div className="text-[10px] text-zinc-500 font-bold uppercase">Slot {index + 1}</div>
                          <div className="relative group">
                            <select
                              value={currentModId}
                              onChange={(e) => setModuleAtSlot(index, e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            >
                              <option value="">Empty</option>
                              {Object.values(availableModules).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                            
                            {/* Visual slot representation */}
                            <div className={`factorio-slot ${currentModId ? 'border-[#e58e26]' : ''}`}>
                              {currentModId ? (
                                <ItemIcon id={currentModId} size={30} />
                              ) : (
                                <div className="text-zinc-700 font-bold text-lg">+</div>
                              )}
                            </div>
                          </div>
                          
                          {/* Mini label under slot */}
                          <div className="text-[9px] text-zinc-400 max-w-[50px] truncate text-center font-semibold">
                            {currentModId && availableModules[currentModId] ? availableModules[currentModId].name.split(' ')[0] : 'Empty'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-zinc-900/20 text-zinc-500 rounded border border-zinc-900 text-sm italic">
                  This machine does not support modules
                </div>
              )}

              {/* Beacon configuration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wide">
                    3. Beacon (Transmitter)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="beacon-toggle"
                      checked={beaconCount > 0}
                      onChange={(e) => setBeaconCount(e.target.checked ? 8 : 0)}
                      className="w-4 h-4 accent-[#e58e26]"
                    />
                    <label htmlFor="beacon-toggle" className="text-xs font-bold text-zinc-300 cursor-pointer select-none">
                      Active
                    </label>
                  </div>
                </div>

                {beaconCount > 0 ? (
                  <div className="space-y-4 p-4 rounded border border-amber-950/40 bg-amber-950/5">
                    {/* Beacon count selector */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-zinc-300">Influencing beacon count:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setBeaconCount(Math.max(1, beaconCount - 1))}
                          className="factorio-btn w-8 h-8 font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-lg text-white w-8 text-center">
                          {beaconCount}
                        </span>
                        <button
                          onClick={() => setBeaconCount(Math.min(24, beaconCount + 1))}
                          className="factorio-btn w-8 h-8 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Beacon modules (2 slots) */}
                    <div>
                      <span className="block text-xs font-bold text-zinc-400 mb-2 uppercase">
                        Beacon Modules (50% transmission efficiency)
                      </span>
                      <div className="flex gap-4">
                        {[0, 1].map((index) => {
                          const currentModId = beaconModules[index] || '';
                          return (
                            <div key={index} className="flex items-center gap-3 bg-zinc-900/50 px-3 py-1.5 rounded border border-zinc-950">
                              <div className="text-xs text-zinc-500 font-bold">Slot {index + 1}</div>
                              <div className="relative group">
                                <select
                                  value={currentModId}
                                  onChange={(e) => setBeaconModuleAtSlot(index, e.target.value)}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                >
                                  <option value="">Empty</option>
                                  {Object.values(availableModules).map(m => (
                                    // Beacons do not support productivity modules
                                    m.id !== 'productivity-module-3' && (
                                      <option key={m.id} value={m.id}>{m.name}</option>
                                    )
                                  ))}
                                </select>
                                
                                <div className={`factorio-slot w-10 h-10 ${currentModId ? 'border-amber-500' : ''}`}>
                                  {currentModId ? (
                                    <ItemIcon id={currentModId} size={26} />
                                  ) : (
                                    <div className="text-zinc-700 font-bold">+</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-[10px] text-zinc-300 font-semibold max-w-[80px] truncate">
                                {currentModId && availableModules[currentModId] ? availableModules[currentModId].name : 'Empty'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-900/20 text-zinc-500 rounded border border-zinc-900 text-xs italic text-center">
                    Beacon is disabled for this recipe step
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer buttons */}
        <div className="border-t border-zinc-950 bg-zinc-900/50 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="factorio-btn px-4 py-2 uppercase font-bold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="factorio-btn-orange px-6 py-2 uppercase font-bold text-sm rounded shadow"
          >
            Apply and Save
          </button>
        </div>

      </div>
    </div>
  );
};
