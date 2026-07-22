import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  Upload, 
  Download, 
  Database, 
  Trash2, 
  Plus, 
  Settings, 
  Edit3, 
  Save, 
  X, 
  BookmarkCheck, 
  RotateCcw 
} from 'lucide-react';
import { initialCustomDb } from '../data/initialDb';
import { DEFAULT_PRESETS, UserPreset } from '../data/dbPresets';

interface DatabaseTabProps {
  customDb: any;
  onSave: (newDb: any) => void;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ customDb, onSave }) => {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(customDb, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importPresetInputRef = React.useRef<HTMLInputElement>(null);

  // User-managed presets state loaded from localStorage
  const [userPresets, setUserPresets] = useState<UserPreset[]>(() => {
    try {
      const savedPresets = localStorage.getItem('factory_planner_user_presets');
      if (savedPresets) {
        const parsed = JSON.parse(savedPresets);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });

  // Track currently active preset ID
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    try {
      const savedActiveId = localStorage.getItem('factory_planner_active_preset_id');
      if (savedActiveId && userPresets.some(p => p.id === savedActiveId)) {
        return savedActiveId;
      }
      // Try matching by game_name
      const matched = userPresets.find(p => p.db?.game_name === customDb?.game_name);
      return matched ? matched.id : (userPresets[0]?.id || '');
    } catch {
      return userPresets[0]?.id || '';
    }
  });

  // Manage Presets Modal State
  const [showManageModal, setShowManageModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [presetSearchTerm, setPresetSearchTerm] = useState('');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Persist presets and active ID
  useEffect(() => {
    localStorage.setItem('factory_planner_user_presets', JSON.stringify(userPresets));
  }, [userPresets]);

  useEffect(() => {
    localStorage.setItem('factory_planner_active_preset_id', activePresetId);
  }, [activePresetId]);

  // Keep jsonText in sync when customDb changes externally
  useEffect(() => {
    setJsonText(JSON.stringify(customDb, null, 2));
    setError(null);
  }, [customDb]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch preset handler
  const handleSelectPreset = (presetId: string) => {
    if (!presetId) return;
    const target = userPresets.find(p => p.id === presetId);
    if (!target) return;

    onSave(target.db);
    setJsonText(JSON.stringify(target.db, null, 2));
    setActivePresetId(presetId);
    setError(null);
    showToast(`Loaded preset "${target.name}"`);
  };

  // Save current active editor JSON as a brand new preset
  const handleCreatePresetFromCurrent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPresetName.trim()) {
      setModalError('Please enter a preset name.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.game_name) throw new Error('JSON structure is missing "game_name"');
      if (!parsed.items) throw new Error('JSON structure is missing "items" section');
      if (!parsed.machines) throw new Error('JSON structure is missing "machines" section');
      if (!parsed.recipes) throw new Error('JSON structure is missing "recipes" section');

      const newId = 'preset-' + Date.now();
      const newPreset: UserPreset = {
        id: newId,
        name: newPresetName.trim(),
        description: newPresetDesc.trim(),
        createdAt: new Date().toLocaleDateString(),
        db: parsed
      };

      setUserPresets(prev => [newPreset, ...prev]);
      setActivePresetId(newId);
      setNewPresetName('');
      setNewPresetDesc('');
      setModalError(null);
      showToast(`Saved new preset "${newPreset.name}"`);
    } catch (err: any) {
      setModalError('Cannot create preset: ' + (err.message || 'Invalid JSON syntax in editor'));
    }
  };

  // Override an existing preset with current editor JSON
  const handleOverridePresetWithCurrent = (presetId: string, presetName: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.game_name) throw new Error('JSON structure is missing "game_name"');

      if (!window.confirm(`Are you sure you want to override preset "${presetName}" with the current JSON database?`)) {
        return;
      }

      setUserPresets(prev => prev.map(p => {
        if (p.id === presetId) {
          return {
            ...p,
            createdAt: new Date().toLocaleDateString(),
            db: parsed
          };
        }
        return p;
      }));

      setActivePresetId(presetId);
      onSave(parsed);
      setModalError(null);
      showToast(`Updated preset "${presetName}" with current database`);
    } catch (err: any) {
      setModalError('Cannot override preset: ' + (err.message || 'Invalid JSON syntax in editor'));
    }
  };

  // Rename preset
  const handleStartRename = (preset: UserPreset) => {
    setEditingPresetId(preset.id);
    setEditName(preset.name);
    setEditDesc(preset.description || '');
  };

  const handleSaveRename = (presetId: string) => {
    if (!editName.trim()) return;
    setUserPresets(prev => prev.map(p => {
      if (p.id === presetId) {
        return {
          ...p,
          name: editName.trim(),
          description: editDesc.trim()
        };
      }
      return p;
    }));
    setEditingPresetId(null);
    showToast('Preset details updated');
  };

  // Delete preset
  const handleDeletePreset = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete preset "${name}"?`)) {
      setUserPresets(prev => prev.filter(p => p.id !== id));
      if (activePresetId === id) {
        const remaining = userPresets.filter(p => p.id !== id);
        setActivePresetId(remaining[0]?.id || '');
      }
      showToast(`Deleted preset "${name}"`);
    }
  };

  // Restore Default Presets
  const handleRestoreDefaultPresets = () => {
    if (window.confirm('Restore initial preset templates (Factorio, Satisfactory, DSP)? Existing user presets will be merged.')) {
      setUserPresets(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const missingDefaults = DEFAULT_PRESETS.filter(d => !existingIds.has(d.id));
        return [...prev, ...missingDefaults];
      });
      showToast('Restored default presets!');
    }
  };

  // Export single preset
  const handleExportPreset = (preset: UserPreset) => {
    const dataStr = JSON.stringify(preset.db, null, 2);
    const fileName = `${preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_preset.json`;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import preset file
  const handleImportPresetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        const presetName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        const newId = 'preset-' + Date.now();
        const importedPreset: UserPreset = {
          id: newId,
          name: parsed.game_name ? `${parsed.game_name} (${presetName})` : presetName,
          description: 'Imported from JSON file',
          createdAt: new Date().toLocaleDateString(),
          db: parsed
        };

        setUserPresets(prev => [importedPreset, ...prev]);
        setActivePresetId(newId);
        onSave(parsed);
        setJsonText(JSON.stringify(parsed, null, 2));
        showToast(`Imported preset "${importedPreset.name}"`);
      } catch (err: any) {
        alert('Failed to import preset: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTextChange = (value: string) => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);
      if (!parsed.game_name) throw new Error('Structure missing "game_name"');
      if (!parsed.items) throw new Error('Structure missing "items" section');
      if (!parsed.machines) throw new Error('Structure missing "machines" section');
      if (!parsed.recipes) throw new Error('Structure missing "recipes" section');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
    }
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onSave(parsed);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      showToast('Database JSON applied');
    } catch (err: any) {
      setError(err.message || 'Apply error: Please check your syntax');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset active database to default Factorio database? This will overwrite your current custom changes.')) {
      onSave(initialCustomDb);
      setJsonText(JSON.stringify(initialCustomDb, null, 2));
      setError(null);
      showToast('Reset database to default');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      try {
        const parsed = JSON.parse(text);
        if (!parsed.game_name) throw new Error('Structure missing "game_name"');
        if (!parsed.items) throw new Error('Structure missing "items" section');
        if (!parsed.machines) throw new Error('Structure missing "machines" section');
        if (!parsed.recipes) throw new Error('Structure missing "recipes" section');
        
        onSave(parsed);
        setError(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        showToast('Database imported successfully');
      } catch (err: any) {
        setError(err.message || 'Invalid JSON format in file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    try {
      const dataStr = jsonText;
      let fileName = 'factory_planner_db.txt';
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.game_name) {
          fileName = `${parsed.game_name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_db.txt`;
        }
      } catch (e) {
        // use default
      }

      const blob = new Blob([dataStr], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Export failed: ' + err.message);
    }
  };

  const filteredPresets = userPresets.filter(p => 
    p.name.toLowerCase().includes(presetSearchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(presetSearchTerm.toLowerCase())) ||
    (p.db?.game_name && p.db.game_name.toLowerCase().includes(presetSearchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col p-5 overflow-hidden bg-zinc-950/40 text-left gap-4 h-full relative">
      {/* Feedback Toast */}
      {toastMessage && (
        <div className="absolute top-4 right-8 z-40 bg-[#e58e26] text-black font-bold text-xs px-4 py-2 rounded shadow-lg flex items-center gap-2 animate-bounce">
          <BookmarkCheck size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
        <div>
          <h3 className="font-display font-bold text-lg text-[#e58e26] uppercase tracking-wider">
            JSON Database
          </h3>
          <p className="text-xs text-zinc-500 mt-1 font-normal leading-relaxed">
            View and edit the active factory JSON schema directly or switch between custom saved database presets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.json"
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className="factorio-btn text-xs px-3 py-1.5 flex items-center gap-1.5 uppercase font-bold text-zinc-300"
            title="Import database from file"
          >
            <Upload size={14} />
            Import .txt
          </button>
          <button
            onClick={handleExport}
            className="factorio-btn text-xs px-3 py-1.5 flex items-center gap-1.5 uppercase font-bold text-zinc-300"
            title="Export database to file"
          >
            <Download size={14} />
            Export .txt
          </button>
          <button
            onClick={handleCopy}
            className="factorio-btn text-xs px-3 py-1.5 flex items-center gap-1.5 uppercase font-bold text-zinc-300"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <button
            onClick={handleReset}
            className="factorio-btn text-xs px-3 py-1.5 flex items-center gap-1.5 uppercase font-bold text-zinc-300"
          >
            <RefreshCw size={14} className="text-red-400" />
            Reset Default
          </button>
          <button
            onClick={handleApply}
            disabled={!!error}
            className={`px-5 py-1.5 rounded font-bold uppercase text-xs shadow transition-all ${
              error 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-900' 
                : saved 
                  ? 'bg-green-600 text-white' 
                  : 'factorio-btn-orange'
            }`}
          >
            {saved ? 'Saved Successfully!' : 'Save JSON Structure'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-h-0 border border-zinc-900 rounded bg-zinc-950 overflow-hidden relative">
          <textarea
            value={jsonText}
            onChange={(e) => handleTextChange(e.target.value)}
            className="w-full h-full p-4 bg-zinc-950 text-emerald-400 font-mono text-xs focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Right Sidebar: Status & Preset Selector */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 overflow-hidden h-full">
          {/* Database Status */}
          <div className="factorio-panel p-4 rounded space-y-3 shrink-0">
            <h4 className="text-sm font-bold text-[#e58e26] uppercase tracking-wide border-b border-zinc-900 pb-1.5">
              Database Status
            </h4>
            {error ? (
              <div className="p-3 bg-red-950/25 border border-red-900/50 rounded flex gap-2 items-start text-xs text-red-400 leading-normal">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold uppercase text-[10px]">Invalid Syntax:</div>
                  <div className="mt-1 font-mono break-all text-[11px]">{error}</div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-950/25 border border-green-900/50 rounded flex gap-2 items-center text-xs text-green-400 font-semibold uppercase">
                <Check size={16} className="shrink-0 led-green rounded-full p-0.5" />
                <span>Database is Valid</span>
              </div>
            )}
          </div>

          {/* Preset Selector Panel */}
          <div className="factorio-panel p-4 rounded space-y-4 shrink-0">
            <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wide border-b border-zinc-900 pb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database size={15} className="text-[#e58e26]" />
                Database Presets
              </span>
              <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                {userPresets.length} Preset{userPresets.length !== 1 ? 's' : ''}
              </span>
            </h4>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase block">
                Select Active Preset:
              </label>
              <select
                value={activePresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-3 py-2 rounded text-xs font-semibold cursor-pointer"
              >
                {userPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} {preset.db?.game_name ? `(${preset.db.game_name})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 italic">
                Selecting a preset replaces your active factory database with the chosen preset layout.
              </p>
            </div>

            <button
              onClick={() => {
                setModalError(null);
                setShowManageModal(true);
              }}
              className="w-full factorio-btn-orange text-xs font-bold py-2 px-3 flex items-center justify-center gap-2 uppercase rounded shadow cursor-pointer transition-all hover:brightness-110"
            >
              <Settings size={15} />
              Manage Presets
            </button>
          </div>
        </div>
      </div>

      {/* MANAGE PRESETS MODAL */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="factorio-panel max-w-3xl w-full border border-zinc-800 rounded-lg shadow-2xl flex flex-col max-h-[85vh] text-left p-5 gap-4 overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[#e58e26]" />
                <h3 className="font-display font-bold text-base text-[#e58e26] uppercase tracking-wider">
                  Manage Presets
                </h3>
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error inside modal */}
            {modalError && (
              <div className="bg-red-950/40 border border-red-900/60 p-2.5 rounded text-red-400 text-xs flex items-center justify-between shrink-0">
                <span>{modalError}</span>
                <button onClick={() => setModalError(null)} className="text-red-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Top Toolbar: Save Current DB + Aux buttons */}
            <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 rounded space-y-3 shrink-0">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={14} className="text-[#e58e26]" />
                Save Current Database as New Preset
              </h4>
              <form onSubmit={handleCreatePresetFromCurrent} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block">Preset Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Factorio Space Age"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-2.5 py-1.5 rounded text-xs font-semibold"
                  />
                </div>
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block">Description:</label>
                  <input
                    type="text"
                    placeholder="Optional description"
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                    className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-2.5 py-1.5 rounded text-xs font-normal"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full factorio-btn-orange text-xs font-bold py-1.5 px-3 flex items-center justify-center gap-1.5 uppercase rounded cursor-pointer"
                  >
                    <Plus size={13} />
                    Save Preset
                  </button>
                </div>
              </form>

              {/* Utility actions */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 text-xs">
                <input
                  type="file"
                  ref={importPresetInputRef}
                  onChange={handleImportPresetFile}
                  accept=".json,.txt"
                  className="hidden"
                />
                <button
                  onClick={() => importPresetInputRef.current?.click()}
                  className="factorio-btn text-[11px] px-2.5 py-1 font-semibold text-zinc-300 flex items-center gap-1 uppercase"
                >
                  <Upload size={12} />
                  Import Preset JSON
                </button>
                <button
                  onClick={handleRestoreDefaultPresets}
                  className="factorio-btn text-[11px] px-2.5 py-1 font-semibold text-zinc-400 hover:text-zinc-200 flex items-center gap-1 uppercase"
                  title="Restore default game templates"
                >
                  <RotateCcw size={12} />
                  Restore Default Templates
                </button>
              </div>
            </div>

            {/* Presets List */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
              <div className="flex items-center justify-between shrink-0">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Saved Presets ({filteredPresets.length})
                </h4>
                <input
                  type="text"
                  placeholder="Filter presets..."
                  value={presetSearchTerm}
                  onChange={(e) => setPresetSearchTerm(e.target.value)}
                  className="bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-[#e58e26] focus:outline-none px-2.5 py-1 rounded text-xs w-48 font-normal"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {filteredPresets.length === 0 ? (
                  <div className="text-zinc-500 text-xs italic font-normal py-8 text-center border border-dashed border-zinc-800 rounded">
                    No presets found. Create a new preset above or restore default templates!
                  </div>
                ) : (
                  filteredPresets.map((preset) => {
                    const isActive = preset.id === activePresetId;
                    const isEditing = editingPresetId === preset.id;

                    return (
                      <div
                        key={preset.id}
                        className={`p-3.5 rounded border transition-all flex flex-col gap-2.5 ${
                          isActive
                            ? 'bg-[#e58e26]/5 border-[#e58e26]/50 text-white'
                            : 'bg-zinc-950/50 border-zinc-900 text-zinc-300'
                        }`}
                      >
                        {isEditing ? (
                          /* Inline Edit Form */
                          <div className="space-y-2.5 bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-400 font-bold uppercase block">Preset Name:</label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-zinc-950 text-white border border-zinc-700 focus:border-[#e58e26] px-2 py-1 rounded text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-400 font-bold uppercase block">Description:</label>
                              <input
                                type="text"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full bg-zinc-950 text-white border border-zinc-700 focus:border-[#e58e26] px-2 py-1 rounded text-xs font-normal"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => setEditingPresetId(null)}
                                className="factorio-btn text-[10px] px-2.5 py-1 font-bold uppercase"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveRename(preset.id)}
                                className="factorio-btn-orange text-[10px] px-3 py-1 font-bold uppercase flex items-center gap-1 rounded"
                              >
                                <Save size={11} />
                                Save Rename
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Regular View Card */
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                                    {preset.name}
                                  </span>
                                  {preset.db?.game_name && (
                                    <span className="text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded font-mono">
                                      {preset.db.game_name}
                                    </span>
                                  )}
                                  {isActive && (
                                    <span className="text-[9px] bg-[#e58e26]/15 text-[#e58e26] border border-[#e58e26]/30 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                      Active
                                    </span>
                                  )}
                                </div>
                                {preset.description && (
                                  <p className="text-[11px] text-zinc-400 font-normal leading-normal mt-1">
                                    {preset.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                                {preset.createdAt}
                              </span>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex items-center justify-between pt-2 border-t border-zinc-900/80 gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                {!isActive && (
                                  <button
                                    onClick={() => {
                                      handleSelectPreset(preset.id);
                                    }}
                                    className="factorio-btn text-[10px] px-2.5 py-1 font-bold uppercase flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                                    title="Load this preset into active database"
                                  >
                                    <BookmarkCheck size={12} />
                                    Select / Load
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOverridePresetWithCurrent(preset.id, preset.name)}
                                  className="factorio-btn text-[10px] px-2.5 py-1 font-bold uppercase flex items-center gap-1 text-[#e58e26] hover:text-amber-300"
                                  title="Overwrite this preset's database with current JSON editor content"
                                >
                                  <Save size={12} />
                                  Override with Current DB
                                </button>
                                <button
                                  onClick={() => handleStartRename(preset)}
                                  className="factorio-btn text-[10px] px-2.5 py-1 font-bold uppercase flex items-center gap-1 text-zinc-300 hover:text-white"
                                  title="Rename preset"
                                >
                                  <Edit3 size={12} />
                                  Rename
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleExportPreset(preset)}
                                  className="p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-900 transition-all cursor-pointer"
                                  title="Export Preset JSON"
                                >
                                  <Download size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeletePreset(preset.id, preset.name)}
                                  className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-900 transition-all cursor-pointer"
                                  title="Delete Preset"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-zinc-900 pt-3 shrink-0">
              <button
                onClick={() => setShowManageModal(false)}
                className="factorio-btn px-5 py-1.5 text-xs font-bold uppercase rounded cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
