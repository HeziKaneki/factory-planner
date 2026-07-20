export const initialCustomDb = {
  game_name: "Factory Planner",
  categories: {
    "no-category": "No Category",
    "science": "Research & Space",
    "intermediate": "Intermediate Components",
    "fluid": "Fluids & Gases",
    "raw": "Raw Resources",
    "utility": "Utilities"
  },
  modifier_categories: {
    "no-category": "No Category",
    "speed": "Speed Enhancers",
    "productivity": "Productivity Boosters",
    "efficiency": "Efficiency Optimizers"
  },
  items: {
    "iron-plate": { "name": "Iron Plate", "category": "intermediate" },
    "iron-gear-wheel": { "name": "Iron Gear Wheel", "category": "intermediate" },
    "electronic-circuit": { "name": "Electronic Circuit", "category": "intermediate" },
    "advanced-circuit": { "name": "Advanced Circuit", "category": "intermediate" },
    "processing-unit": { "name": "Processing Unit", "category": "intermediate" },
    "copper-cable": { "name": "Copper Cable", "category": "intermediate" },
    "copper-plate": { "name": "Copper Plate", "category": "intermediate" },
    "steel-plate": { "name": "Steel Plate", "category": "intermediate" },
    "plastic-bar": { "name": "Plastic Bar", "category": "intermediate" },
    "battery": { "name": "Battery", "category": "intermediate" },
    "sulfur": { "name": "Sulfur", "category": "intermediate" },
    "stone-brick": { "name": "Stone Brick", "category": "intermediate" },
    "engine-unit": { "name": "Engine Unit", "category": "intermediate" },
    "electric-engine-unit": { "name": "Electric Engine Unit", "category": "intermediate" },
    "flying-robot-frame": { "name": "Flying Robot Frame", "category": "intermediate" },
    "low-density-structure": { "name": "Low Density Structure", "category": "intermediate" },
    "utility-science-pack": { "name": "Utility Science Pack", "category": "science" },
    "sulfuric-acid": { "name": "Sulfuric Acid", "category": "fluid" },
    "lubricant": { "name": "Lubricant", "category": "fluid" },
    "petroleum-gas": { "name": "Petroleum Gas", "category": "fluid" },
    "heavy-oil": { "name": "Heavy Oil", "category": "fluid" },
    "water": { "name": "Water", "category": "fluid" },
    "coal": { "name": "Coal", "category": "raw" },
    "iron-ore": { "name": "Iron Ore", "category": "raw" },
    "copper-ore": { "name": "Copper Ore", "category": "raw" },
    "stone": { "name": "Stone", "category": "raw" }
  },
  
  machines: {
    "assembling-machine-1": {
      "name": "Assembling Machine 1",
      "crafting_speed": 0.5,
      "slots": 0,
      "energy": 75,
      "category": "assembling-machine"
    },
    "assembling-machine-2": {
      "name": "Assembling Machine 2",
      "crafting_speed": 0.75,
      "slots": 2,
      "energy": 150,
      "category": "assembling-machine"
    },
    "assembling-machine-3": {
      "name": "Assembling Machine 3",
      "crafting_speed": 1.25,
      "slots": 4,
      "energy": 375,
      "category": "assembling-machine"
    },
    "stone-furnace": {
      "name": "Stone Furnace",
      "crafting_speed": 1.0,
      "slots": 0,
      "energy": 90,
      "category": "furnace"
    },
    "steel-furnace": {
      "name": "Steel Furnace",
      "crafting_speed": 2.0,
      "slots": 0,
      "energy": 90,
      "category": "furnace"
    },
    "electric-furnace": {
      "name": "Electric Furnace",
      "crafting_speed": 2.0,
      "slots": 2,
      "energy": 180,
      "category": "furnace"
    },
    "chemical-plant": {
      "name": "Chemical Plant",
      "crafting_speed": 1.0,
      "slots": 3,
      "energy": 210,
      "category": "chemical-plant"
    },
    "electric-mining-drill": {
      "name": "Electric Mining Drill",
      "crafting_speed": 0.5,
      "slots": 3,
      "energy": 90,
      "category": "miner"
    }
  },

  recipes: {
    "iron-plate": {
      "name": "Iron Plate",
      "crafting_time": 3.2,
      "ingredients": [
        { "itemId": "iron-ore", "amount": 1 }
      ],
      "products": [
        { "itemId": "iron-plate", "amount": 1 }
      ],
      "category": "furnace"
    },
    "copper-plate": {
      "name": "Copper Plate",
      "crafting_time": 3.2,
      "ingredients": [
        { "itemId": "copper-ore", "amount": 1 }
      ],
      "products": [
        { "itemId": "copper-plate", "amount": 1 }
      ],
      "category": "furnace"
    },
    "steel-plate": {
      "name": "Steel Plate",
      "crafting_time": 16.0,
      "ingredients": [
        { "itemId": "iron-plate", "amount": 5 }
      ],
      "products": [
        { "itemId": "steel-plate", "amount": 1 }
      ],
      "category": "furnace"
    },
    "stone-brick": {
      "name": "Stone Brick",
      "crafting_time": 3.2,
      "ingredients": [
        { "itemId": "stone", "amount": 2 }
      ],
      "products": [
        { "itemId": "stone-brick", "amount": 1 }
      ],
      "category": "furnace"
    },
    "iron-gear-wheel": {
      "name": "Iron Gear Wheel",
      "crafting_time": 0.5,
      "ingredients": [
        { "itemId": "iron-plate", "amount": 2 }
      ],
      "products": [
        { "itemId": "iron-gear-wheel", "amount": 1 }
      ],
      "category": "assembling-machine"
    },
    "copper-cable": {
      "name": "Copper Cable",
      "crafting_time": 0.5,
      "ingredients": [
        { "itemId": "copper-plate", "amount": 1 }
      ],
      "products": [
        { "itemId": "copper-cable", "amount": 2 }
      ],
      "category": "assembling-machine"
    },
    "electronic-circuit": {
      "name": "Electronic Circuit",
      "crafting_time": 0.5,
      "ingredients": [
        { "itemId": "iron-plate", "amount": 1 },
        { "itemId": "copper-cable", "amount": 3 }
      ],
      "products": [
        { "itemId": "electronic-circuit", "amount": 1 }
      ],
      "category": "assembling-machine"
    },
    "advanced-circuit": {
      "name": "Advanced Circuit",
      "crafting_time": 6.0,
      "ingredients": [
        { "itemId": "electronic-circuit", "amount": 2 },
        { "itemId": "copper-cable", "amount": 4 },
        { "itemId": "plastic-bar", "amount": 2 }
      ],
      "products": [
        { "itemId": "advanced-circuit", "amount": 1 }
      ],
      "category": "assembling-machine"
    },
    "processing-unit": {
      "name": "Processing Unit",
      "crafting_time": 10.0,
      "ingredients": [
        { "itemId": "electronic-circuit", "amount": 20 },
        { "itemId": "advanced-circuit", "amount": 2 },
        { "itemId": "sulfuric-acid", "amount": 5 }
      ],
      "products": [
        { "itemId": "processing-unit", "amount": 1 }
      ],
      "category": "assembling-machine"
    },
    "battery": {
      "name": "Battery",
      "crafting_time": 4.0,
      "ingredients": [
        { "itemId": "iron-plate", "amount": 1 },
        { "itemId": "copper-plate", "amount": 1 },
        { "itemId": "sulfuric-acid", "amount": 20 }
      ],
      "products": [
        { "itemId": "battery", "amount": 1 }
      ],
      "category": "chemical-plant"
    },
    "plastic-bar": {
      "name": "Plastic Bar",
      "crafting_time": 1.0,
      "ingredients": [
        { "itemId": "coal", "amount": 1 },
        { "itemId": "petroleum-gas", "amount": 20 }
      ],
      "products": [
        { "itemId": "plastic-bar", "amount": 2 }
      ],
      "category": "chemical-plant"
    },
    "sulfur": {
      "name": "Sulfur",
      "crafting_time": 1.0,
      "ingredients": [
        { "itemId": "water", "amount": 30 },
        { "itemId": "petroleum-gas", "amount": 30 }
      ],
      "products": [
        { "itemId": "sulfur", "amount": 2 }
      ],
      "category": "chemical-plant"
    },
    "sulfuric-acid": {
      "name": "Sulfuric Acid",
      "crafting_time": 1.0,
      "ingredients": [
        { "itemId": "sulfur", "amount": 5 },
        { "itemId": "iron-plate", "amount": 1 },
        { "itemId": "water", "amount": 100 }
      ],
      "products": [
        { "itemId": "sulfuric-acid", "amount": 50 }
      ],
      "category": "chemical-plant"
    },
    "engine-unit": {
      "name": "Engine Unit",
      "crafting_time": 10.0,
      "ingredients": [
        { "itemId": "steel-plate", "amount": 1 },
        { "itemId": "iron-gear-wheel", "amount": 1 },
        { "itemId": "iron-pipe", "amount": 2 }
      ],
      "products": [
        { "itemId": "engine-unit", "amount": 1 }
      ],
      "category": "assembling-machine"
    },
    "electric-engine-unit": {
      "name": "Electric Engine Unit",
      "crafting_time": 10.0,
      "ingredients": [
        { "itemId": "engine-unit", "amount": 1 },
        { "itemId": "electronic-circuit", "amount": 2 },
        { "itemId": "lubricant", "amount": 15 }
      ],
      "products": [
        { "itemId": "electric-engine-unit", "amount": 1 }
      ],
      "category": "assembling-machine"
    },
    "flying-robot-frame": {
      "name": "Flying Robot Frame",
      "crafting_time": 20.0,
      "ingredients": [
        { "itemId": "electric-engine-unit", "amount": 1 },
        { "itemId": "battery", "amount": 2 },
        { "itemId": "electronic-circuit", "amount": 3 },
        { "itemId": "steel-plate", "amount": 1 }
      ],
      "products": [
        { "itemId": "flying-robot-frame", "amount": 1 }
      ],
      "category": "assembling-machine"
    },
    "low-density-structure": {
      "name": "Low Density Structure",
      "crafting_time": 20.0,
      "ingredients": [
        { "itemId": "steel-plate", "amount": 2 },
        { "itemId": "copper-plate", "amount": 20 },
        { "itemId": "plastic-bar", "amount": 5 }
      ],
      "products": [
        { "itemId": "low-density-structure", "amount": 1 }
      ],
      "category": "assembling-machine"
    },
    "utility-science-pack": {
      "name": "Utility Science Pack",
      "crafting_time": 21.0,
      "ingredients": [
        { "itemId": "processing-unit", "amount": 1 },
        { "itemId": "flying-robot-frame", "amount": 1 },
        { "itemId": "low-density-structure", "amount": 3 }
      ],
      "products": [
        { "itemId": "utility-science-pack", "amount": 3 }
      ],
      "category": "assembling-machine"
    }
  },

  modifiers: {
    "speed-module-3": {
      "name": "Speed module 3",
      "speed_bonus": 0.50,
      "productivity_bonus": 0.0,
      "energy_bonus": 0.70,
      "category": "speed"
    },
    "productivity-module-3": {
      "name": "Productivity module 3",
      "speed_bonus": -0.15,
      "productivity_bonus": 0.10,
      "energy_bonus": 0.80,
      "category": "productivity"
    },
    "efficiency-module-3": {
      "name": "Efficiency module 3",
      "speed_bonus": 0.0,
      "productivity_bonus": 0.0,
      "energy_bonus": -0.50,
      "category": "efficiency"
    }
  }
};
