import { Item, Recipe, Machine, Module } from '../types';

export const ITEMS: Record<string, Item> = {
  'utility-science-pack': { id: 'utility-science-pack', name: 'Utility Science Pack', iconType: 'utility-science-pack', category: 'science', color: '#9b59b6' },
  'advanced-circuit': { id: 'advanced-circuit', name: 'Advanced Circuit', iconType: 'advanced-circuit', category: 'intermediate', color: '#e74c3c' },
  'electronic-circuit': { id: 'electronic-circuit', name: 'Electronic Circuit', iconType: 'electronic-circuit', category: 'intermediate', color: '#2ecc71' },
  'processing-unit': { id: 'processing-unit', name: 'Processing Unit', iconType: 'processing-unit', category: 'intermediate', color: '#3498db' },
  'copper-cable': { id: 'copper-cable', name: 'Copper Cable', iconType: 'copper-cable', category: 'intermediate', color: '#d35400' },
  'flying-robot-frame': { id: 'flying-robot-frame', name: 'Flying Robot Frame', iconType: 'flying-robot-frame', category: 'intermediate', color: '#95a5a6' },
  'low-density-structure': { id: 'low-density-structure', name: 'Low-Density Structure', iconType: 'low-density-structure', category: 'intermediate', color: '#f1c40f' },
  'electric-engine-unit': { id: 'electric-engine-unit', name: 'Electric Engine Unit', iconType: 'electric-engine-unit', category: 'intermediate', color: '#1abc9c' },
  'engine-unit': { id: 'engine-unit', name: 'Engine Unit', iconType: 'engine-unit', category: 'intermediate', color: '#7f8c8d' },
  'iron-gear-wheel': { id: 'iron-gear-wheel', name: 'Iron Gear Wheel', iconType: 'iron-gear-wheel', category: 'intermediate', color: '#7f8c8d' },
  'iron-pipe': { id: 'iron-pipe', name: 'Iron Pipe', iconType: 'iron-pipe', category: 'intermediate', color: '#95a5a6' },
  'steel-plate': { id: 'steel-plate', name: 'Steel Plate', iconType: 'steel-plate', category: 'intermediate', color: '#bdc3c7' },
  'iron-plate': { id: 'iron-plate', name: 'Iron Plate', iconType: 'iron-plate', category: 'intermediate', color: '#7f8c8d' },
  'copper-plate': { id: 'copper-plate', name: 'Copper Plate', iconType: 'copper-plate', category: 'intermediate', color: '#e67e22' },
  'plastic-bar': { id: 'plastic-bar', name: 'Plastic Bar', iconType: 'plastic-bar', category: 'intermediate', color: '#2c3e50' },
  'battery': { id: 'battery', name: 'Battery', iconType: 'battery', category: 'intermediate', color: '#27ae60' },
  'stone-brick': { id: 'stone-brick', name: 'Stone Brick', iconType: 'stone-brick', category: 'intermediate', color: '#d35400' },
  'sulfur': { id: 'sulfur', name: 'Sulfur', iconType: 'sulfur', category: 'intermediate', color: '#f1c40f' },
  'sulfuric-acid': { id: 'sulfuric-acid', name: 'Sulfuric Acid', iconType: 'sulfuric-acid', category: 'fluid', color: '#f1c40f' },
  'lubricant': { id: 'lubricant', name: 'Lubricant', iconType: 'lubricant', category: 'fluid', color: '#2ecc71' },
  'petroleum-gas': { id: 'petroleum-gas', name: 'Petroleum Gas', iconType: 'petroleum-gas', category: 'fluid', color: '#ecf0f1' },
  'heavy-oil': { id: 'heavy-oil', name: 'Heavy Oil', iconType: 'heavy-oil', category: 'fluid', color: '#34495e' },
  'water': { id: 'water', name: 'Water', iconType: 'water', category: 'fluid', color: '#3498db' },
  'coal': { id: 'coal', name: 'Coal', iconType: 'coal', category: 'raw', color: '#111111' },
  'iron-ore': { id: 'iron-ore', name: 'Iron Ore', iconType: 'iron-ore', category: 'raw', color: '#7f8c8d' },
  'copper-ore': { id: 'copper-ore', name: 'Copper Ore', iconType: 'copper-ore', category: 'raw', color: '#16a085' },
  'stone': { id: 'stone', name: 'Stone', iconType: 'stone', category: 'raw', color: '#95a5a6' },
  'electric-energy': { id: 'electric-energy', name: 'Electricity', iconType: 'electricity', category: 'utility', color: '#f1c40f' }
};

export const RECIPES: Record<string, Recipe> = {
  'utility-science-pack': {
    id: 'utility-science-pack',
    name: 'Utility Science Pack',
    time: 15,
    yield: 3,
    ingredients: [
      { itemId: 'flying-robot-frame', count: 1 },
      { itemId: 'low-density-structure', count: 3 },
      { itemId: 'processing-unit', count: 2 }
    ],
    category: 'assembling-machine'
  },
  'advanced-circuit': {
    id: 'advanced-circuit',
    name: 'Advanced Circuit',
    time: 6,
    yield: 1,
    ingredients: [
      { itemId: 'electronic-circuit', count: 2 },
      { itemId: 'plastic-bar', count: 2 },
      { itemId: 'copper-cable', count: 4 }
    ],
    category: 'assembling-machine'
  },
  'electronic-circuit': {
    id: 'electronic-circuit',
    name: 'Electronic Circuit',
    time: 0.5,
    yield: 1,
    ingredients: [
      { itemId: 'iron-plate', count: 1 },
      { itemId: 'copper-cable', count: 3 }
    ],
    category: 'assembling-machine'
  },
  'processing-unit': {
    id: 'processing-unit',
    name: 'Processing Unit',
    time: 10,
    yield: 1,
    ingredients: [
      { itemId: 'electronic-circuit', count: 20 },
      { itemId: 'advanced-circuit', count: 2 },
      { itemId: 'sulfuric-acid', count: 5 } // 5 units of acid
    ],
    category: 'assembling-machine'
  },
  'copper-cable': {
    id: 'copper-cable',
    name: 'Copper Cable',
    time: 0.5,
    yield: 2,
    ingredients: [
      { itemId: 'copper-plate', count: 1 }
    ],
    category: 'assembling-machine'
  },
  'flying-robot-frame': {
    id: 'flying-robot-frame',
    name: 'Flying Robot Frame',
    time: 20,
    yield: 1,
    ingredients: [
      { itemId: 'electric-engine-unit', count: 1 },
      { itemId: 'battery', count: 2 },
      { itemId: 'steel-plate', count: 1 },
      { itemId: 'electronic-circuit', count: 3 }
    ],
    category: 'assembling-machine'
  },
  'low-density-structure': {
    id: 'low-density-structure',
    name: 'Low-Density Structure',
    time: 20,
    yield: 1,
    ingredients: [
      { itemId: 'steel-plate', count: 5 },
      { itemId: 'copper-plate', count: 5 },
      { itemId: 'plastic-bar', count: 3 }
    ],
    category: 'assembling-machine'
  },
  'electric-engine-unit': {
    id: 'electric-engine-unit',
    name: 'Electric Engine Unit',
    time: 10,
    yield: 1,
    ingredients: [
      { itemId: 'engine-unit', count: 1 },
      { itemId: 'electronic-circuit', count: 2 },
      { itemId: 'lubricant', count: 15 }
    ],
    category: 'assembling-machine'
  },
  'engine-unit': {
    id: 'engine-unit',
    name: 'Engine Unit',
    time: 10,
    yield: 1,
    ingredients: [
      { itemId: 'steel-plate', count: 1 },
      { itemId: 'iron-gear-wheel', count: 1 },
      { itemId: 'iron-pipe', count: 2 }
    ],
    category: 'assembling-machine'
  },
  'iron-gear-wheel': {
    id: 'iron-gear-wheel',
    name: 'Iron Gear Wheel',
    time: 0.5,
    yield: 1,
    ingredients: [
      { itemId: 'iron-plate', count: 2 }
    ],
    category: 'assembling-machine'
  },
  'iron-pipe': {
    id: 'iron-pipe',
    name: 'Iron Pipe',
    time: 0.5,
    yield: 1,
    ingredients: [
      { itemId: 'iron-plate', count: 1 }
    ],
    category: 'assembling-machine'
  },
  'steel-plate': {
    id: 'steel-plate',
    name: 'Steel Plate',
    time: 16,
    yield: 1,
    ingredients: [
      { itemId: 'iron-plate', count: 5 }
    ],
    category: 'furnace'
  },
  'iron-plate': {
    id: 'iron-plate',
    name: 'Iron Plate',
    time: 3.2,
    yield: 1,
    ingredients: [
      { itemId: 'iron-ore', count: 1 }
    ],
    category: 'furnace'
  },
  'copper-plate': {
    id: 'copper-plate',
    name: 'Copper Plate',
    time: 3.2,
    yield: 1,
    ingredients: [
      { itemId: 'copper-ore', count: 1 }
    ],
    category: 'furnace'
  },
  'plastic-bar': {
    id: 'plastic-bar',
    name: 'Plastic Bar',
    time: 1,
    yield: 2,
    ingredients: [
      { itemId: 'coal', count: 1 },
      { itemId: 'petroleum-gas', count: 20 }
    ],
    category: 'chemical-plant'
  },
  'battery': {
    id: 'battery',
    name: 'Battery',
    time: 4,
    yield: 1,
    ingredients: [
      { itemId: 'iron-plate', count: 1 },
      { itemId: 'copper-plate', count: 1 },
      { itemId: 'sulfuric-acid', count: 20 }
    ],
    category: 'chemical-plant'
  },
  'stone-brick': {
    id: 'stone-brick',
    name: 'Stone Brick',
    time: 3.2,
    yield: 1,
    ingredients: [
      { itemId: 'stone', count: 2 }
    ],
    category: 'furnace'
  },
  'lubricant': {
    id: 'lubricant',
    name: 'Lubricant',
    time: 1,
    yield: 10,
    ingredients: [
      { itemId: 'heavy-oil', count: 10 }
    ],
    category: 'chemical-plant'
  },
  'sulfuric-acid': {
    id: 'sulfuric-acid',
    name: 'Sulfuric Acid',
    time: 1,
    yield: 50,
    ingredients: [
      { itemId: 'sulfur', count: 5 },
      { itemId: 'iron-plate', count: 1 },
      { itemId: 'water', count: 10 }
    ],
    category: 'chemical-plant'
  },
  'sulfur': {
    id: 'sulfur',
    name: 'Sulfur',
    time: 1,
    yield: 2,
    ingredients: [
      { itemId: 'petroleum-gas', count: 30 },
      { itemId: 'water', count: 30 }
    ],
    category: 'chemical-plant'
  },
  'iron-ore': {
    id: 'iron-ore',
    name: 'Iron Ore',
    time: 1,
    yield: 1,
    ingredients: [],
    category: 'miner'
  },
  'copper-ore': {
    id: 'copper-ore',
    name: 'Copper Ore',
    time: 1,
    yield: 1,
    ingredients: [],
    category: 'miner'
  },
  'coal': {
    id: 'coal',
    name: 'Coal',
    time: 1,
    yield: 1,
    ingredients: [],
    category: 'miner'
  },
  'stone': {
    id: 'stone',
    name: 'Stone',
    time: 1,
    yield: 1,
    ingredients: [],
    category: 'miner'
  },
};

export const MACHINES: Record<string, Machine> = {
  'assembling-machine-3': { id: 'assembling-machine-3', name: 'Assembling machine 3', speed: 1.25, slots: 4, energy: 375, category: 'assembling-machine' },
  'assembling-machine-2': { id: 'assembling-machine-2', name: 'Assembling machine 2', speed: 0.75, slots: 2, energy: 150, category: 'assembling-machine' },
  'assembling-machine-1': { id: 'assembling-machine-1', name: 'Assembling machine 1', speed: 0.5, slots: 0, energy: 75, category: 'assembling-machine' },
  'electric-furnace': { id: 'electric-furnace', name: 'Electric furnace', speed: 2.0, slots: 2, energy: 180, category: 'furnace' },
  'steel-furnace': { id: 'steel-furnace', name: 'Steel furnace', speed: 2.0, slots: 0, energy: 90, category: 'furnace' }, // fueled but modeled as energy
  'stone-furnace': { id: 'stone-furnace', name: 'Stone furnace', speed: 1.0, slots: 0, energy: 90, category: 'furnace' },
  'chemical-plant': { id: 'chemical-plant', name: 'Chemical plant', speed: 1.0, slots: 3, energy: 210, category: 'chemical-plant' },
  'electric-mining-drill': { id: 'electric-mining-drill', name: 'Electric mining drill', speed: 0.5, slots: 3, energy: 90, category: 'miner' }
};

export const MODULES: Record<string, Module> = {
  'speed-module-3': { id: 'speed-module-3', name: 'Speed module 3', speedBonus: 0.50, productivityBonus: 0.0, energyBonus: 0.70, color: 'blue', bgBorderColor: 'border-blue-500/80 bg-blue-950/70' },
  'productivity-module-3': { id: 'productivity-module-3', name: 'Productivity module 3', speedBonus: -0.15, productivityBonus: 0.10, energyBonus: 0.80, color: 'red', bgBorderColor: 'border-red-500/80 bg-red-950/70' },
  'efficiency-module-3': { id: 'efficiency-module-3', name: 'Efficiency module 3', speedBonus: 0.0, productivityBonus: 0.0, energyBonus: -0.50, color: 'green', bgBorderColor: 'border-green-500/80 bg-green-950/70' }
};
