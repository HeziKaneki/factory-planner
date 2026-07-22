import { Item, Recipe, Machine, Module, FactoryPage, FactoryPlannerLine } from '../types';

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

  // Ensure virtual "No Machine" is generated for all categories
  const machineCats = customDb.machine_categories || {
    'assembling-machine': 'Assembling Machines',
    'furnace': 'Furnaces',
    'chemical-plant': 'Chemical Plants',
    'miner': 'Mining Drills'
  };

  Object.entries(machineCats).forEach(([catId, catVal]: [string, any]) => {
    const catName = typeof catVal === 'object' ? catVal.name : catVal;
    machines[`no-machine-${catId}`] = {
      id: `no-machine-${catId}`,
      name: `No Machine (${catName})`,
      speed: 0,
      slots: 0,
      energy: 0,
      category: catId as any
    };
  });

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
        bgBorderColor: val.bgBorderColor || 'border-blue-500/80 bg-blue-950/70',
        category: val.category || 'no-category'
      };
    });
  }

  return { items, recipes, machines, modules };
}

// Default line configs if not explicitly created by user
export function createDefaultLine(recipeId: string, customDb?: any, targetItemId?: string): FactoryPlannerLine {
  const { recipes, machines } = normalizeDatabase(customDb);
  const recipe = recipes[recipeId];
  const catId = recipe?.category || 'assembling-machine';
  
  let defaultMachineId = `no-machine-${catId}`;

  if (customDb && customDb.machine_categories && customDb.machine_categories[catId]) {
    const catVal = customDb.machine_categories[catId];
    if (typeof catVal === 'object' && catVal.defaultMachineId) {
      if (machines[catVal.defaultMachineId]) {
        defaultMachineId = catVal.defaultMachineId;
      }
    }
  } else {
    // Fallbacks if categories are not fully defined as objects yet
    if (catId === 'furnace') {
      defaultMachineId = 'electric-furnace';
    } else if (catId === 'chemical-plant') {
      defaultMachineId = 'chemical-plant';
    } else if (catId === 'miner') {
      defaultMachineId = 'electric-mining-drill';
    } else {
      defaultMachineId = 'assembling-machine-3';
    }
  }

  let machineId = defaultMachineId;

  // Safe fallback if target machine id is missing
  if (!machines[machineId]) {
    const compatible = Object.values(machines).find(m => m.category === catId && m.id !== `no-machine-${catId}`);
    if (compatible) {
      machineId = compatible.id;
    } else {
      machineId = `no-machine-${catId}`;
    }
  }

  return {
    id: `line-${recipeId}-${Date.now()}-${Math.random()}`,
    recipeId,
    machineId,
    modifiers: [],
    enabled: true,
    targetItemId
  };
}

/**
 * Solves A * x = b using Gaussian elimination with partial pivoting.
 * Returns x array of crafts/sec for each enabled line if successful, or null if singular/unsolvable.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  if (n === 0) return [];

  // Create augmented matrix [A | b]
  const M: number[][] = [];
  for (let i = 0; i < n; i++) {
    M[i] = new Array(n + 1);
    for (let j = 0; j < n; j++) {
      M[i][j] = A[i][j];
    }
    M[i][n] = b[i];
  }

  // Forward elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(M[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }

    if (maxVal < 1e-9) {
      return null; // Singular matrix
    }

    // Swap max row to current row
    if (maxRow !== col) {
      const temp = M[col];
      M[col] = M[maxRow];
      M[maxRow] = temp;
    }

    // Eliminate column entries below
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) {
        M[row][k] -= factor * M[col][k];
      }
    }
  }

  // Back substitution
  const x: number[] = new Array(n);
  for (let row = n - 1; row >= 0; row--) {
    let sum = M[row][n];
    for (let col = row + 1; col < n; col++) {
      sum -= M[row][col] * x[col];
    }
    const pivot = M[row][row];
    if (Math.abs(pivot) < 1e-9) return null;
    x[row] = sum / pivot;
    if (isNaN(x[row]) || !isFinite(x[row])) return null;
  }

  return x;
}

export function solveTraditional(page: FactoryPage, customDb?: any): SolverResult {
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
    // Under the decoupled design, rates in targetProducts are always items/second!
    const ratePerSec = t.rate;
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

    if (lineConfig.modifiers) {
      lineConfig.modifiers.forEach(lm => {
        const mod = modules[lm.id];
        if (mod) {
          speedBonus += (mod.speedBonus || 0) * lm.count;
          prodBonus += (mod.productivityBonus || 0) * lm.count;
          energyBonus += (mod.energyBonus || 0) * lm.count;
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
      machineCount = actualSpeed > 0 ? (craftsPerSec * recipe.time) / actualSpeed : 0;
      energyUsage = (machine && actualSpeed > 0) ? machine.energy * energyModifier * machineCount : 0;

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
    outputRate = primaryOutputPerSec;

    // Ingredients rates for this step
    recipe.ingredients.forEach(ing => {
      const ratePerSec = craftsPerSec * ing.count;
      lineIngredients.push({
        itemId: ing.itemId,
        rate: ratePerSec
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
        rate: diff
      });
    } else if (diff < -0.0001) {
      // Ingredient (deficit)
      ingredientsSummary.push({
        itemId,
        rate: -diff
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

export function solveMatrix(page: FactoryPage, customDb?: any): SolverResult | null {
  const { items, recipes, machines, modules } = normalizeDatabase(customDb);

  const targets = page.targetProducts ? page.targetProducts : (page.targetItemId ? [{ itemId: page.targetItemId, rate: page.targetRate }] : []);
  const targetMap = new Map<string, number>();
  targets.forEach(t => {
    targetMap.set(t.itemId, (targetMap.get(t.itemId) || 0) + t.rate);
  });

  // Filter enabled lines
  const enabledLineEntries: { lineConfig: FactoryPlannerLine; index: number }[] = [];
  page.lines.forEach((lineConfig, index) => {
    if (lineConfig.enabled) {
      enabledLineEntries.push({ lineConfig, index });
    }
  });

  const K = enabledLineEntries.length;
  if (K === 0) {
    return null;
  }

  // Pre-calculate line properties
  const lineDetails = enabledLineEntries.map(entry => {
    const recipe = recipes[entry.lineConfig.recipeId];
    const primaryProductId = entry.lineConfig.targetItemId || recipe?.products?.[0]?.itemId || entry.lineConfig.recipeId;
    const machine = machines[entry.lineConfig.machineId] || Object.values(machines)[0];

    let speedBonus = 0;
    let prodBonus = 0;
    let energyBonus = 0;

    if (entry.lineConfig.modifiers) {
      entry.lineConfig.modifiers.forEach(lm => {
        const mod = modules[lm.id];
        if (mod) {
          speedBonus += (mod.speedBonus || 0) * lm.count;
          prodBonus += (mod.productivityBonus || 0) * lm.count;
          energyBonus += (mod.energyBonus || 0) * lm.count;
        }
      });
    }

    const speedModifier = Math.max(0.20, 1 + speedBonus);
    const productivityBonus = Math.max(0, prodBonus);
    const energyModifier = Math.max(0.20, 1 + energyBonus);
    const actualSpeed = machine ? machine.speed * speedModifier : 1;

    return {
      lineConfig: entry.lineConfig,
      recipe,
      primaryProductId,
      machine,
      speedModifier,
      productivityBonus,
      energyModifier,
      actualSpeed
    };
  });

  // Construct Matrix A (K x K) and Vector b (K x 1)
  const A: number[][] = Array.from({ length: K }, () => new Array(K).fill(0));
  const b: number[] = new Array(K).fill(0);

  const assignedTargetItems = new Set<string>();

  for (let i = 0; i < K; i++) {
    const primaryItem = lineDetails[i].primaryProductId;
    
    if (targetMap.has(primaryItem) && !assignedTargetItems.has(primaryItem)) {
      b[i] = targetMap.get(primaryItem) || 0;
      assignedTargetItems.add(primaryItem);
    } else {
      b[i] = 0;
    }

    for (let j = 0; j < K; j++) {
      const recipeJ = lineDetails[j].recipe;
      if (!recipeJ) continue;

      let netProductionPerCraft = 0;

      // Add production from recipe J
      const recipeProducts = recipeJ.products || [{ itemId: recipeJ.id, amount: recipeJ.yield || 1 }];
      recipeProducts.forEach(p => {
        if (p.itemId === primaryItem) {
          netProductionPerCraft += p.amount * (1 + lineDetails[j].productivityBonus);
        }
      });

      // Subtract consumption from recipe J
      if (recipeJ.ingredients) {
        recipeJ.ingredients.forEach(ing => {
          if (ing.itemId === primaryItem) {
            netProductionPerCraft -= ing.count;
          }
        });
      }

      A[i][j] = netProductionPerCraft;
    }
  }

  // Solve A * x = b
  const x = solveLinearSystem(A, b);
  if (!x) {
    return null; // Fall back if matrix is singular
  }

  // Ensure no craft rate is negative
  for (let i = 0; i < K; i++) {
    if (x[i] < -1e-6) {
      return null; // Fall back if negative rates
    }
    if (x[i] < 0) x[i] = 0;
  }

  // Build line outputs and global demands/supplies
  const demands = new Map<string, number>();
  const supplies = new Map<string, number>();

  targets.forEach(t => {
    demands.set(t.itemId, (demands.get(t.itemId) || 0) + t.rate);
  });

  const calculatedLinesMap = new Map<string, CalculatedLine>();

  lineDetails.forEach((detail, i) => {
    const craftsPerSec = x[i];
    const recipe = detail.recipe;
    const lineConfig = detail.lineConfig;

    let machineCount = 0;
    let energyUsage = 0;
    let outputRate = 0;
    const lineIngredients: { itemId: string; rate: number }[] = [];

    if (recipe) {
      machineCount = detail.actualSpeed > 0 ? (craftsPerSec * recipe.time) / detail.actualSpeed : 0;
      energyUsage = (detail.machine && detail.actualSpeed > 0) ? detail.machine.energy * detail.energyModifier * machineCount : 0;

      if (recipe.ingredients) {
        recipe.ingredients.forEach(ing => {
          const ingRate = craftsPerSec * ing.count;
          lineIngredients.push({ itemId: ing.itemId, rate: ingRate });
          demands.set(ing.itemId, (demands.get(ing.itemId) || 0) + ingRate);
        });
      }

      const recipeProducts = recipe.products || [{ itemId: recipe.id, amount: recipe.yield || 1 }];
      recipeProducts.forEach(p => {
        const prodRate = craftsPerSec * p.amount * (1 + detail.productivityBonus);
        supplies.set(p.itemId, (supplies.get(p.itemId) || 0) + prodRate);
      });

      const targetProduct = recipe.products?.find(p => p.itemId === detail.primaryProductId) || recipe.products?.[0] || null;
      const primaryYield = targetProduct ? targetProduct.amount : (recipe.yield || 1);
      outputRate = craftsPerSec * primaryYield * (1 + detail.productivityBonus);
    }

    calculatedLinesMap.set(lineConfig.id, {
      recipeId: lineConfig.recipeId,
      machineId: detail.machine ? detail.machine.id : 'unknown',
      machineCount,
      speedModifier: detail.speedModifier,
      productivityBonus: detail.productivityBonus,
      energyUsage,
      outputRate,
      ingredients: lineIngredients,
      enabled: true,
      lineConfig
    });
  });

  const calculatedLines: CalculatedLine[] = page.lines.map(lineConfig => {
    if (!lineConfig.enabled) {
      const recipe = recipes[lineConfig.recipeId];
      const machine = machines[lineConfig.machineId] || Object.values(machines)[0];
      return {
        recipeId: lineConfig.recipeId,
        machineId: machine ? machine.id : 'unknown',
        machineCount: 0,
        speedModifier: 1,
        productivityBonus: 0,
        energyUsage: 0,
        outputRate: 0,
        ingredients: recipe?.ingredients ? recipe.ingredients.map(ing => ({ itemId: ing.itemId, rate: 0 })) : [],
        enabled: false,
        lineConfig
      };
    }

    const calc = calculatedLinesMap.get(lineConfig.id);
    if (calc) return calc;

    return {
      recipeId: lineConfig.recipeId,
      machineId: 'unknown',
      machineCount: 0,
      speedModifier: 1,
      productivityBonus: 0,
      energyUsage: 0,
      outputRate: 0,
      ingredients: [],
      enabled: false,
      lineConfig
    };
  });

  const totalPower = calculatedLines.reduce((sum, line) => sum + (line.enabled ? line.energyUsage : 0), 0);

  const productsSummary: { itemId: string; rate: number }[] = [];
  const byproductsSummary: { itemId: string; rate: number }[] = [];
  const ingredientsSummary: { itemId: string; rate: number }[] = [];

  targets.forEach(t => {
    productsSummary.push({ itemId: t.itemId, rate: t.rate });
  });

  const allItemIds = new Set([...Array.from(supplies.keys()), ...Array.from(demands.keys())]);

  allItemIds.forEach(itemId => {
    const supply = supplies.get(itemId) || 0;
    const demand = demands.get(itemId) || 0;
    const diff = supply - demand;

    if (diff > 0.0001) {
      byproductsSummary.push({ itemId, rate: diff });
    } else if (diff < -0.0001) {
      ingredientsSummary.push({ itemId, rate: -diff });
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

export function solveFactoryPage(page: FactoryPage, customDb?: any): SolverResult {
  if (page.solverMode === 'matrix') {
    const matrixRes = solveMatrix(page, customDb);
    if (matrixRes) {
      return matrixRes;
    }
  }
  return solveTraditional(page, customDb);
}
