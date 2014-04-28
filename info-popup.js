var infoPopupActive = false;

function popupClickOnStage(e) {
    if (!infoPopupActive) {
        var x = e.stageX,
            y = e.stageY;

        if (y >= surface_height) {
            var popup = infoPopup(tileInfo(tileTypeAt(x, y)));
            popup.offset({left : x, top : y + 200});
            popup.appendTo($('#game'));

            infoPopupActive = true;
        }

        return false;
    } else {
        hidePopups();
    }
}

// Hides all the current info popups.
function hidePopups() {
    if (infoPopupActive) {
        $('.info-popup').remove();
        infoPopupActive = false;
    }
}

// Create an info popup element using the given tile info object. The
// tile description object should look like this:
function infoPopup(tile) {
    return $(_.template($("#info-popup-template").html())(tile));
}

// Return the tile type at the given physical coordinates on the
// canvas, in pixels.
function tileTypeAt(canvasX, canvasY) {
    var grid         = playerState.getAsteroid().getGrid(),
        canvasWidth  = $("#mainCanvas").width(),
        canvasHeight = $("#mainCanvas").height(),
        stepX        = canvasWidth / game_width,
        stepY        = (canvasHeight - surface_height) / game_height,
        x            = Math.floor(canvasX / stepX),
        y            = Math.floor((canvasY - surface_height) / stepY),
        tile         = y >= 0 ? grid[x][y] : null;

    return tile && tile.explored ? tile.type : null;
}

// Returns a tile info object given the type of a tile.
function tileInfo(type) {
    type = type || 'unexplored';

    var stats = resources[type];
    if (type == 'artifact') type = 'alien artifact';

    switch (type) {
    case 'unexplored':
    case 'alien artifact':
        return {
            name     : type,
            image    : stats.imagePath,
            text     : stats.text,
            hardness : "??",
            value    : "??"
        }
    default:
        return {
            name     : type,
            image    : stats.imagePath,
            text     : stats.text,
            hardness : stats.hardness,
            value    : "$" + stats.value
        };
    }
}