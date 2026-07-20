import { Item, Recipe, Machine, Module, FactoryPage, FactoryPlannerLine } from '../types';
import { ITEMS, RECIPES, MACHINES, MODULES } from '../data/recipes';

export interface CalculatedLine {
  recipeId: string;
  machineId: string;
  machineCount: number;
  speedModifier: number;
  productivityBonus: number;
  energyUsage: number; // in kW
  outputRate: number; // in units of page.rateUnit (per second or per minute)
  ingredients: { itemId: string; rate: number }[]; // in units of page.rateUnit
  enabled: boolean;
  lineConfig: FactoryPlannerLine;
}

export interface SolverResult {
  lines: CalculatedLine[];
  productsSummary: { itemId: string; rate: number }[];
  ingredientsSummary: { itemId: string; rate: number }[];
  byproductsSummary: { itemId: string; rate: number }[];
  totalPower: number; // in kW
}

// Normalize user custom database format or use standard fallback
export function normalizeDatabase(customDb: any) {
  const items: Record<string, Item> = {};
  const recipes: Record<string, Recipe & { products?: { itemId: string; amount: number }[] }> = {};
  const machines: Record<string, Machine> = {};
  const modules: Record<string, Module> = {};

  // Initialize with standard fallbacks so older components don't crash
  Object.entries(ITEMS).forEach(([id, item]) => {
    items[id] = { ...item };
  });
  Object.entries(RECIPES).forEach(([id, recipe]) => {
    recipes[id] = {
      ...recipe,
      products: [{ itemId: id, amount: recipe.yield || 1 }]
    };
  });
  Object.entries(MACHINES).forEach(([id, machine]) => {
    machines[id] = { ...machine };
  });
  Object.entries(MODULES).forEach(([id, mod]) => {
    modules[id] = { ...mod };
  });

  if (!customDb) {
    return { items, recipes, machines, modules };
  }

  // Override / extend with custom database entries if specified
  if (customDb.items) {
    Object.entries(customDb.items).forEach(([id, val]: [string, any]) => {
      items[id] = {
        id,
        name: val.name || id,
        iconType: id,
        category: val.category || 'no-category'
      };
    });
  }

  if (customDb.machines) {
    Object.entries(customDb.machines).forEach(([id, val]: [string, any]) => {
      machines[id] = {
        id,
        name: val.name || id,
        speed: typeof val.crafting_speed !== 'undefined' ? val.crafting_speed : (val.speed || 1.0),
        slots: typeof val.slots !== 'undefined' ? val.slots : 2,
        energy: typeof val.energy !== 'undefined' ? val.energy : 150,
        category: val.category || 'assembling-machine'
      };
    });
  }

  if (customDb.recipes) {
    Object.entries(customDb.recipes).forEach(([id, val]: [string, any]) => {
      const recipeIngredients = Array.isArray(val.ingredients)
        ? val.ingredients.map((ing: any) => ({ itemId: ing.itemId, count: ing.amount || ing.count || 1 }))
        : [];
      
      const recipeProducts = Array.isArray(val.products)
        ? val.products.map((p: any) => ({ itemId: p.itemId, amount: p.amount || p.count || 1 }))
        : [{ itemId: id, amount: val.yield || 1 }];

      recipes[id] = {
        id,
        name: val.name || id,
        time: typeof val.crafting_time !== 'undefined' ? val.crafting_time : (val.time || 1.0),
        yield: recipeProducts[0]?.amount || 1,
        ingredients: recipeIngredients,
        category: val.category || 'assembling-machine',
        products: recipeProducts
      };
    });
  }

  if (customDb.modifiers) {
    Object.entries(customDb.modifiers).forEach(([id, val]: [string, any]) => {
      modules[id] = {
        id,
        name: val.name || id,
        speedBonus: typeof val.speed_bonus !== 'undefined' ? val.speed_bonus : (val.speedBonus || 0.0),
        productivityBonus: typeof val.productivity_bonus !== 'undefined' ? val.productivity_bonus : (val.productivityBonus || 0.0),
        energyBonus: typeof val.energy_bonus !== 'undefined' ? val.energy_bonus : (val.energyBonus || 0.0),
        color: val.color || 'blue',
        bgBorderColor: val.bgBorderColor || 'border-blue-500/80 bg-blue-950/70'
      };
    });
  }

  return { items, recipes, machines, modules };
}

// Default line configs if not explicitly created by user
export function createDefaultLine(recipeId: string, customDb?: any, targetItemId?: string): FactoryPlannerLine {
  const { recipes, machines } = normalizeDatabase(customDb);
  const recipe = recipes[recipeId];
  let machineId = 'assembling-machine-3';

  if (recipe) {
    const compatible = Object.values(machines).find(m => m.category === recipe.category);
    if (compatible) {
      machineId = compatible.id;
    } else {
      if (recipe.category === 'furnace') {
        machineId = 'electric-furnace';
      } else if (recipe.category === 'chemical-plant') {
        machineId = 'chemical-plant';
      } else if (recipe.category === 'miner') {
        machineId = 'electric-mining-drill';
      }
    }
  }

  // Safe fallback if target machine id is missing
  if (!machines[machineId]) {
    const firstMachineId = Object.keys(machines)[0];
    if (firstMachineId) machineId = firstMachineId;
  }

  return {
    id: `line-${recipeId}`,
    recipeId,
    machineId,
    modules: [],
    beaconId: null,
    beaconCount: 0,
    beaconModules: [],
    enabled: true,
    targetItemId
  };
}

export function solveFactoryPage(page: FactoryPage, customDb?: any): SolverResult {
  const { items, recipes, machines, modules } = normalizeDatabase(customDb);

  // 1. Index current lines for easy lookup
  const linesMap = new Map<string, FactoryPlannerLine>();
  page.lines.forEach(line => {
    linesMap.set(line.recipeId, line);
  });

  const getLineConfig = (recipeId: string): FactoryPlannerLine => {
    let line = linesMap.get(recipeId);
    if (!line) {
      line = createDefaultLine(recipeId, customDb);
    }
    return line;
  };

  // 2. Manual sequential step solver using demand and supply pools
  const demands = new Map<string, number>(); // itemId -> demand rate (per second)
  const supplies = new Map<string, number>(); // itemId -> supply rate (per second)

  // Initialize demands with target products
  const targets = page.targetProducts ? page.targetProducts : (page.targetItemId ? [{ itemId: page.targetItemId, rate: page.targetRate }] : []);
  targets.forEach(t => {
    const ratePerSec = page.rateUnit === 'second' ? t.rate : t.rate / 60;
    demands.set(t.itemId, (demands.get(t.itemId) || 0) + ratePerSec);
  });

  const calculatedLines: CalculatedLine[] = [];

  // Walk through each page step sequentially in their exact order
  page.lines.forEach(lineConfig => {
    const recipeId = lineConfig.recipeId;
    const recipe = recipes[recipeId];
    if (!recipe) return;

    const primaryProductId = lineConfig.targetItemId || recipe.products?.[0]?.itemId || recipe.id;

    // Get current demand and supply of primary product
    const currentDemand = demands.get(primaryProductId) || 0;
    const currentSupply = supplies.get(primaryProductId) || 0;
    const netDemand = currentDemand - currentSupply;

    let craftsPerSec = 0;
    let machineCount = 0;
    let speedModifier = 1;
    let productivityBonus = 0;
    let energyUsage = 0;
    let outputRate = 0;
    const lineIngredients: { itemId: string; rate: number }[] = [];

    const machine = machines[lineConfig.machineId] || Object.values(machines)[0];

    // Compute speed, productivity and energy bonuses
    let speedBonus = 0;
    let prodBonus = 0;
    let energyBonus = 0;

    lineConfig.modules.forEach(modId => {
      const mod = modules[modId];
      if (mod) {
        speedBonus += mod.speedBonus;
        prodBonus += mod.productivityBonus;
        energyBonus += mod.energyBonus;
      }
    });

    if (lineConfig.beaconId && lineConfig.beaconCount > 0) {
      lineConfig.beaconModules.forEach(modId => {
        const mod = modules[modId];
        if (mod) {
          speedBonus += lineConfig.beaconCount * 0.5 * mod.speedBonus;
          energyBonus += lineConfig.beaconCount * 0.5 * mod.energyBonus;
        }
      });
    }

    speedModifier = Math.max(0.20, 1 + speedBonus);
    productivityBonus = Math.max(0, prodBonus);
    const energyModifier = Math.max(0.20, 1 + energyBonus);

    const actualSpeed = machine ? machine.speed * speedModifier : 1;

    // If the line is enabled and there is net demand, calculate crafts and add to pools
    if (lineConfig.enabled && netDemand > 0.0001) {
      const targetProduct = recipe.products?.find(p => p.itemId === primaryProductId) || recipe.products?.[0] || null;
      const baseYield = targetProduct ? targetProduct.amount : (recipe.yield || 1);
      const actualYield = baseYield * (1 + productivityBonus);
      craftsPerSec = netDemand / actualYield;
      machineCount = (craftsPerSec * recipe.time) / actualSpeed;
      energyUsage = machine ? machine.energy * energyModifier * machineCount : 0;

      // Add demands for all ingredients
      recipe.ingredients.forEach(ing => {
        const ingRatePerSec = craftsPerSec * ing.count;
        demands.set(ing.itemId, (demands.get(ing.itemId) || 0) + ingRatePerSec);
      });

      // Add supplies for all products
      const recipeProducts = recipe.products || [{ itemId: recipe.id, amount: recipe.yield || 1 }];
      recipeProducts.forEach(p => {
        const yieldPerCraft = p.amount * (1 + productivityBonus);
        const prodRatePerSec = craftsPerSec * yieldPerCraft;
        supplies.set(p.itemId, (supplies.get(p.itemId) || 0) + prodRatePerSec);
      });
    }

    // Visual output rate of primary product for this step
    const targetProduct = recipe.products?.find(p => p.itemId === primaryProductId) || recipe.products?.[0] || null;
    const primaryYield = targetProduct ? targetProduct.amount : (recipe.yield || 1);
    const primaryOutputPerSec = craftsPerSec * primaryYield * (1 + productivityBonus);
    outputRate = page.rateUnit === 'second' ? primaryOutputPerSec : primaryOutputPerSec * 60;

    // Ingredients rates for this step
    recipe.ingredients.forEach(ing => {
      const ratePerSec = craftsPerSec * ing.count;
      lineIngredients.push({
        itemId: ing.itemId,
        rate: page.rateUnit === 'second' ? ratePerSec : ratePerSec * 60
      });
    });

    calculatedLines.push({
      recipeId,
      machineId: machine ? machine.id : 'unknown',
      machineCount,
      speedModifier,
      productivityBonus,
      energyUsage,
      outputRate,
      ingredients: lineIngredients,
      enabled: lineConfig.enabled,
      lineConfig
    });
  });

  // 4. Power
  const totalPower = calculatedLines.reduce((sum, line) => sum + (line.enabled ? line.energyUsage : 0), 0);

  // 5. Summaries based on supply minus demand balances after all steps
  const productsSummary: { itemId: string; rate: number }[] = [];
  const byproductsSummary: { itemId: string; rate: number }[] = [];
  const ingredientsSummary: { itemId: string; rate: number }[] = [];

  // Target products are listed in productsSummary
  targets.forEach(t => {
    productsSummary.push({
      itemId: t.itemId,
      rate: t.rate
    });
  });

  // Gather union of all item IDs present in demands or supplies
  const allItemIds = new Set([...Array.from(supplies.keys()), ...Array.from(demands.keys())]);

  allItemIds.forEach(itemId => {
    const supply = supplies.get(itemId) || 0;
    const demand = demands.get(itemId) || 0;
    const diff = supply - demand;

    if (diff > 0.0001) {
      // Byproduct (surplus)
      byproductsSummary.push({
        itemId,
        rate: page.rateUnit === 'second' ? diff : diff * 60
      });
    } else if (diff < -0.0001) {
      // Ingredient (deficit)
      ingredientsSummary.push({
        itemId,
        rate: page.rateUnit === 'second' ? -diff : -diff * 60
      });
    }
  });

  return {
    lines: calculatedLines,
    productsSummary,
    ingredientsSummary,
    byproductsSummary,
    totalPower
  };
}
