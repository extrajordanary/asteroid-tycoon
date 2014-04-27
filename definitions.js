// Definitions of base-level robots - spawn using robotLevels, not robots
var robots = {
    'squirrelBot': {
        'description': 'Basic scout robot',
        'hardness': 0.13,
        'baseEnergy': 2000,
        'storage': 0,
        'wobble': 0.9,
        'harvestEfficiency': 0,
        'cost': 150
    },
    'bearBot': {
        'description': 'All-around robot',
        'hardness': 0.25,
        'baseEnergy': 1200,
        'storage': 100,
        'wobble': 0.7,
        'harvestEfficiency': 0.6,
        'cost': 300
    },
    'antBot': {
        'description': 'Harvester robot',
        'hardness': 0.35,
        'baseEnergy': 1000,
        'storage': 200,
        'wobble': 0.4,
        'harvestEfficiency': 0.8,
        'cost': 550
    },
    'goatBot': {
        'description': 'Smasher robot',
        'hardness': 0.55,
        'baseEnergy': 1000,
        'storage': 0,
        'wobble': 0.5,
        'harvestEfficiency': 0,
        'cost': 1050
    },
    'vultureBot': {
        'description': 'Scavenger robot that picks up dead robot parts',
        'hardness': 0,
        'baseEnergy': 1500,
        'storage': 200,
        'wobble': 0.1,
        'harvestEfficiency': 0.7,
        'cost': 650
    }
};

var WobbleConstant = 0.5;

var upgradeCosts = {
    'squirrelBot': [0, 1500, 3000],
    'bearBot': [0, 3000, 6000],
    'antBot': [0, 5500, 11000],
    'goatBot': [0, 10500, 21000],
    'vultureBot': [0, 6500, 13000]
};

var robotLevels = {
    'squirrelBot': [
        robots['squirrelBot'],
        _.extend(robots['squirrelBot'], {
            baseEnergy: 2500,
            wobble: 0.75
        }),
        _.extend(robots['squirrelBot'], {
            baseEnergy: 3000,
            wobble: 0.6
        }),
    ],
    'bearBot': [
        robots['bearBot'],
        _.extend(robots['bearBot'], {
            baseEnergy: 1400,
            storage: 125,
            wobble: 0.65,
            harvestEfficiency: 0.7,
            hardness: 0.45
        }),
        _.extend(robots['bearBot'], {
            baseEnergy: 1600,
            storage: 150,
            wobble: 0.6,
            harvestEfficiency: 0.8,
            hardness: 0.65
        }),
    ],
    'antBot': [
        robots['antBot'],
        _.extend(robots['antBot'], {
            baseEnergy: 1250,
            storage: 300,
            harvestEfficiency: 0.9,
            hardness: 0.65
        }),
        _.extend(robots['antBot'], {
            baseEnergy: 1500,
            storage: 400,
            harvestEfficiency: 1.0,
            hardness: 0.85
        }),
    ],
    'goatBot': [
        robots['goatBot'],
        _.extend(robots['goatBot'], {
            baseEnergy: 1100,
            hardness: 0.75
        }),
        _.extend(robots['goatBot'], {
            baseEnergy: 1200,
            hardness: 0.95

        }),
    ],
    'vultureBot': [
        robots['vultureBot'],
        _.extend(robots['vultureBot'], {
            baseEnergy: 1750,
            storage: 250,
            harvestEfficiency: 0.85
        }),
        _.extend(robots['vultureBot'], {
            baseEnergy: 2000,
            storage: 300,
            harvestEfficiency: 1.0
        }),
    ]
};

var resources = {
    'backfill': {
        'hardness': 0,
        'harvestable': false,
        'value': 0
    },
    'dirt': {
        'hardness': 0.1,
        'harvestable': false,
        'value': 0
    },
    'rock': {
        'hardness': 0.3,
        'harvestable': false,
        'value': 0
    },
    'iron': {
        'hardness': 0.35,
        'harvestable': true,
        'value': 10
    },
    'unexplored': {
        'hardness': 0.1,
        'harvestable': false,
        'value': 0
    }
};
