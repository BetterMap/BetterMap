import { m } from "../../mappings/mappings"
import PogObject from "../../PogData";

/**
 * @param {Number} id id of the line that should be changed 
 * @param {String} line text that the line should be changed to
 */
export function changeScoreboardLine(id, line) {
    let scoreboard = World.getWorld()[m.getScoreboard.World]();
    for (let team of scoreboard[m.getTeams]()) {
        let name = team[m.getTeamName]();
        if (name.includes('team') && name.includes(id)) {
            let prefix = line.substring(0, 15);
            let suffix = line.substring(15, 30);
            team.func_96666_b(prefix); //team.setPrefix()
            team.func_96662_c(suffix); //team.setSuffix()
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
 * Maps a set of real coords (x and z) to 0-5, the same as the room components.
 * @param {Number[]} realCoords - The real coords in the world ranging from -200 to -10. 
 * @returns 
 */
export const convertToRoomCoords = ([x, y]) => {
    return [
        MathLib.map(x, -200, -10, 0, 5),
        MathLib.map(y, -200, -10, 0, 5)
    ]
}

export let bmData = new PogObject("BetterMap", {
    "map": {
        "scale": 1,
        "x": 0,
        "y": 0,
        "headScale": 8,
        "checkmarkScale": 1
    }
}, "Data/data.json")


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
 export const renderCenteredString = (string, x, y, scale, splitWords=false, javaColor=null) => {
    if (!string || !x || !y) return
    Renderer.retainTransforms(true)
    string = Array.isArray(string) ? string : splitWords ? string.split(" ") : [string]
    let vertOffset = string.length*7 + (2*(string.length-1))
    let [r, g, b, a] = []
    if (javaColor) {
        r = javaColor.getRed()
        g = javaColor.getGreen()
        b = javaColor.getBlue()
        a = javaColor.getAlpha()
    }
    Renderer.translate(x, y)
    Renderer.scale(scale, scale)
    Renderer.translate(0, -vertOffset/2)
    // Render each line
    for (let i = 0; i < string.length; i++) {
        if (javaColor) Renderer.colorize(r, g, b, a)
        Renderer.drawStringWithShadow(string[i], -Renderer.getStringWidth(string[i])/2, (i*7 + (2*i)))
    }
    Renderer.retainTransforms(false)
}