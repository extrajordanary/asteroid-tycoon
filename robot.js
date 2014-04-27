var Robot = function(baseAttrs, startX, destX, destY, asteroid) {
    var _this = this;
    var grid = asteroid.getGrid();

    this.energy = baseAttrs.baseEnergy * energy_scale;
    this.baseEnergy = baseAttrs.baseEnergy * energy_scale;
    this.storage = baseAttrs.storage;
    this.resourceAmountByType = {}; // the stuff you pick up
    this.position = {'x': startX, 'y': 0};
    this.reachedDestination = false;

    this.destX = destX;
    this.destY = destY;

    this.init = function () {
        var spriteSheet = new createjs.SpriteSheet({
            images: [baseAttrs.spriteSheet, "pics/explosion_2x.png", "pics/rubble_2x.png"],
            frames: {width:40, height:40},
            animations: {
                run: [0, 1, 'run', baseAttrs.spriteSpeed],
                explode: [2, 8, 'rubble', 0.5],
                rubble: [9, 9, 'rubble', 1]
            }
        });
        this.animation = new createjs.Sprite(spriteSheet, "run");
        this.animation.gotoAndPlay("run");
        stage.addChild(this.animation);

        var healthbarSpriteSheet = new createjs.SpriteSheet({
            images: ["pics/healthbar_2x.png"],
            frames: {width:40, height:4}
        });
        this.healthbar = new createjs.Sprite(healthbarSpriteSheet);
        this.healthbar.gotoAndStop(19);
        stage.addChild(this.healthbar);

        this.render();
    };

    this.getGrid = function() {
        return grid;
    };

    this.giveUpDigging =  function(perseverance){
        if (arguments.length === 0) {
            perseverence = 0.95;
        }
        if (Math.random() > perseverence){
            return true;
        }
        else{
            return false;
        }
    };

    // This is the basic move function that is called
    // by the ticker to cause each bot to move appropriately
    // or accept that it's dead.
    this.handleMove = function(destX, destY) {
        //top level robot move function
        //move the robot in the general direction of destination, allowing for some veering off course

        //It can't move if it's dead.
        if (this.energy <= 0) {
            if (!this.dead) {
                handleDeath();
            }
            return;
        }
        this.makeMove(destX, destY);
    };

    // Actually triggers the move to happen.
    this.makeMove = function(destX, destY) {
        // If they have reached their destination they should do
        // default behavior.
        // If they are digging, keep digging.
        // If they haven't reached their destination and aren't digging,
        // try to go to the given destination.
        if (this.reachedDestination ||
            (this.position.x === destX && this.position.y === destY)) {
            this.makeDefaultMove();
        } else if (this.currentlyDigging &&
                    !this.giveUpDigging()){ //if digging continue to dig unless the robot decides to give up
            this.moveTo(this.currentlyDigging.x, this.currentlyDigging.y);
        } else {
            this.moveTowardDestination(destX, destY);
        }
    };

    // Once a robot has reached its default destination,
    // this gets called to make the default move for the bot.
    this.makeDefaultMove = function() {
        this.reachedDestination = this.reachedDestination || true;
        baseAttrs.klass.defaultBehavior(this);
    };

    // While it's still trying to move to a destination,
    // move toward that destination (with a little wobble
    // and hopelessness).
    this.moveTowardDestination = function(destX, destY) {
        //checks if will be able to reach destination.  If hopeless, just move randomly.
        if (grid[destX] && grid[destX][destY]) {
            var canMoveToward = canPassTile(grid[destX][destY]);
            if(canMoveToward && !(this.position.x === destX && this.position.y === destY)) {
                // Make random moves based on a robot's wobble
                var randomVal = Math.random();
                if(randomVal > (baseAttrs.wobble * WobbleConstant)) {
                    this.goToward(destX, destY);
                } else {
                    //changed wobble so robots will not move in the complete opposite direction
                    this.makeSemiRandomMove(destX,destY);
                }
            } else {
                // destination either already reached or unreachable
                this.reachedDestination = true;
            }
        } else {
            this.makeRandomMove();
        }
    };

    this.setDestination =function(destinX, destinY){
        this.destX=destinX;
        this.destY=destinY;
    };

    this.getHeading = function (destX, destY){
        //returns the direction and coordinates of the start of the path to our intended destination.
        var g = grid.map(function (row) {
            return row.map(function (tile) {
                return canPassTile(tile) ? timeToPassTile(tile) : 0;
            });
        });

        var graph = new Graph(g);
        var start = graph.nodes[this.position.x][this.position.y];
        var end = graph.nodes[destX][destY];
        var result = astar.search(graph.nodes, start, end);
        if (result && result.length > 0) {
            var direction ={'x': result[0].pos.x -this.position.x, 'y': result[0].pos.y - this.position.y};
            var coordinates = {'x': result[0].pos.x, 'y': result[0].pos.y};
            var pathExists = true;
        } else {
            var direction = {};
            var coordinates = {};
            var pathExists = false;
        }

        return {
            'direction': direction,
            'coordinates': coordinates,
            'pathExists': pathExists
        };
    };

    this.goToward = function (destX, destY) {
        //finds the optimal path to the destination if it exists
        var heading = this.getHeading(destX,destY);

        if (heading.pathExists) {
            this.moveTo(heading.coordinates.x, heading.coordinates.y);
        } else {
            // can't reach destination - let's just move randomly
            this.makeRandomMove();
        }
    };

    this.makeSemiRandomMove =function(destX, destY){
        //allows robots to veer off of heading, but not get totally lost by heading backwards
        var heading = this.getHeading(destX,destY);
        var reverseHeading = {'x': - heading.coordinates.x, 'y': - heading.coordinates.y};
        dirs = this.getViableDirections();
        dirs=dirs.filter(function(dir) {
            var dest = {'x': _this.position.x + dir[0], 'y': _this.position.y + dir[1]};
                if ((dir[0] === reverseHeading.x) && (dir[1] === reverseHeading.y)){
                    return false;
                }
                else {
                    return true;
                }

        });
        var randomDir = Math.floor(Math.random() * dirs.length);
        chosenDir = dirs[randomDir];
        _this.moveTo(_this.position.x + chosenDir[0], _this.position.y + chosenDir[1]);
        return true;

    };

    this.getViableDirections = function(){
        var dirs = [[-1,0], [1,0], [0,-1], [0,1]].filter(function(dir) {
            var dest = {'x': _this.position.x + dir[0], 'y': _this.position.y + dir[1]};
            return grid[dest.x] && grid[dest.x][dest.y] && canPassTile(grid[dest.x][dest.y]);
        });
        return dirs;
    };

    this.makeRandomMove = function() {
        //moves the robot in a random direction
        dirs = this.getViableDirections();
        if(dirs.length === 0) {
            console.log('trying to makeRandomMove but no place to go!')
            return false;
        } //In case it's trapped somehow

        var randomDir = Math.floor(Math.random() * dirs.length);
        chosenDir = dirs[randomDir];
        this.moveInDirection(chosenDir[0], chosenDir[1]);
        return chosenDir;
    };

    this.moveInDirection = function(xDelta, yDelta) {
        dest = {'x': _this.position.x + xDelta, 'y': _this.position.y + yDelta};
        this.moveTo(dest.x, dest.y);
    };

    // in unable to move in chosen direction, move randomly
    // This is currently only used by SquirrelBot's default
    // behavior.
    this.moveInDirectionOrRandom = function(xDelta, yDelta) {
        dest = {'x': _this.position.x + xDelta, 'y': _this.position.y + yDelta};
        if (grid[dest.x] && grid[dest.x][dest.y] && canPassTile(grid[dest.x][dest.y])) {
            this.moveTo(dest.x, dest.y);
        } else {
            this.makeRandomMove();
        }
    };

    //once the tile to move to is determined, this function makes the final move step
    // This is the function that actually moves the robot.
    this.moveTo = function(newX, newY) {
        // Update the direction for the sprite
        updateDirection(newX, newY);

        var currentTile = grid[this.position.x][this.position.y];
        var newTile = grid[newX][newY];

        grid[this.position.x][this.position.y].setType('backfill');

        if (canPassTile(newTile)) {
            if (newTile.amount <= 0) {
                this.currentlyDigging = null;
                this.position.x = newX;
                this.position.y = newY;
                grid[this.position.x][this.position.y].setType('backfill');
            } else {
                this.hit(newTile);
                this.currentlyDigging = {x: newX, y: newY};

            }
        }

        if (baseAttrs.canSalvage) {
            deadBots.forEach(function (bot, i) {
                if (bot.position.x == newX && bot.position.y == newY) {
                    bot.getSalvaged();
                    deadBots.splice(i, 1); // remove from array
                }
            });
        }

        this.energy -= 1;
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

    this.getSalvaged = function () {
        playerState.changeResource('money', this.salvageValue);
        this.animation.visible = false;
    }

    // This gets called as part of the hit function.
    // It is used to update the tile's amount given
    // the drill's strength and the tile's hardness.
    // as well as the bots resources.
    var updateTileAndResources = function(tile) {
        var resource = resources[tile.getType()];
        var hardness = baseAttrs.hardness;
        if (baseAttrs.affinity[tile.getType()]) {
            hardness *= baseAttrs.affinity[tile.getType()];
        }
        var proportionMined = hardness - resource.hardness;
        var amountMined = tile.baseAmount * proportionMined;
        if (tile.harvestable && _this.storage > 0) {
            addResources(amountMined, tile.getType());
        }
        playerState.changeResource(tile.getType(), amountMined);
        tile.amount -= amountMined; //Reduce the amount left on the tile

        playerState.changeResource('money', 1);
    };

    // This gets called from the updateTileAndResources
    // it is used to add resources to the bot if there are
    // resources to be added.
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
        var resourceHardness = resources[tile.getType()].hardness;
        var drillHardness = baseAttrs.hardness;
        return (drillHardness > resourceHardness);
    };

    var timeToPassTile = function(tile) {
        var resource = resources[tile.getType()];
        return (baseAttrs.hardness - resource.hardness) * tile.amount;
    };

    // This is called when a robot's energy reaches
    // 0 from the handleMove function.
    var handleDeath = function() {
        _this.animation.gotoAndPlay('explode');
        _this.healthbar.visible = false;
        _this.salvageValue = baseAttrs.cost * salvageValueMultiplier;
        _this.dead = true;
        deadBots.push(_this);
    };

    var updateDirection = function(newX, newY) {
        if (newY > _this.position.y) {
            _this.direction = 'down';
        } else if (newY < _this.position.y) {
            _this.direction = 'up';
        } else if (newX > _this.position.x) {
            _this.direction = 'right';
        } else if (newX < _this.position.x) {
            _this.direction = 'left';
        }
    };

    this.init();
    return this;
};
