import { FactoryPage } from '../types';

export const DEFAULT_PAGES: FactoryPage[] = [
  {
    id: 'page-utility-science',
    name: 'Utility Science Pack Line',
    targetItemId: 'utility-science-pack',
    targetRate: 180,
    rateUnit: 'minute',
    solverMode: 'traditional',
    itemsViewMode: 'items-m',
    lines: [
      {
        id: 'line-utility-science-pack',
        recipeId: 'utility-science-pack',
        machineId: 'assembling-machine-3',
        modifiers: [
          { id: 'productivity-module-3', count: 4 },
          { id: 'speed-module-3', count: 8 }
        ],
        enabled: true
      },
      {
        id: 'line-advanced-circuit',
        recipeId: 'advanced-circuit',
        machineId: 'assembling-machine-3',
        modifiers: [
          { id: 'productivity-module-3', count: 4 },
          { id: 'speed-module-3', count: 8 }
        ],
        enabled: true
      },
      {
        id: 'line-electronic-circuit',
        recipeId: 'electronic-circuit',
        machineId: 'assembling-machine-3',
        modifiers: [
          { id: 'productivity-module-3', count: 4 }
        ],
        enabled: true
      },
      {
        id: 'line-copper-cable',
        recipeId: 'copper-cable',
        machineId: 'assembling-machine-3',
        modifiers: [
          { id: 'productivity-module-3', count: 4 }
        ],
        enabled: true
      },
      {
        id: 'line-steel-plate',
        recipeId: 'steel-plate',
        machineId: 'electric-furnace',
        modifiers: [
          { id: 'productivity-module-3', count: 2 },
          { id: 'speed-module-3', count: 8 }
        ],
        enabled: true
      },
      {
        id: 'line-stone-brick',
        recipeId: 'stone-brick',
        machineId: 'electric-furnace',
        modifiers: [],
        enabled: true
      },
      {
        id: 'line-iron-ore',
        recipeId: 'iron-ore',
        machineId: 'electric-mining-drill',
        modifiers: [
          { id: 'speed-module-3', count: 2 }
        ],
        enabled: true
      }
    ]
  },
  {
    id: 'page-smeltery',
    name: 'High-Output Smeltery',
    targetItemId: 'steel-plate',
    targetRate: 600,
    rateUnit: 'minute',
    solverMode: 'traditional',
    itemsViewMode: 'items-m',
    lines: [
      {
        id: 'line-steel-plate-smelt',
        recipeId: 'steel-plate',
        machineId: 'electric-furnace',
        modifiers: [
          { id: 'productivity-module-3', count: 2 },
          { id: 'speed-module-3', count: 8 }
        ],
        enabled: true
      },
      {
        id: 'line-iron-plate-smelt',
        recipeId: 'iron-plate',
        machineId: 'electric-furnace',
        modifiers: [
          { id: 'productivity-module-3', count: 2 },
          { id: 'speed-module-3', count: 8 }
        ],
        enabled: true
      }
    ]
  },
  {
    id: 'page-circuits',
    name: 'Advanced Circuits Setup',
    targetItemId: 'advanced-circuit',
    targetRate: 10,
    rateUnit: 'second',
    solverMode: 'traditional',
    itemsViewMode: 'items-s',
    lines: [
      {
        id: 'line-advanced-circ',
        recipeId: 'advanced-circuit',
        machineId: 'assembling-machine-3',
        modifiers: [
          { id: 'productivity-module-3', count: 4 },
          { id: 'speed-module-3', count: 8 }
        ],
        enabled: true
      },
      {
        id: 'line-elec-circ',
        recipeId: 'electronic-circuit',
        machineId: 'assembling-machine-3',
        modifiers: [
          { id: 'productivity-module-3', count: 4 },
          { id: 'speed-module-3', count: 8 }
        ],
        enabled: true
      },
      {
        id: 'line-cop-cable',
        recipeId: 'copper-cable',
        machineId: 'assembling-machine-3',
        modifiers: [
          { id: 'productivity-module-3', count: 4 },
          { id: 'speed-module-3', count: 8 }
        ],
        enabled: true
      }
    ]
  }
];
