import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, AlertTriangle, Upload, Download } from 'lucide-react';
import { initialCustomDb } from '../data/initialDb';

interface DatabaseTabProps {
  customDb: any;
  onSave: (newDb: any) => void;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ customDb, onSave }) => {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(customDb, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Keep in sync with customDb prop
  useEffect(() => {
    setJsonText(JSON.stringify(customDb, null, 2));
    setError(null);
  }, [customDb]);

  const handleTextChange = (value: string) => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);
      // Validate schema roughly
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
    } catch (err: any) {
      setError(err.message || 'Apply error: Please check your syntax');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset to default database? This will overwrite your custom changes.')) {
      onSave(initialCustomDb);
      setJsonText(JSON.stringify(initialCustomDb, null, 2));
      setError(null);
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
        // Validate schema roughly
        if (!parsed.game_name) throw new Error('Structure missing "game_name"');
        if (!parsed.items) throw new Error('Structure missing "items" section');
        if (!parsed.machines) throw new Error('Structure missing "machines" section');
        if (!parsed.recipes) throw new Error('Structure missing "recipes" section');
        
        onSave(parsed);
        setError(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
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
        // use default name if invalid JSON
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

  return (
    <div className="flex-1 flex flex-col p-5 overflow-hidden bg-zinc-950/40 text-left gap-4 h-full">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
        <div>
          <h3 className="font-display font-bold text-lg text-[#e58e26] uppercase tracking-wider">
            JSON Database
          </h3>
          <p className="text-xs text-zinc-500 mt-1 font-normal leading-relaxed">
            View and directly edit the JSON database structure to modify the entire system's Items, Recipes, Machines, Categories, and Modifiers.
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
            title="Import database from .txt file"
          >
            <Upload size={14} />
            Import .txt
          </button>
          <button
            onClick={handleExport}
            className="factorio-btn text-xs px-3 py-1.5 flex items-center gap-1.5 uppercase font-bold text-zinc-300"
            title="Export database to .txt file"
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
            Reset to Default
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

        {/* Validation / Helper Sidebar */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="factorio-panel p-4 rounded space-y-3">
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-900 pb-1.5">
              Database Status
            </h4>
            {error ? (
              <div className="p-3 bg-red-950/25 border border-red-900/50 rounded flex gap-2 items-start text-xs text-red-400 leading-normal">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold uppercase">Invalid Syntax:</div>
                  <div className="mt-1 font-mono break-all">{error}</div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-950/25 border border-green-900/50 rounded flex gap-2 items-center text-xs text-green-400 font-semibold uppercase">
                <Check size={16} className="shrink-0 led-green rounded-full p-0.5" />
                <span>Database is Valid</span>
              </div>
            )}
          </div>

          <div className="factorio-panel p-4 rounded space-y-3 flex-1 overflow-y-auto">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-1.5">
              Database Schema Guide
            </h4>
            <div className="text-[11px] text-zinc-400 space-y-2 font-normal leading-relaxed">
              <p>
                <strong className="text-zinc-200 uppercase">Categories:</strong> Dynamic categories mapping category IDs to user-friendly names.
              </p>
              <p>
                <strong className="text-zinc-200 uppercase">Items:</strong> Each ID represents a item. Contains a <code className="text-[#e58e26]">"name"</code>, compatible <code className="text-[#e58e26]">"category"</code>, and optional custom <code className="text-[#e58e26]">"icon_url"</code>.
              </p>
              <p>
                <strong className="text-zinc-200 uppercase">Machines:</strong> Crafting equipment. Includes <code className="text-[#e58e26]">"crafting_speed"</code> (base speed multiplier), <code className="text-[#e58e26]">"slots"</code> (available module slots), and <code className="text-[#e58e26]">"category"</code> matching corresponding recipes.
              </p>
              <p>
                <strong className="text-zinc-200 uppercase">Recipes:</strong> Manufacturing processes. Contains <code className="text-[#e58e26]">"crafting_time"</code>, list of <code className="text-[#e58e26]">"ingredients"</code> (itemId & amount), and list of <code className="text-[#e58e26]">"products"</code> (itemId & amount).
              </p>
              <p>
                <strong className="text-zinc-200 uppercase">Modifiers:</strong> Module upgrades. Includes <code className="text-[#e58e26]">"speed_bonus"</code> and <code className="text-[#e58e26]">"productivity_bonus"</code> values.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
