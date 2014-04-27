var Robot = function(baseAttrs, startX) {
    var _this = this;

    this.energy = baseAttrs.baseEnergy;
    this.storage = baseAttrs.storage;
    this.resourceAmountByType = {}; // the stuff you pick up
    this.position = {'x': startX, 'y': 0};

    this.init = function () {
        this.render();
    };

    // as a placeholder, robots are blue spheres
    // TODO make robots not be blue spheres
    this.shape = new createjs.Shape();
    this.shape.graphics.beginFill("blue")
                       .drawCircle(0,0,8);
    stage.addChild(this.shape);
    this.render();

    //This is incompatible with the tick function
    this.moveToward = function(destX, destY) {
        var canHitTile = canPassTile(grid[destX][destY]);
        while(canHitTile && !(this.position.x === destX && this.position.y === destY)) {
            var randomVal = Math.random();
            if(randomVal > baseAttrs.wobble) {
                canHitTile = this.goToward(destX, destY);
            } else {
                canHitTile = makeRandomMove();
            }
        }
    };

    // should return [xDelta, yDelta] (one of [-1,0], [1,0], [0,-1], [0,1])
    this.goToward = function (destX, destY) {
        // let's do Uniform Cost Search?

        function popMinNode(frontier) {
            var bestCost = 9999;
            var bestNode = null;
            var bestIndex = null;
            frontier.forEach(function (node, idx) {
                if (node.pathCost < bestCost) {
                    bestNode = node;
                    bestCost = node.pathCost;
                    bestIndex = idx;
                }
            });
            frontier.splice(bestIndex, 1);
            return bestNode;
        }

        var startNode = {
            'x': this.position.x,
            'y': this.position.y,
            'pathCost': 0,
            'path': []
        };
        var frontier = [startNode];
        var explored = [];

        while (true) {
            if (frontier.length === 0) {
                return false; // failure :-(
            }
            var node = popMinNode(frontier);
            if (node.x == destX && node.y == destY) {
                // path to destination found
                var dirFound = node.path[0];
                this.move(dirFound[0], dirFound[1]);
                return true;
            }
            explored.push(node.x + ',' + node.y);
            [[-1,0], [1,0], [0,-1], [0,1]].forEach(function (dir) {
                var dest = {'x': node.x + dir[0], 'y': node.y + dir[1]};

                if (!grid[dest.x] || !grid[dest.x][dest.y] ||
                        !canPassTile(grid[dest.x][dest.y])) {
                    // dest is out of bounds or impassable
                    return;
                }

                var tile = grid[dest.x][dest.y];

                var child = {
                    'x': dest.x,
                    'y': dest.y,
                    'pathCost': node.pathCost + timeToPassTile(tile),
                    'path': node.path.concat([dir])
                };

                if (explored.indexOf(child.x + ',' + child.y) == -1 &&
                        !frontier.some(function (n) {n.x == child.x && n.y == child.y})) {
                    // if child state is not in explored or frontier,
                    // insert into frontier
                    frontier.push(child);
                } else if (frontier.some(function (n) {n.x == child.x && n.y == child.y})) {
                    // if child state is in frontier *with a higher path-cost*,
                    // replace that frontier node with child
                    frontier = frontier.map(function (node) {
                        if (node.x === child.x && node.y === child.y &&
                                node.pathCost > child.pathCost) {
                            return child;
                        } else {
                            return node;
                        }
                    });
                }
            });
        });
        var graph = new Graph(g);
        var start = graph.nodes[this.position.x][this.position.y];
        var end = graph.nodes[destX][destY];
        var result = astar.search(graph.nodes, start, end);
        if (result) {
            this.moveTo(result[0].pos.x, result[0].pos.y)
        }
    };

    this.moveTo = function(newX, newY) {
        var currentTile = grid[this.position.x][this.position.y];
        var newTile = grid[newX][newY];

        grid[this.position.x][this.position.y].setType('backfill');

        if (canPassTile(newTile)) {
            if (newTile.amount <= 0) {
                this.position.x = newX;
                this.position.y = newY;
            } else {
                this.hit(newTile);
            }
        }

        this.render();
    };

    this.hit = function(tile) {
        // Amount harvested based per frame on harvest efficiency
        // amount resource broken down per frame based on drill hardness vs resource hardness
        if (canPassTile(tile)) {
            updateTileAndResources(tile);
        }
        this.canMove = (tile.amount <= 0); //You can move if you're not blocked by a tile.
        //Can you move if you can't pick up stuff on a tile.
    };

    var makeRandomMove = function() {
        var dirs = [[-1,0], [1,0], [0,-1], [0,1]].filter(function(dir) {
            var dest = {'x': _this.position.x + dir[0], 'y': _this.position.y + dir[1]};
            return grid[dest.x] && grid[dest.x][dest.y] && canPassTile(grid[dest.x][dest.y]);
        });
        if(dirs.length === 0) { return false; } //In case it's trapped somehow
        var randomDir = Math.floor(Math.random() * dirs.length);
        chosenDir = dirs[randomDir];
        _this.move(chosenDir[0], chosenDir[1]);
        return true;
    };

    var updateTileAndResources = function(tile) {
        _this.energy -= 1;

        var resource = resources[tile.getType()];
        var proportionMined = baseAttrs.hardness - resource.hardness;
        var amountMined = tile.baseAmount * proportionMined;
        if (tile.harvestable && _this.storage > 0) {
            addResources(amountMined, tile.getType());
        }
        console.log("mined: " + amountMined + " " + tile.getType());
        tile.amount -= amountMined; //Reduce the amount left on the tile
    };

    var addResources = function(amountMined, resourceType) {
        var amountHarvested = Math.min(amountMined, _this.storage);
        _this.storage -= amountHarvested;
        var resourceAmount = _this.resourceAmountByType[resourceType] || 0;
        //Store the resources we've collected by the name to amount.
        //i.e { name: amount }
        _this.resourceAmountByType[resourceType] = resourceAmount + amountHarvested;
    };

    //If the tile is passable in multiple turns (including whether it can get
    // everything on the tile).
    var canPassTile = function(tile) {
        var resource = resources[tile.getType()];
        var drillHardness = baseAttrs.hardness;
        return (drillHardness > resource.hardness);
    };

    var timeToPassTile = function(tile) {
        var resource = resources[tile.getType()];
        return (baseAttrs.hardness - resource.hardness) * tile.amount;
    };

    return this;
};

Robot.prototype.render = function() {
    this.shape.x = grid_size*(this.position.x + 0.5);
    this.shape.y = grid_size*(this.position.y + 0.5) + surface_height;

    var p = this.position;
    [p.x-1, p.x, p.x+1].forEach(function (x) {
        [p.y-1, p.y, p.y+1].forEach(function (y) {
            if (grid[x] && grid[x][y]) {
                grid[x][y].setExplored();
            }
        });
    });
};

var upgradeBot = function(type, level) {
    var cost = upgradeCosts[type][level];

    if (playerState.getResource('money') < cost) {
        return;
    }

    playerState.changeResource('money', -cost);
    playerState.setRobotLevel(type, level);
};

var spawnBot = function(type, startX) {
    var robotAttrs = robotLevels[type][state.getRobotLevel(type)];
    var bot = new Robot(robotAttrs, startX);
    activeBots.push(bot);
    return bot;
};

bot = spawnBot('squirrelBot', 0);
