export interface Item {
  id: string;
  name: string;
  iconType: string; // 'svg' or a specific name like 'iron-plate', 'circuit', etc.
  category: 'raw' | 'intermediate' | 'science' | 'fluid' | 'utility' | 'no-category';
  color?: string; // Background / primary color of the item representation
}

export interface Ingredient {
  itemId: string;
  count: number;
}

export interface Recipe {
  id: string;
  name: string;
  time: number; // in seconds
  yield: number; // base output amount
  ingredients: Ingredient[];
  category: 'assembling-machine' | 'furnace' | 'miner' | 'chemical-plant';
}

export interface Machine {
  id: string;
  name: string;
  speed: number; // base crafting speed
  slots: number; // number of module slots
  energy: number; // power consumption in kW
  category: 'assembling-machine' | 'furnace' | 'miner' | 'chemical-plant';
}

export interface Module {
  id: string;
  name: string;
  speedBonus: number; // e.g. 0.50 = +50%
  productivityBonus: number; // e.g. 0.10 = +10%
  energyBonus: number; // e.g. 0.80 = +80%
  color: string; // slate, yellow, red, blue
  bgBorderColor: string;
  category?: string;
}

export interface LineModifier {
  id: string;
  count: number;
}

export interface FactoryPlannerLine {
  id: string;
  recipeId: string;
  machineId: string;
  modifiers: LineModifier[]; // list of applied modifiers
  enabled: boolean;
  isCustomMachine?: boolean;
  targetItemId?: string;
}

export interface FactoryPage {
  id: string;
  name: string;
  targetItemId: string; // fallback / single target
  targetRate: number; // fallback / single target rate
  targetProducts?: { itemId: string; rate: number }[]; // dynamic multiple target products
  rateUnit: 'second' | 'minute' | 'belt';
  beltSpeed?: number; // belt transport speed (items/second) - defaults to 15
  lines: FactoryPlannerLine[];
  solverMode: 'traditional' | 'matrix';
  itemsViewMode: 'items-m' | 'items-s'; // Items/m or Items/s
  normalizedToSec?: boolean;
}

export interface CustomDb {
  game_name: string;
  categories?: Record<string, string>;
  machine_categories?: Record<string, string | { name: string; defaultMachineId?: string }>;
  modifier_categories?: Record<string, string>;
  items: Record<string, { name: string; category?: string }>;
  machines: Record<string, { name: string; crafting_speed: number; slots?: number; energy?: number; category?: string }>;
  recipes: Record<string, {
    name: string;
    crafting_time: number;
    ingredients: { itemId: string; amount: number }[];
    products: { itemId: string; amount: number }[];
    category?: string;
  }>;
  modifiers: Record<string, { name: string; speed_bonus: number; productivity_bonus: number; energy_bonus: number; category?: string }>;
}

