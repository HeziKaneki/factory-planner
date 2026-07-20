import React, { useState, useEffect } from 'react';

interface ItemIconProps {
  id: string;
  className?: string;
  size?: number;
  customUrl?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ id, className = '', size = 24, customUrl }) => {
  const [dbIconUrl, setDbIconUrl] = useState<string | undefined>(undefined);
  const [resolvedId, setResolvedId] = useState<string>(id);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (customUrl) {
      setDbIconUrl(customUrl);
      setResolvedId(id);
      return;
    }
    try {
      const saved = localStorage.getItem('factory_planner_custom_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        const recipe = parsed?.recipes?.[id];
        if (recipe) {
          if (recipe.icon_url) {
            setDbIconUrl(recipe.icon_url);
            setResolvedId(id);
          } else {
            const firstProductId = recipe.products?.[0]?.itemId || id;
            setResolvedId(firstProductId);
            if (parsed?.items?.[firstProductId]?.icon_url) {
              setDbIconUrl(parsed.items[firstProductId].icon_url);
            } else {
              setDbIconUrl(undefined);
            }
          }
          return;
        }

        if (parsed?.items?.[id]?.icon_url) {
          setDbIconUrl(parsed.items[id].icon_url);
          setResolvedId(id);
          return;
        }
      }
    } catch (e) {}
    setDbIconUrl(undefined);
    setResolvedId(id);
  }, [id, customUrl]);

  if (dbIconUrl && !hasError) {
    return (
      <img
        src={dbIconUrl}
        alt={id}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className={`inline-block select-none pointer-events-none rounded object-contain ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  // Return elegant, authentic SVGs for each item to match the UI perfectly
  const renderIcon = () => {
    switch (resolvedId) {
      case 'utility-science-pack':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Flask body */}
            <path d="M16 4 L12 11 L12 13 L6 25 A 10 10 0 0 0 26 25 L20 13 L20 11 Z" fill="#7d3c98" stroke="#4a235a" strokeWidth="1.5" />
            {/* Liquid level */}
            <path d="M8.5 21 A 8 8 0 0 0 23.5 21 Q 16 19 8.5 21 Z" fill="#af7ac5" />
            {/* Liquid highlight */}
            <circle cx="13" cy="24" r="1.5" fill="#ebdef0" opacity="0.8" />
            <circle cx="18" cy="22" r="1" fill="#ebdef0" opacity="0.6" />
            {/* Flask neck and collar */}
            <rect x="11.5" y="4" width="9" height="2" rx="0.5" fill="#9b59b6" stroke="#4a235a" strokeWidth="1" />
            <line x1="12" y1="9" x2="20" y2="9" stroke="#4a235a" strokeWidth="1" />
          </svg>
        );

      case 'advanced-circuit':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Board */}
            <rect x="4" y="4" width="24" height="24" rx="2" fill="#c0392b" stroke="#7b241c" strokeWidth="1.5" />
            {/* Center chip */}
            <rect x="10" y="10" width="12" height="12" rx="1" fill="#2c3e50" stroke="#1a252f" strokeWidth="1" />
            <rect x="12" y="12" width="8" height="8" fill="#d35400" />
            {/* Connections (Gold) */}
            <path d="M12 6 L12 10 M16 6 L16 10 M20 6 L20 10" stroke="#f1c40f" strokeWidth="1" />
            <path d="M12 22 L12 26 M16 22 L16 26 M20 22 L20 26" stroke="#f1c40f" strokeWidth="1" />
            <path d="M6 12 L10 12 M6 16 L10 16 M6 20 L10 20" stroke="#f1c40f" strokeWidth="1" />
            <path d="M22 12 L26 12 M22 16 L26 16 M22 20 L26 20" stroke="#f1c40f" strokeWidth="1" />
            {/* Little resistor lines */}
            <rect x="6" y="7" width="3" height="1.5" fill="#f39c12" />
            <rect x="23" y="23" width="3" height="1.5" fill="#f39c12" />
          </svg>
        );

      case 'electronic-circuit':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Board */}
            <rect x="4" y="4" width="24" height="24" rx="2" fill="#27ae60" stroke="#1e8449" strokeWidth="1.5" />
            {/* Copper traces */}
            <path d="M6 6 L12 12 L20 12 L26 6 M6 26 L12 20 L20 20 L26 26 M16 4 L16 10 M16 22 L16 28" stroke="#f1c40f" strokeWidth="1" fill="none" opacity="0.8" />
            {/* Center copper block */}
            <rect x="12" y="12" width="8" height="8" rx="1" fill="#d35400" stroke="#a04000" strokeWidth="1" />
            {/* Pins */}
            <circle cx="8" cy="12" r="1" fill="#f1c40f" />
            <circle cx="24" cy="12" r="1" fill="#f1c40f" />
            <circle cx="16" cy="16" r="1.5" fill="#ecf0f1" />
          </svg>
        );

      case 'processing-unit':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Board */}
            <rect x="4" y="4" width="24" height="24" rx="2" fill="#2980b9" stroke="#1b4f72" strokeWidth="1.5" />
            {/* Advanced complex traces */}
            <path d="M6 16 H26 M16 6 V26 M8 8 L24 24 M8 24 L24 8" stroke="#34495e" strokeWidth="0.8" fill="none" />
            <path d="M11 11 H21 V21 H11 Z" fill="none" stroke="#f1c40f" strokeWidth="1" />
            {/* Main microprocessor chip */}
            <rect x="12" y="12" width="8" height="8" rx="0.5" fill="#111" stroke="#2c3e50" strokeWidth="1.5" />
            <rect x="14" y="14" width="4" height="4" fill="#f1c40f" />
            {/* Shiny gold corner capacitors */}
            <rect x="6" y="6" width="3" height="3" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="0.5" />
            <rect x="23" y="6" width="3" height="3" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="0.5" />
            <rect x="6" y="23" width="3" height="3" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="0.5" />
            <rect x="23" y="23" width="3" height="3" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="0.5" />
          </svg>
        );

      case 'copper-cable':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Coil circle structure */}
            <ellipse cx="16" cy="18" rx="11" ry="8" fill="none" stroke="#b03a2e" strokeWidth="2.5" />
            <ellipse cx="15" cy="17" rx="10" ry="7" fill="none" stroke="#d35400" strokeWidth="2" />
            <ellipse cx="14" cy="16" rx="9" ry="6" fill="none" stroke="#e67e22" strokeWidth="1.5" />
            {/* Cross ties */}
            <path d="M10 10 L14 24 M22 10 L18 24 M16 8 L16 26" stroke="#95a5a6" strokeWidth="1" opacity="0.8" />
            {/* Loose ends */}
            <path d="M5 14 Q 9 10 14 11 M27 22 Q 22 25 18 21" fill="none" stroke="#e67e22" strokeWidth="2" />
          </svg>
        );

      case 'flying-robot-frame':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Diagonal Frame Bars */}
            <line x1="6" y1="6" x2="26" y2="26" stroke="#7f8c8d" strokeWidth="2" />
            <line x1="6" y1="26" x2="26" y2="6" stroke="#7f8c8d" strokeWidth="2" />
            {/* Center Ring */}
            <circle cx="16" cy="16" r="6" fill="#34495e" stroke="#2c3e50" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="3" fill="#16a085" />
            {/* Rotors */}
            <circle cx="6" cy="6" r="3" fill="#bdc3c7" stroke="#7f8c8d" strokeWidth="1" />
            <circle cx="26" cy="6" r="3" fill="#bdc3c7" stroke="#7f8c8d" strokeWidth="1" />
            <circle cx="6" cy="26" r="3" fill="#bdc3c7" stroke="#7f8c8d" strokeWidth="1" />
            <circle cx="26" cy="26" r="3" fill="#bdc3c7" stroke="#7f8c8d" strokeWidth="1" />
            {/* Rotor spins */}
            <line x1="4" y1="6" x2="8" y2="6" stroke="#ecf0f1" strokeWidth="1" />
            <line x1="24" y1="6" x2="28" y2="6" stroke="#ecf0f1" strokeWidth="1" />
            <line x1="4" y1="26" x2="8" y2="26" stroke="#ecf0f1" strokeWidth="1" />
            <line x1="24" y1="26" x2="28" y2="26" stroke="#ecf0f1" strokeWidth="1" />
            {/* Electric wires */}
            <path d="M12 12 Q 16 10 20 12" fill="none" stroke="#e74c3c" strokeWidth="1" />
            <path d="M12 20 Q 16 22 20 20" fill="none" stroke="#3498db" strokeWidth="1" />
          </svg>
        );

      case 'low-density-structure':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Main trapezoid metal sheet */}
            <polygon points="5,8 27,5 29,24 3,27" fill="#f1c40f" stroke="#d4ac0d" strokeWidth="1.5" />
            {/* Honeycomb grid overlay */}
            <path d="M8 10 H24 M6 15 H26 M5 20 H25 M10 7 V25 M15 7 V26 M20 6 V24" stroke="#9a7d0a" strokeWidth="1" strokeDasharray="2,2" />
            {/* Rivets/bolt holes */}
            <circle cx="8" cy="8" r="1" fill="#444" />
            <circle cx="24" cy="7" r="1" fill="#444" />
            <circle cx="25" cy="22" r="1" fill="#444" />
            <circle cx="7" cy="24" r="1" fill="#444" />
            {/* Triangle strut lines */}
            <line x1="5" y1="8" x2="29" y2="24" stroke="#f39c12" strokeWidth="1.5" opacity="0.8" />
            <line x1="27" y1="5" x2="3" y2="27" stroke="#f39c12" strokeWidth="1.5" opacity="0.8" />
          </svg>
        );

      case 'electric-engine-unit':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Engine block */}
            <rect x="6" y="10" width="20" height="14" rx="2" fill="#7f8c8d" stroke="#5d6d7e" strokeWidth="1.5" />
            {/* Electric coils (glowing copper/blue) */}
            <rect x="10" y="6" width="12" height="4" fill="#d35400" rx="1" />
            <line x1="12" y1="6" x2="12" y2="10" stroke="#f1c40f" strokeWidth="1.5" />
            <line x1="16" y1="6" x2="16" y2="10" stroke="#f1c40f" strokeWidth="1.5" />
            <line x1="20" y1="6" x2="20" y2="10" stroke="#f1c40f" strokeWidth="1.5" />
            {/* Electrical sparks/sparkles */}
            <path d="M5 6 L8 9 M27 6 L24 9 M16 2 L16 5" stroke="#3498db" strokeWidth="1.5" strokeLinecap="round" />
            {/* Drive shaft */}
            <rect x="26" y="15" width="4" height="4" fill="#bdc3c7" stroke="#7f8c8d" strokeWidth="1" />
            {/* Side intake */}
            <rect x="2" y="13" width="4" height="8" rx="1" fill="#34495e" />
          </svg>
        );

      case 'engine-unit':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Heavy iron block */}
            <rect x="6" y="8" width="20" height="16" rx="1" fill="#566573" stroke="#2c3e50" strokeWidth="2" />
            {/* Pistons/manifold on top */}
            <rect x="9" y="4" width="4" height="4" fill="#7f8c8d" />
            <rect x="19" y="4" width="4" height="4" fill="#7f8c8d" />
            <circle cx="11" cy="4" r="1.5" fill="#e74c3c" />
            <circle cx="21" cy="4" r="1.5" fill="#e74c3c" />
            {/* Drive wheel/gear */}
            <circle cx="16" cy="16" r="5" fill="#2c3e50" stroke="#7f8c8d" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="2" fill="#d35400" />
            {/* Bolts */}
            <circle cx="9" cy="21" r="1" fill="#bdc3c7" />
            <circle cx="23" cy="21" r="1" fill="#bdc3c7" />
          </svg>
        );

      case 'iron-gear-wheel':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Main gear circle */}
            <circle cx="16" cy="16" r="9" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="1.5" />
            {/* Teeth */}
            <path d="M16 3 L16 7 M16 25 L16 29 M3 16 L7 16 M25 16 L29 16 M7 7 L10 10 M22 22 L25 25 M7 25 L10 22 M22 7 L25 10" stroke="#95a5a6" strokeWidth="3.5" strokeLinecap="round" />
            {/* Center hole */}
            <circle cx="16" cy="16" r="4" fill="#212121" stroke="#7f8c8d" strokeWidth="1.5" />
            {/* Key slot */}
            <rect x="15" y="11" width="2" height="3" fill="#212121" />
          </svg>
        );

      case 'iron-pipe':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Pipe bend */}
            <path d="M8 16 A 8 8 0 0 1 16 8" fill="none" stroke="#7f8c8d" strokeWidth="7" strokeLinecap="square" />
            <path d="M8 16 A 8 8 0 0 1 16 8" fill="none" stroke="#bdc3c7" strokeWidth="4" strokeLinecap="square" />
            {/* Straight connection */}
            <line x1="16" y1="8" x2="26" y2="8" stroke="#7f8c8d" strokeWidth="7" />
            <line x1="16" y1="8" x2="26" y2="8" stroke="#bdc3c7" strokeWidth="4" />
            {/* Flange/Collar */}
            <rect x="5" y="12" width="3" height="8" rx="0.5" fill="#34495e" />
            <rect x="23" y="5" width="3" height="6" rx="0.5" fill="#34495e" />
          </svg>
        );

      case 'steel-plate':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Shiny bright metal bar */}
            <polygon points="4,10 28,6 28,22 4,26" fill="#ecf0f1" stroke="#7f8c8d" strokeWidth="1.5" />
            {/* Shading/Highlights */}
            <polygon points="5,11 27,8 27,12 5,15" fill="#ffffff" opacity="0.6" />
            {/* Bevel lines */}
            <line x1="4" y1="18" x2="28" y2="14" stroke="#bdc3c7" strokeWidth="1.5" />
          </svg>
        );

      case 'iron-plate':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Metal sheet */}
            <polygon points="4,9 28,7 26,23 6,25" fill="#7f8c8d" stroke="#34495e" strokeWidth="1.5" />
            {/* Surface scratch lines */}
            <line x1="8" y1="12" x2="16" y2="11" stroke="#95a5a6" strokeWidth="1" />
            <line x1="12" y1="20" x2="22" y2="19" stroke="#566573" strokeWidth="1" />
            <line x1="20" y1="10" x2="24" y2="18" stroke="#566573" strokeWidth="1" />
          </svg>
        );

      case 'copper-plate':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Copper plate shape */}
            <polygon points="5,8 27,6 27,24 5,26" fill="#e67e22" stroke="#962d00" strokeWidth="1.5" />
            {/* Warm highlight */}
            <polygon points="6,9 26,7 26,12 6,14" fill="#f39c12" opacity="0.5" />
            {/* Rolled sheet metal lines */}
            <line x1="5" y1="17" x2="27" y2="15" stroke="#ba4a00" strokeWidth="1" />
          </svg>
        );

      case 'plastic-bar':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Black rectangular bar */}
            <polygon points="6,12 26,8 26,20 6,24" fill="#2c3e50" stroke="#111111" strokeWidth="2" />
            {/* Matte finish reflection */}
            <polygon points="7,13 25,10 25,13 7,16" fill="#7f8c8d" opacity="0.3" />
            {/* Cut marks */}
            <line x1="12" y1="9" x2="12" y2="22" stroke="#111" strokeWidth="1" opacity="0.6" />
            <line x1="20" y1="8" x2="20" y2="21" stroke="#111" strokeWidth="1" opacity="0.6" />
          </svg>
        );

      case 'battery':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Cylinder Body */}
            <rect x="8" y="8" width="16" height="18" rx="3" fill="#27ae60" stroke="#196f3d" strokeWidth="1.5" />
            {/* Top Terminal (Positive) */}
            <rect x="14" y="5" width="4" height="3" rx="0.5" fill="#f1c40f" stroke="#b7950b" strokeWidth="1" />
            {/* Chemical Band (Greenish yellow) */}
            <rect x="8" y="14" width="16" height="4" fill="#2ecc71" />
            <rect x="8" y="18" width="16" height="1.5" fill="#f1c40f" />
            {/* Battery symbol (+ and -) */}
            <line x1="16" y1="10" x2="16" y2="12" stroke="#fff" strokeWidth="1" />
            <line x1="15" y1="11" x2="17" y2="11" stroke="#fff" strokeWidth="1" />
            <line x1="15" y1="22" x2="17" y2="22" stroke="#fff" strokeWidth="1" />
          </svg>
        );

      case 'stone-brick':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Brick stack */}
            {/* Bottom row */}
            <rect x="4" y="18" width="11" height="6" rx="1" fill="#ba4a00" stroke="#5e2500" strokeWidth="1" />
            <rect x="17" y="18" width="11" height="6" rx="1" fill="#ba4a00" stroke="#5e2500" strokeWidth="1" />
            {/* Top row staggered */}
            <rect x="10" y="10" width="12" height="6" rx="1" fill="#d35400" stroke="#5e2500" strokeWidth="1" />
            {/* Mortar line indications */}
            <line x1="10" y1="17" x2="22" y2="17" stroke="#7f8c8d" strokeWidth="1" />
          </svg>
        );

      case 'sulfur':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Heap of yellow crystals */}
            <polygon points="16,6 9,18 23,18" fill="#f1c40f" stroke="#b7950b" strokeWidth="1" />
            <polygon points="12,12 5,26 19,26" fill="#f4d03f" stroke="#b7950b" strokeWidth="1" />
            <polygon points="21,14 13,27 27,27" fill="#f5b041" stroke="#d35400" strokeWidth="1" />
            {/* Shiny crystal facets */}
            <polygon points="16,6 14,14 16,15" fill="#fff" opacity="0.5" />
            <polygon points="12,12 10,20 12,21" fill="#fff" opacity="0.5" />
          </svg>
        );

      case 'sulfuric-acid':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Chemical drum */}
            <rect x="7" y="6" width="18" height="22" rx="2" fill="#d4ac0d" stroke="#7e5109" strokeWidth="1.5" />
            {/* Ribs on drum */}
            <line x1="7" y1="12" x2="25" y2="12" stroke="#7e5109" strokeWidth="1.5" />
            <line x1="7" y1="18" x2="25" y2="18" stroke="#7e5109" strokeWidth="1.5" />
            <line x1="7" y1="24" x2="25" y2="24" stroke="#7e5109" strokeWidth="1.5" />
            {/* Yellow acid droplet hazard label */}
            <path d="M16 13 Q19 18 16 21 Q13 18 16 13 Z" fill="#f4d03f" stroke="#111" strokeWidth="0.8" />
          </svg>
        );

      case 'lubricant':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Fluid drop (bright green neon) */}
            <path d="M16 5 C16 5 25 15 25 21 C25 26 21 30 16 30 C11 30 7 26 7 21 C7 15 16 5 16 5 Z" fill="#2ecc71" stroke="#196f3d" strokeWidth="1.5" />
            {/* Internal glow / reflection */}
            <path d="M13 10 Q20 18 20 23" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <circle cx="13" cy="23" r="2" fill="#fff" opacity="0.8" />
          </svg>
        );

      case 'petroleum-gas':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Gas cylinder / flame */}
            <rect x="9" y="8" width="14" height="20" rx="4" fill="#7f8c8d" stroke="#5d6d7e" strokeWidth="1.5" />
            <path d="M16 4 Q19 8 16 11 Q13 8 16 4" fill="#9b59b6" stroke="#4a235a" strokeWidth="1" />
            {/* Purple band */}
            <rect x="9" y="15" width="14" height="5" fill="#af7ac5" />
            {/* Dial gauge */}
            <circle cx="16" cy="17.5" r="3.5" fill="#fff" stroke="#111" strokeWidth="0.8" />
            <line x1="16" y1="17.5" x2="18" y2="16" stroke="#e74c3c" strokeWidth="1" />
          </svg>
        );

      case 'heavy-oil':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Dark droplet */}
            <path d="M16 5 C16 5 25 15 25 21 C25 26 21 30 16 30 C11 30 7 26 7 21 C7 15 16 5 16 5 Z" fill="#34495e" stroke="#1a252f" strokeWidth="2" />
            <path d="M13 11 Q18 16 18 22" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>
        );

      case 'water':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Blue drop */}
            <path d="M16 5 C16 5 25 15 25 21 C25 26 21 30 16 30 C11 30 7 26 7 21 C7 15 16 5 16 5 Z" fill="#3498db" stroke="#21618c" strokeWidth="1.5" />
            <path d="M13 10 Q20 17 20 22" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
          </svg>
        );

      case 'coal':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Jagged black coal rock */}
            <polygon points="12,5 24,7 28,17 18,27 6,22 4,12" fill="#2c3e50" stroke="#111" strokeWidth="1.5" />
            {/* Shininess facets */}
            <polygon points="12,5 15,14 6,12" fill="#34495e" />
            <polygon points="24,7 28,17 15,14" fill="#1a252f" />
            <polygon points="18,27 15,14 28,17" fill="#111" />
            <polygon points="6,22 15,14 18,27" fill="#2c3e50" />
            {/* High-contrast glints */}
            <line x1="12" y1="5" x2="15" y2="14" stroke="#7f8c8d" strokeWidth="1" />
            <line x1="15" y1="14" x2="6" y2="12" stroke="#7f8c8d" strokeWidth="1" />
          </svg>
        );

      case 'iron-ore':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Grey rock with brown/rust spots */}
            <polygon points="10,6 22,5 27,15 19,26 7,23 5,13" fill="#7f8c8d" stroke="#566573" strokeWidth="1.5" />
            {/* Rust veins */}
            <path d="M8 12 Q 13 9 17 14 T 24 20" fill="none" stroke="#ba4a00" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 20 Q 18 18 21 24" fill="none" stroke="#ba4a00" strokeWidth="1.5" strokeLinecap="round" />
            {/* Metallic glints */}
            <circle cx="11" cy="9" r="1" fill="#fff" opacity="0.6" />
            <circle cx="23" cy="11" r="1" fill="#fff" opacity="0.6" />
          </svg>
        );

      case 'copper-ore':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Grey-brown rock with green spots */}
            <polygon points="9,7 23,6 26,16 17,26 6,21 5,14" fill="#8d6e63" stroke="#4e342e" strokeWidth="1.5" />
            {/* Turquoise mineral copper deposits */}
            <circle cx="12" cy="12" r="3" fill="#1abc9c" stroke="#16a085" strokeWidth="0.5" />
            <circle cx="19" cy="15" r="2.5" fill="#1abc9c" stroke="#16a085" strokeWidth="0.5" />
            <circle cx="14" cy="20" r="2" fill="#1abc9c" stroke="#16a085" strokeWidth="0.5" />
            <path d="M10 13 L19 15" stroke="#16a085" strokeWidth="1" />
          </svg>
        );

      case 'stone':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Simple light-grey rock */}
            <polygon points="8,9 24,7 27,18 16,26 6,20" fill="#bdc3c7" stroke="#7f8c8d" strokeWidth="1.5" />
            {/* Cracks and shading */}
            <line x1="12" y1="12" x2="18" y2="18" stroke="#95a5a6" strokeWidth="1.5" />
            <line x1="18" y1="18" x2="14" y2="22" stroke="#95a5a6" strokeWidth="1" />
            <polygon points="8,9 12,12 6,20" fill="#ecf0f1" opacity="0.4" />
          </svg>
        );

      case 'electricity':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Lightning bolt */}
            <polygon points="19,3 8,16 15,16 13,29 24,14 17,14" fill="#f1c40f" stroke="#d35400" strokeWidth="1.5" />
            {/* Glowing neon center */}
            <polygon points="18.5,5 9.5,15.5 15.5,15.5 13.5,27.5 22.5,14.5 16.5,14.5" fill="#fff" opacity="0.7" />
          </svg>
        );

      // Machines
      case 'assembling-machine-3':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Base platform */}
            <rect x="4" y="10" width="24" height="18" rx="2" fill="#f39c12" stroke="#962d00" strokeWidth="1.5" />
            <rect x="4" y="20" width="24" height="8" fill="#34495e" />
            {/* Top mechanism */}
            <rect x="8" y="4" width="16" height="6" rx="1" fill="#7f8c8d" stroke="#566573" strokeWidth="1" />
            {/* Rotating Gear / Arm (Blue/Cyan colors) */}
            <circle cx="16" cy="15" r="4" fill="#3498db" stroke="#21618c" strokeWidth="1" />
            <line x1="16" y1="11" x2="16" y2="19" stroke="#fff" strokeWidth="1.5" />
            <line x1="12" y1="15" x2="20" y2="15" stroke="#fff" strokeWidth="1.5" />
            {/* Status light */}
            <circle cx="24" cy="13" r="1.5" fill="#2ecc71" className="animate-pulse" />
          </svg>
        );

      case 'assembling-machine-2':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Base platform (Blue/Steel) */}
            <rect x="4" y="10" width="24" height="18" rx="2" fill="#2980b9" stroke="#1b4f72" strokeWidth="1.5" />
            <rect x="4" y="20" width="24" height="8" fill="#566573" />
            {/* Top parts */}
            <rect x="9" y="5" width="14" height="5" fill="#bdc3c7" stroke="#7f8c8d" strokeWidth="1" />
            {/* Rotating wheel */}
            <circle cx="16" cy="15" r="3.5" fill="#f1c40f" stroke="#b7950b" strokeWidth="1" />
            {/* Status light */}
            <circle cx="24" cy="13" r="1.5" fill="#e67e22" />
          </svg>
        );

      case 'assembling-machine-1':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Base platform (Grey iron) */}
            <rect x="4" y="10" width="24" height="18" rx="2" fill="#7f8c8d" stroke="#34495e" strokeWidth="1.5" />
            <rect x="4" y="21" width="24" height="7" fill="#2c3e50" />
            {/* Gears */}
            <circle cx="11" cy="16" r="3" fill="#bdc3c7" />
            <circle cx="21" cy="16" r="2.5" fill="#bdc3c7" />
          </svg>
        );

      case 'electric-furnace':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Dark heavy kiln */}
            <rect x="4" y="8" width="24" height="20" rx="3" fill="#34495e" stroke="#2c3e50" strokeWidth="2" />
            {/* Glowing electrical coil center */}
            <rect x="8" y="14" width="16" height="10" rx="1" fill="#111" />
            {/* Heating coils glowing red/orange */}
            <line x1="10" y1="16" x2="22" y2="16" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="19" x2="22" y2="19" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="22" x2="22" y2="22" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" />
            {/* Wires */}
            <path d="M6 8 L6 14" stroke="#f1c40f" strokeWidth="1" />
            <path d="M26 8 L26 14" stroke="#f1c40f" strokeWidth="1" />
          </svg>
        );

      case 'steel-furnace':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Heavy curved metal furnace */}
            <path d="M6 28 L6 16 A 10 10 0 0 1 26 16 L26 28 Z" fill="#7f8c8d" stroke="#34495e" strokeWidth="2" />
            {/* Fire box door with glowing fire inside */}
            <rect x="11" y="20" width="10" height="8" rx="1" fill="#111" />
            <ellipse cx="16" cy="24" rx="4" ry="3" fill="#e67e22" />
            <circle cx="16" cy="24" r="1.5" fill="#f1c40f" />
            {/* Rivets */}
            <circle cx="9" cy="18" r="1" fill="#bdc3c7" />
            <circle cx="23" cy="18" r="1" fill="#bdc3c7" />
          </svg>
        );

      case 'stone-furnace':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Stone mound */}
            <path d="M4 28 C 4 28, 6 12, 16 10 C 26 12, 28 28, 28 28 Z" fill="#95a5a6" stroke="#5d6d7e" strokeWidth="1.5" />
            {/* Fire opening */}
            <path d="M11 28 Q 16 18 21 28 Z" fill="#111" stroke="#5d6d7e" strokeWidth="1.5" />
            {/* Fire glow */}
            <path d="M12 28 Q 16 21 20 28 Z" fill="#e67e22" />
            <path d="M14 28 Q 16 24 18 28 Z" fill="#f1c40f" />
            {/* Stone textures */}
            <circle cx="9" cy="16" r="2" fill="#7f8c8d" />
            <circle cx="23" cy="16" r="2" fill="#7f8c8d" />
            <circle cx="16" cy="13" r="1.5" fill="#bdc3c7" />
          </svg>
        );

      case 'chemical-plant':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Main chemical dome and pipes */}
            <rect x="5" y="12" width="14" height="15" rx="1" fill="#7f8c8d" stroke="#34495e" strokeWidth="1.5" />
            <rect x="19" y="8" width="8" height="19" rx="1" fill="#34495e" stroke="#1c2833" strokeWidth="1.5" />
            {/* Connecting Pipe */}
            <path d="M12 15 H 22" stroke="#f1c40f" strokeWidth="2.5" />
            {/* Liquid level indicator */}
            <rect x="22" y="12" width="2" height="11" fill="#2ecc71" />
            {/* Chimney steam */}
            <path d="M7 6 Q 9 2 11 5" fill="none" stroke="#bdc3c7" strokeWidth="1" />
          </svg>
        );

      case 'electric-mining-drill':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Yellow base casing */}
            <rect x="6" y="8" width="20" height="16" rx="2" fill="#f1c40f" stroke="#b7950b" strokeWidth="2" />
            {/* Dark drill bit sticking out the bottom */}
            <polygon points="12,24 20,24 16,30" fill="#34495e" stroke="#2c3e50" strokeWidth="1" />
            {/* Motor fan grill */}
            <rect x="10" y="12" width="12" height="6" fill="#111" />
            <line x1="12" y1="12" x2="12" y2="18" stroke="#f1c40f" strokeWidth="1" />
            <line x1="16" y1="12" x2="16" y2="18" stroke="#f1c40f" strokeWidth="1" />
            <line x1="20" y1="12" x2="20" y2="18" stroke="#f1c40f" strokeWidth="1" />
            {/* Electrical connection node */}
            <circle cx="16" cy="6" r="2" fill="#bdc3c7" stroke="#7f8c8d" strokeWidth="1" />
            <line x1="16" y1="6" x2="16" y2="8" stroke="#bdc3c7" strokeWidth="1.5" />
          </svg>
        );

      case 'beacon':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Beacon structure: tall base and glowing emitter on top */}
            <rect x="8" y="14" width="16" height="14" rx="1" fill="#566573" stroke="#2c3e50" strokeWidth="1.5" />
            <polygon points="10,14 22,14 16,5" fill="#34495e" stroke="#2c3e50" strokeWidth="1.5" />
            {/* Glowing signal sphere */}
            <circle cx="16" cy="5" r="3.5" fill="#5dade2" stroke="#2e86c1" strokeWidth="1" className="animate-pulse" />
            {/* Status beacons */}
            <circle cx="12" cy="18" r="1.5" fill="#2ecc71" />
            <circle cx="20" cy="18" r="1.5" fill="#3498db" />
          </svg>
        );

      // Modules
      case 'speed-module-3':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Card blue */}
            <rect x="5" y="5" width="22" height="22" rx="2" fill="#21618c" stroke="#1b4f72" strokeWidth="1.5" />
            {/* Microchips red */}
            <rect x="9" y="9" width="14" height="4" fill="#e74c3c" rx="0.5" />
            {/* Connection tracks gold */}
            <path d="M12 13 V17 M16 13 V17 M20 13 V17" stroke="#f1c40f" strokeWidth="1.2" />
            {/* Active glowing blue LEDs */}
            <circle cx="10" cy="21" r="1.5" fill="#5adeff" />
            <circle cx="16" cy="21" r="1.5" fill="#5adeff" />
            <circle cx="22" cy="21" r="1.5" fill="#5adeff" />
          </svg>
        );

      case 'productivity-module-3':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Card red */}
            <rect x="5" y="5" width="22" height="22" rx="2" fill="#78281f" stroke="#511c15" strokeWidth="1.5" />
            {/* Microchips yellow */}
            <rect x="9" y="9" width="14" height="4" fill="#f4d03f" rx="0.5" />
            {/* Tracks */}
            <path d="M12 13 V17 M16 13 V17 M20 13 V17" stroke="#111" strokeWidth="1.2" />
            {/* Glowing orange/red LEDs */}
            <circle cx="10" cy="21" r="1.5" fill="#ff5a5a" />
            <circle cx="16" cy="21" r="1.5" fill="#ff5a5a" />
            <circle cx="22" cy="21" r="1.5" fill="#ff5a5a" />
          </svg>
        );

      case 'efficiency-module-3':
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            {/* Card green */}
            <rect x="5" y="5" width="22" height="22" rx="2" fill="#1e8449" stroke="#145a32" strokeWidth="1.5" />
            {/* Microchips green */}
            <rect x="9" y="9" width="14" height="4" fill="#111" rx="0.5" />
            {/* Tracks */}
            <path d="M12 13 V17 M16 13 V17 M20 13 V17" stroke="#f1c40f" strokeWidth="1.2" />
            {/* Glowing eco green LEDs */}
            <circle cx="10" cy="21" r="1.5" fill="#5aff5a" />
            <circle cx="16" cy="21" r="1.5" fill="#5aff5a" />
            <circle cx="22" cy="21" r="1.5" fill="#5aff5a" />
          </svg>
        );

      default:
        // Generic circle placeholder representing items beautifully
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <circle cx="16" cy="16" r="12" fill="#444444" stroke="#666666" strokeWidth="1.5" />
            <text x="16" y="20" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
              {resolvedId ? resolvedId.substring(0, 2).toUpperCase() : '?'}
            </text>
          </svg>
        );
    }
  };

  return (
    <div
      style={{ width: size, height: size }}
      className={`inline-block select-none pointer-events-none transition-transform duration-100 ${className}`}
    >
      {renderIcon()}
    </div>
  );
};
