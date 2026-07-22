import { initialCustomDb } from './initialDb';

export interface UserPreset {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  db: any;
}

export const DEFAULT_PRESETS: UserPreset[] = [
  {
    id: 'preset-factorio-standard',
    name: 'Factorio Standard',
    description: 'Standard Factorio database with ores, circuits, intermediate automation, and yellow science.',
    createdAt: 'Default',
    db: initialCustomDb
  },
  {
    id: 'preset-satisfactory-base',
    name: 'Satisfactory Base',
    description: 'Satisfactory database with iron ingots, reinforced plates, steel beams, modular frames, and space elevator components.',
    createdAt: 'Default',
    db: {
      game_name: "Satisfactory",
      categories: {
        "no-category": "No Category",
        "raw": "Raw Resources",
        "smelting": "Ingots & Smelting",
        "assembling": "Standard Assembly",
        "foundry": "Alloys & Foundry",
        "space-elevator": "Project Assembly"
      },
      machine_categories: {
        "smelting": "Smelters",
        "foundry": "Foundries",
        "assembling": "Constructors & Assemblers",
        "space-elevator": "Manufacturers"
      },
      modifier_categories: {
        "no-category": "No Category",
        "overclock": "Power Shards / Overclocks"
      },
      items: {
        "iron-ore": { "name": "Iron Ore", "category": "raw" },
        "copper-ore": { "name": "Copper Ore", "category": "raw" },
        "coal": { "name": "Coal", "category": "raw" },
        "limestone": { "name": "Limestone", "category": "raw" },
        "iron-ingot": { "name": "Iron Ingot", "category": "smelting" },
        "copper-ingot": { "name": "Copper Ingot", "category": "smelting" },
        "steel-ingot": { "name": "Steel Ingot", "category": "foundry" },
        "iron-plate": { "name": "Iron Plate", "category": "assembling" },
        "iron-rod": { "name": "Iron Rod", "category": "assembling" },
        "screw": { "name": "Screw", "category": "assembling" },
        "reinforced-plate": { "name": "Reinforced Iron Plate", "category": "assembling" },
        "modular-frame": { "name": "Modular Frame", "category": "assembling" },
        "steel-pipe": { "name": "Steel Pipe", "category": "assembling" },
        "steel-beam": { "name": "Steel Beam", "category": "assembling" },
        "concrete": { "name": "Concrete", "category": "assembling" },
        "versatile-framework": { "name": "Versatile Framework", "category": "space-elevator" }
      },
      machines: {
        "smelter": {
          "name": "Smelter",
          "crafting_speed": 1.0,
          "slots": 1,
          "energy": 4,
          "category": "smelting"
        },
        "foundry": {
          "name": "Foundry",
          "crafting_speed": 1.0,
          "slots": 1,
          "energy": 16,
          "category": "foundry"
        },
        "constructor": {
          "name": "Constructor",
          "crafting_speed": 1.0,
          "slots": 1,
          "energy": 4,
          "category": "assembling"
        },
        "assembler": {
          "name": "Assembler",
          "crafting_speed": 1.0,
          "slots": 2,
          "energy": 15,
          "category": "assembling"
        },
        "manufacturer": {
          "name": "Manufacturer",
          "crafting_speed": 1.0,
          "slots": 3,
          "energy": 55,
          "category": "space-elevator"
        }
      },
      recipes: {
        "iron-ingot": {
          "name": "Iron Ingot",
          "crafting_time": 2.0,
          "ingredients": [{ "itemId": "iron-ore", "amount": 1 }],
          "products": [{ "itemId": "iron-ingot", "amount": 1 }],
          "category": "smelting"
        },
        "copper-ingot": {
          "name": "Copper Ingot",
          "crafting_time": 2.0,
          "ingredients": [{ "itemId": "copper-ore", "amount": 1 }],
          "products": [{ "itemId": "copper-ingot", "amount": 1 }],
          "category": "smelting"
        },
        "steel-ingot": {
          "name": "Steel Ingot",
          "crafting_time": 4.0,
          "ingredients": [
            { "itemId": "iron-ore", "amount": 3 },
            { "itemId": "coal", "amount": 3 }
          ],
          "products": [{ "itemId": "steel-ingot", "amount": 3 }],
          "category": "foundry"
        },
        "concrete": {
          "name": "Concrete",
          "crafting_time": 4.0,
          "ingredients": [{ "itemId": "limestone", "amount": 3 }],
          "products": [{ "itemId": "concrete", "amount": 1 }],
          "category": "assembling"
        },
        "iron-plate": {
          "name": "Iron Plate",
          "crafting_time": 6.0,
          "ingredients": [{ "itemId": "iron-ingot", "amount": 3 }],
          "products": [{ "itemId": "iron-plate", "amount": 2 }],
          "category": "assembling"
        },
        "iron-rod": {
          "name": "Iron Rod",
          "crafting_time": 4.0,
          "ingredients": [{ "itemId": "iron-ingot", "amount": 1 }],
          "products": [{ "itemId": "iron-rod", "amount": 1 }],
          "category": "assembling"
        },
        "screw": {
          "name": "Screw",
          "crafting_time": 6.0,
          "ingredients": [{ "itemId": "iron-rod", "amount": 1 }],
          "products": [{ "itemId": "screw", "amount": 4 }],
          "category": "assembling"
        },
        "reinforced-plate": {
          "name": "Reinforced Iron Plate",
          "crafting_time": 12.0,
          "ingredients": [
            { "itemId": "iron-plate", "amount": 6 },
            { "itemId": "screw", "amount": 12 }
          ],
          "products": [{ "itemId": "reinforced-plate", "amount": 1 }],
          "category": "assembling"
        },
        "steel-pipe": {
          "name": "Steel Pipe",
          "crafting_time": 6.0,
          "ingredients": [{ "itemId": "steel-ingot", "amount": 3 }],
          "products": [{ "itemId": "steel-pipe", "amount": 2 }],
          "category": "assembling"
        },
        "steel-beam": {
          "name": "Steel Beam",
          "crafting_time": 4.0,
          "ingredients": [{ "itemId": "steel-ingot", "amount": 4 }],
          "products": [{ "itemId": "steel-beam", "amount": 1 }],
          "category": "assembling"
        },
        "modular-frame": {
          "name": "Modular Frame",
          "crafting_time": 60.0,
          "ingredients": [
            { "itemId": "reinforced-plate", "amount": 3 },
            { "itemId": "iron-rod", "amount": 12 }
          ],
          "products": [{ "itemId": "modular-frame", "amount": 2 }],
          "category": "assembling"
        },
        "versatile-framework": {
          "name": "Versatile Framework",
          "crafting_time": 24.0,
          "ingredients": [
            { "itemId": "modular-frame", "amount": 1 },
            { "itemId": "steel-beam", "amount": 12 }
          ],
          "products": [{ "itemId": "versatile-framework", "amount": 2 }],
          "category": "space-elevator"
        }
      },
      modifiers: {
        "overclock-50": {
          "name": "Overclock 150%",
          "speed_bonus": 0.50,
          "productivity_bonus": 0.0,
          "category": "overclock"
        },
        "overclock-100": {
          "name": "Overclock 200%",
          "speed_bonus": 1.00,
          "productivity_bonus": 0.0,
          "category": "overclock"
        }
      }
    }
  },
  {
    id: 'preset-dsp-base',
    name: 'Dyson Sphere Program Base',
    description: 'Dyson Sphere Program database with arc smelters, assembling machines, magnetic coils, and matrix science items.',
    createdAt: 'Default',
    db: {
      game_name: "Dyson Sphere Program",
      categories: {
        "no-category": "No Category",
        "raw": "Ores & Mining",
        "smelting": "Smeltery & Ingots",
        "assembly": "Assembling Machine",
        "matrix": "Matrix Lab Science"
      },
      machine_categories: {
        "smelting": "Arc Smelters",
        "assembly": "Assembling Machines",
        "matrix": "Matrix Labs"
      },
      modifier_categories: {
        "no-category": "No Category",
        "proliferation": "Proliferator Coating"
      },
      items: {
        "iron-ore": { "name": "Iron Ore", "category": "raw" },
        "copper-ore": { "name": "Copper Ore", "category": "raw" },
        "coal": { "name": "Coal", "category": "raw" },
        "silicon-ore": { "name": "Silicon Ore", "category": "raw" },
        "iron-ingot": { "name": "Iron Ingot", "category": "smelting" },
        "magnet": { "name": "Magnet", "category": "smelting" },
        "copper-ingot": { "name": "Copper Ingot", "category": "smelting" },
        "silicon-plate": { "name": "High-purity Silicon", "category": "smelting" },
        "magnetic-coil": { "name": "Magnetic Coil", "category": "assembly" },
        "circuit-board": { "name": "Circuit Board", "category": "assembly" },
        "crystal-component": { "name": "Microcrystalline Component", "category": "assembly" },
        "processor": { "name": "Processor", "category": "assembly" },
        "em-turbine": { "name": "Electromagnetic Turbine", "category": "assembly" },
        "em-matrix": { "name": "Electromagnetic Matrix (Blue)", "category": "matrix" },
        "energy-matrix": { "name": "Energy Matrix (Red)", "category": "matrix" }
      },
      machines: {
        "smelter": {
          "name": "Arc Smelter",
          "crafting_speed": 1.0,
          "slots": 1,
          "energy": 360,
          "category": "smelting"
        },
        "assembler-1": {
          "name": "Assembling Machine Mk.I",
          "crafting_speed": 0.75,
          "slots": 1,
          "energy": 270,
          "category": "assembly"
        },
        "assembler-2": {
          "name": "Assembling Machine Mk.II",
          "crafting_speed": 1.0,
          "slots": 2,
          "energy": 540,
          "category": "assembly"
        },
        "matrix-lab": {
          "name": "Matrix Lab",
          "crafting_speed": 1.0,
          "slots": 1,
          "energy": 480,
          "category": "matrix"
        }
      },
      recipes: {
        "iron-ingot": {
          "name": "Iron Ingot",
          "crafting_time": 1.0,
          "ingredients": [{ "itemId": "iron-ore", "amount": 1 }],
          "products": [{ "itemId": "iron-ingot", "amount": 1 }],
          "category": "smelting"
        },
        "magnet": {
          "name": "Magnet",
          "crafting_time": 1.5,
          "ingredients": [{ "itemId": "iron-ore", "amount": 1 }],
          "products": [{ "itemId": "magnet", "amount": 1 }],
          "category": "smelting"
        },
        "copper-ingot": {
          "name": "Copper Ingot",
          "crafting_time": 1.0,
          "ingredients": [{ "itemId": "copper-ore", "amount": 1 }],
          "products": [{ "itemId": "copper-ingot", "amount": 1 }],
          "category": "smelting"
        },
        "silicon-plate": {
          "name": "High-purity Silicon",
          "crafting_time": 2.0,
          "ingredients": [{ "itemId": "silicon-ore", "amount": 2 }],
          "products": [{ "itemId": "silicon-plate", "amount": 1 }],
          "category": "smelting"
        },
        "magnetic-coil": {
          "name": "Magnetic Coil",
          "crafting_time": 1.0,
          "ingredients": [
            { "itemId": "magnet", "amount": 2 },
            { "itemId": "copper-ingot", "amount": 1 }
          ],
          "products": [{ "itemId": "magnetic-coil", "amount": 2 }],
          "category": "assembly"
        },
        "circuit-board": {
          "name": "Circuit Board",
          "crafting_time": 1.0,
          "ingredients": [
            { "itemId": "iron-ingot", "amount": 2 },
            { "itemId": "copper-ingot", "amount": 1 }
          ],
          "products": [{ "itemId": "circuit-board", "amount": 2 }],
          "category": "assembly"
        },
        "crystal-component": {
          "name": "Microcrystalline Component",
          "crafting_time": 2.0,
          "ingredients": [
            { "itemId": "silicon-plate", "amount": 2 },
            { "itemId": "copper-ingot", "amount": 1 }
          ],
          "products": [{ "itemId": "crystal-component", "amount": 1 }],
          "category": "assembly"
        },
        "processor": {
          "name": "Processor",
          "crafting_time": 3.0,
          "ingredients": [
            { "itemId": "circuit-board", "amount": 2 },
            { "itemId": "crystal-component", "amount": 2 }
          ],
          "products": [{ "itemId": "processor", "amount": 1 }],
          "category": "assembly"
        },
        "em-turbine": {
          "name": "Electromagnetic Turbine",
          "crafting_time": 2.0,
          "ingredients": [
            { "itemId": "magnetic-coil", "amount": 2 },
            { "itemId": "iron-ingot", "amount": 2 }
          ],
          "products": [{ "itemId": "em-turbine", "amount": 1 }],
          "category": "assembly"
        },
        "em-matrix": {
          "name": "Electromagnetic Matrix (Blue)",
          "crafting_time": 3.0,
          "ingredients": [
            { "itemId": "magnetic-coil", "amount": 1 },
            { "itemId": "circuit-board", "amount": 1 }
          ],
          "products": [{ "itemId": "em-matrix", "amount": 1 }],
          "category": "matrix"
        },
        "energy-matrix": {
          "name": "Energy Matrix (Red)",
          "crafting_time": 6.0,
          "ingredients": [
            { "itemId": "coal", "amount": 2 },
            { "itemId": "em-turbine", "amount": 1 }
          ],
          "products": [{ "itemId": "energy-matrix", "amount": 1 }],
          "category": "matrix"
        }
      },
      modifiers: {
        "proliferator-1": {
          "name": "Proliferator Mk.I Speed",
          "speed_bonus": 0.25,
          "productivity_bonus": 0.0,
          "category": "proliferation"
        },
        "proliferator-3": {
          "name": "Proliferator Mk.III Ultimate",
          "speed_bonus": 1.0,
          "productivity_bonus": 0.25,
          "category": "proliferation"
        }
      }
    }
  }
];
