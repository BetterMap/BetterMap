/**
 * @param {Number} id id of the line that should be changed 
 * @param {String} line text that the line should be changed to
 */
export function changeScoreboardLine(id, line) {
    //                                  getScoreboard
    let scoreboard = World.getWorld().func_96441_U();
    //                         .getTeams
    for (let team of scoreboard.func_96525_g()) {
        //             .getTeamName
        let name = team.func_96669_c();
        if (name.includes('team') && name.includes(id)) {
            let prefix = line.substring(0, 15);
            let suffix = line.substring(15, 30);
            team.func_96666_b(prefix); // Team.setPrefix()
            team.func_96662_c(suffix); // Team.setSuffix()
        }
    }
}

export function renderLore(x, y, lore) {
    let maxWidth = 0

    lore.forEach((line) => {
        let width = Renderer.getStringWidth(line);

        if (width > maxWidth) maxWidth = width
    })

    let l1 = x + 12;
    let i2 = y - 12;
    let k = 8;

    if (lore.length > 1) {
        k += 2 + (lore.length - 1) * 10;
    }

    if (l1 + maxWidth > Renderer.screen.getWidth() - 6) {
        l1 -= 28 + maxWidth;
    }

    if (i2 + k + 6 > Renderer.screen.getHeight() - 6) {
        i2 = Renderer.screen.getHeight() - k - 6;
    }

    let borderColor = Renderer.color(35, 1, 85);
    let backgroundColor = -267386864

    function drawRectStupid(color, x1, y1, x2, y2) {
        Renderer.translate(0, 0, 1000)
        Renderer.drawRect(color, x1, y1, x2 - x1, y2 - y1)
    }

    drawRectStupid(backgroundColor, l1 - 3, i2 - 4, l1 + maxWidth + 3, i2 - 3)
    drawRectStupid(backgroundColor, l1 - 3, i2 + k + 3, l1 + maxWidth + 3, i2 + k + 4)
    drawRectStupid(backgroundColor, l1 - 3, i2 - 3, l1 + maxWidth + 3, i2 + k + 3)
    drawRectStupid(backgroundColor, l1 - 4, i2 - 3, l1 - 3, i2 + k + 3)
    drawRectStupid(backgroundColor, l1 + maxWidth + 3, i2 - 3, l1 + maxWidth + 4, i2 + k + 3)

    drawRectStupid(borderColor, l1 - 3, i2 - 3 + 1, l1 - 3 + 1, i2 + k + 3 - 1)
    drawRectStupid(borderColor, l1 + maxWidth + 2, i2 - 3 + 1, l1 + maxWidth + 3, i2 + k + 3 - 1)
    drawRectStupid(borderColor, l1 - 3, i2 - 3, l1 + maxWidth + 3, i2 - 3 + 1)
    drawRectStupid(borderColor, l1 - 3, i2 + k + 2, l1 + maxWidth + 3, i2 + k + 3)

    lore.forEach((line, i) => {
        Renderer.translate(0, 0, 1000)
        Renderer.drawStringWithShadow(line, l1, i2)

        if (i === 0) i2 += 2
        i2 += 10
    })
}

/**
 * Maps a set of real coords (x and z) to 0-5.
 * @param {Number} worldX
 * @param {Number} worldY
 * @returns 
 */
export const getComponentFromPos = (worldX, worldZ) => {
    return [
        Math.floor((worldX + 200.5) / 32),
        Math.floor((worldZ + 200.5) / 32)
    ]
}

/**
 * Maps component to real coord
 * @param {Number} componentX - 0-5
 * @param {Number} componentZ - 0-5
 * @returns 
 */
export const convertToRealCoords = (componentX, componentZ) => {
    return [
        -185 + 32 * x,
        -185 + 32 * z,
    ]
}


/**
 * Renders text perfectly centered on the screen both horizontally and vertically. Supports color codes
 * or optionally, pass in a Java Color to force the text to render that color.
 * @param {String|String[]} string - The text to be rendered. If an array of strings is passed, each item will be rendered on a new line. Overrides splitWords.
 * @param {Number} x - Left/Right on the screen.
 * @param {Number} y - Up/Down on the screen.
 * @param {Number} scale - Scale the text to make it larger/smaller.
 * @param {Boolean} splitWords - Split the string at each space and render on a new line.
 * @param {Color} forceColor - Force the text to be a certain Java Color.
 * @returns 
 */
export const renderCenteredString = (string, x, y, scale, splitWords = false, javaColor = null) => {
    if (!string || !x || !y) return
    Renderer.retainTransforms(true)
    string = Array.isArray(string) ? string : splitWords ? string.split(" ") : [string]
    let vertOffset = string.length * 7 + (2 * (string.length - 1))
    let [r, g, b, a] = []
    if (javaColor) {
        r = javaColor.getRed()
        g = javaColor.getGreen()
        b = javaColor.getBlue()
        a = javaColor.getAlpha()
    }
    Renderer.translate(x, y)
    Renderer.scale(scale, scale)
    Renderer.translate(0, -vertOffset / 2)
    // Render each line
    for (let i = 0; i < string.length; i++) {
        if (javaColor) Renderer.colorize(r, g, b, a)
        Renderer.drawStringWithShadow(string[i], -Renderer.getStringWidth(string[i]) / 2, (i * 7 + (2 * i)))
    }
    Renderer.retainTransforms(false)
}

/**
 * A function to draw a bunch of lines with particles
 * 
 * Should be ran at 5fps step trigger for optimum results
 * @param {Array<[Number,Number,Number]>} locations in the form of an array of positions, where each pos is [x, y, z]
 * @param {String} particle The name of the particle to spawn
 */
export function drawLineMultipleParticles(locations, particle = "FLAME") {
    let lastLoc = undefined
    locations.forEach(loc => {
        if (!lastLoc) {
            lastLoc = loc
            return
        }

        drawLineParticles(lastLoc, loc, particle)
        lastLoc = loc
    })
}

/**
 * A function to draw a line with particles
 * 
 * Should be ran at 5fps step trigger for optimum results
 * @param {[Number,Number,Number]} loc1 The starting position
 * @param {[Number,Number,Number]} loc2 The ending position
 * @param {String} particle The name of the particle to spawn
 */
export function drawLineParticles(loc1, loc2, particle = "FLAME") {
    let distance = Math.hypot(...loc1.map((a, i) => a - loc2[i]))
    let maxPoints = Math.ceil(distance * 1)
    for (let i = 0; i < maxPoints; i++) {
        let actualI = i + Math.random()
        let a = actualI / maxPoints
        let loc = [loc1[0] * a + loc2[0] * (1 - a) - 0.5, loc1[1] * a + loc2[1] * (1 - a) + 0.1, loc1[2] * a + loc2[2] * (1 - a) - 0.5]

        let a2 = (actualI + 0.02) / maxPoints
        let loc3 = [loc1[0] * a2 + loc2[0] * (1 - a2) - 0.5, loc1[1] * a2 + loc2[1] * (1 - a2) + 0.1, loc1[2] * a2 + loc2[2] * (1 - a2) - 0.5]
        loc3 = loc3.map((a, i) => loc[i] - a)

        spawnParticleAtLocation(loc, loc3, particle)
    }
}

/**
 * A function to spawn a particle at a location
 * @param {[Number,Number,Number]} loc The position of the particle
 * @param {[Number,Number,Number]} velo The velocity of the particle
 * @param {String} particle The name of the particle to spawn
 */
export function spawnParticleAtLocation(loc, velo, particle) {
    let particleType = EnumParticleTypes.valueOf(particle);
    let idField = particleType.getClass().getDeclaredField('field_179372_R');
    idField.setAccessible(true);
    let id = idField.get(particleType);

    Client.getMinecraft().field_71438_f.func_174974_b(
        id,   // particleID
        true, // shouldIgnoreRange
        loc[0],  // x
        loc[1],  // y
        loc[2],      // z
        velo[0],      // speedX
        velo[1],      // speedY
        velo[2],      // speedZ
    );
}

export function firstLetterCapital(string) {
    return string.substr(0, 1).toUpperCase() + string.substr(1)
}

export function firstLetterWordCapital(string) {
    return string.split(" ").map(firstLetterCapital).join(" ")
}

/**
 * Capitalizes only the first letter of every word of a string.
 * @param {String} string - The string to title 
 * @returns {String}
 */
export const title = (string) => string.toLowerCase().split(" ").reduce((a, b) => [...a, `${b[0].toUpperCase()}${b.slice(1)}`], []).join(" ")

/**
 * Returns time since the given timestamp, showing only 1 unit
 * Same as Skyblock bank
 * @param {*} date 
 * @returns 
 */
export function timeSince(date) {
    if (typeof date !== 'object') {
        date = new Date(date);
    }

    var seconds = Math.floor((new Date() - date) / 1000);
    var intervalType;

    var interval = Math.floor(seconds / 31536000);
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        intervalType = 'd';
    } else {
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            intervalType = "h";
        } else {
            interval = Math.floor(seconds / 60);
            if (interval >= 1) {
                intervalType = "m";
            } else {
                interval = seconds;
                intervalType = "s";
            }
        }
    }

    return interval + '' + intervalType;
}
/**
 * Returns the time since a given timestamp
 * in h and mins if time > 30mins ago
 * in mins and secs if time < 30 mins ago
 */
export function timeSince2(date) {
    let time = Date.now() - date

    if (time > 30 * 60000) {
        return timeNumber2(time)
    }
    return timeNumber(time)
}
/**
 * Returns the time since a given timestamp
 * in m and s
 */
export function timeNumber(time) {
    let mins = Math.floor(time / 1000 / 60)
    let secs = Math.floor(time / 1000) % 60

    if (mins === 0) return secs + "s"
    return `${mins}m ${secs}s`
}
/**
 * Returns the time since a given timestamp
 * in h and m
 */
export function timeNumber2(time) {
    let hours = Math.floor(time / 1000 / 60 / 60)
    let mins = Math.floor(time / 1000 / 60) % 60

    if (hours === 0) return mins + "m"
    return `${hours}h ${mins}m`
}

/**
 * Adds commas to the number, ready for display
 * @param {Number} x 
 */
export function numberWithCommas(x) {
    if (x === undefined) { return "" }
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
/**
 * Adds a notation to the input'd number
 * shortScale: 1.25 Million
 * oneLetters: 1.25 M
 * commas: 1,250,000
 * 
 * joiner is the joiner between a number and the notation scale
 * eg a joiner of "|" would result in
 * 1.25| M
 * usefull if you want the notation to eg be gray while the number is white
 * in that case joiner: "&7"
 * 1.25&7 M
 * 
 * @param {"shortScale"|"oneLetters"|"commas"} type The notation type
 * @param {Number} value The number
 * @param {String=""} joiner A joiner between the number and the notation
 * @returns 
 */
export function addNotation(type, value, joiner = "") {
    let returnVal = value;
    let notList = [];
    if (type === "shortScale") {
        // Notation type
        // Do notation stuff here
        notList = [
            " Thousand",
            " Million",
            " Billion",
            " Trillion",
            " Quadrillion",
            " Quintillion"
        ];
    }

    if (type === "oneLetters") {
        notList = [" K", " M", " B", " T"];
    }

    let checkNum = 1000;

    if (type !== "none" && type !== "commas") {
        let notValue = notList[notList.length - 1];
        for (let u = notList.length; u >= 1; u--) {
            notValue = notList.shift();
            for (let o = 3; o >= 1; o--) {
                if (value >= checkNum) {
                    returnVal = value / (checkNum / 100);
                    returnVal = Math.floor(returnVal);
                    returnVal = (returnVal / Math.pow(10, o)) * 10;
                    returnVal = +returnVal.toFixed(o - 1) + joiner + notValue;
                }
                checkNum *= 10;
            }
        }
    } else {
        returnVal = this.numberWithCommas(value.toFixed(0));
    }

    return returnVal;
}

export const MESSAGE_PREFIX = "&6[BetterMap]&7 "
export const MESSAGE_PREFIX_SHORT = "&6[BM]&7 "


export function getSBID(item) {
    return item?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getString("id") || null
}
export function getSBUUID(item) {
    return item?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getString("uuid") || null
}
export function getSBEnchantfunction(item, enchant) {
    return item?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getCompoundTag("enchantments")?.getInteger(enchant) || null
}


export const dungeonOffsetX = 200;
export const dungeonOffsetY = 200;

export const isBetween = (number, min, max) => (number - min) * (number - max) <= 0

export function getPlayerName(player) {
    if (!player) return '???';
    return ChatLib.removeFormatting(player.name ?? '???').replace(/[♲Ⓑ]/g, "").replace('§z', '').trim()
}

/**
 * Checks if the chunk at the specified coordinate is loaded.
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} z 
 * @returns 
 */
export const chunkLoaded = (x, y, z) => {
    if (!World || !World.getWorld()) return false
    return World.getChunk(x, y, z).chunk.func_177410_o()
}

/**
 * Gets the highest non-air block y value (And gold, for a room edge case) at this position, or null if there is only air
 * @param {Number} x 
 * @param {Number} z 
 * @returns 
 */
export const getHighestBlock = (x, z) => {
    for (let y = 255; y > 0; y--) {
        let id = World.getBlockAt(x, y, z)?.type?.getID()
        // Ignore gold blocks too because of Gold room with a random ass gold block on the roof sometimes.
        if (id == 0 || id == 41) continue
        return y
    }
    return null
}

const blacklisted = [
    101,    // Iron Bars
    54,     // Chest
]
export const hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) // From https://stackoverflow.com/a/15710692/15767968

/**
 * Gets the core hash at a certain x, z position
 * @param {Number} x 
 * @param {Number} z 
 * @returns 
 */
export const getCore = (x, z) => {
    let blockIds = ""
    for (let y = 140; y >= 12; y--) {
        let block = World.getBlockAt(x, y, z)
        // Blacklisted blocks should just be counted as air.
        if (blacklisted.includes(block.type.getID())) {
            blockIds += "0"
            continue
        }

        blockIds += block.type.getID()
    }

    return hashCode(blockIds)
}

export const Checkmark = {
    NONE: 0,
    GRAY: 1,
    FAILED: 2,
    WHITE: 3,
    GREEN: 4
}

/**
 * Rotates a set of coordinates clockwise.
 * @param {[Number, Number, Number]} coordinates 
 * @param {Number} degree - Angle in indexes, eg 90 degrees = 1, 270 degrees = 3
 * @returns 
 */
export const rotateCoords = ([x, y, z], degree) => {
    if (degree < 0) degree = degree + 4

    if (degree == 0) return [x, y, z]
    if (degree == 1) return [z, y, -x]
    if (degree == 2) return [-x, y, -z]
    if (degree == 3) return [-z, y, x]
    
    return [x, y, z]
}