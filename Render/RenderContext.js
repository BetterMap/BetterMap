/**
 * @typedef {Object} ContextSettings
 * @property {"legalmap"|"soopymap"|"teniosmap"} mapStyle - Style of the map rendering
 * @property {Number} posX - X Position of the map on screen
 * @property {Number} posY - y Position of the map on screen
 * @property {Number} size - Width/height of the map when rendered
 * @property {Number} headScale - Width/height of heads (scales with size, will be same if size is 100)
 * @property {Number} iconScale - Width/height of icons (scales with size, will be same if size is 100)
 * @property {"hypixel"|"default"} tickStyle - Style of the ticks
 * @property {"none"|"text"|"icon"} puzzleNames - Render style of puzzle names
 * @property {Boolean} headBorder - Wether to put a black border around heads on the map
 * @property {Boolean} playerNames - Wether to show player names when holding spirit leaps
 */

class RenderContext {

    constructor({ mapStyle = "legalmap", posX = 0, posY = 0, size = 100, headScale = 8, iconScale = 8, tickStyle = "hypixel", puzzleNames = "none", headBorder = false, playerNames = true }) {

        /**@type {ContextSettings} */
        this.settings = {
            mapStyle,
            posX,
            posY,
            size,
            headScale,
            iconScale,
            tickStyle,
            puzzleNames,
            headBorder,
            playerNames
        }

        this.image = null;
        this.imageLastUpdate = 0;
    }

    get posX() {
        return this.settings.posX
    }

    get posY() {
        return this.settings.posY
    }

    get size() {
        return this.settings.size
    }
    get headScale() {
        return this.settings.headScale
    }
    get iconScale() {
        return this.settings.iconScale
    }
    get tickStyle() {
        return this.settings.tickStyle
    }
    get puzzleNames() {
        return this.settings.puzzleNames
    }
    get headBorder() {
        return this.settings.headBorder
    }
    get playerNames() {
        return this.settings.playerNames
    }

    get mapStyle() {
        return this.settings.mapStyle
    }

    get colorMap() {
        switch (this.mapStyle) {
            case "legalmap":
                return SoopyMapColorMap
            case "soopymap":
                return SoopyMapColorMap //TODO: add other color maps
            case "teniosmap":
                return SoopyMapColorMap
        }
    }

    get roomGap() {
        switch (this.mapStyle) {
            case "legalmap":
                return 8 // 1/3 roomSize
            case "soopymap":
                return 6
            case "teniosmap":
                return 6 //TODO: this value
        }
    }

    get roomSize() {
        switch (this.mapStyle) {
            case "legalmap":
                return 24
            case "soopymap":
                return 24
            case "teniosmap":
                return 24 //TODO: this value
        }
    }

    get blockSize() {
        return this.roomSize + this.roomGap
    }

    get doorWidth() {
        switch (this.mapStyle) {
            case "legalmap":
                return 8
            case "soopymap":
                return 10
            case "teniosmap":
                return 6 //TODO: this value
        }
    }

    destroy() {
        this.image?.getTexture()?.[m.deleteGlTexture]()
        this.image = undefined
    }

    getMapDimensions() {
        return {
            x: this.posX,
            y: this.posY,
            size: this.size,
            headScale: this.headScale
        }
    }
}

export default RenderContext

let roomHash = {
    SPAWN: 0,
    NORMAL: 1,
    PUZZLE: 2,
    MINIBOSS: 3,
    FAIRY: 4,
    BLOOD: 5,
    UNKNOWN: 6,
    TRAP: 7,
    BLACK: 8, //only for rendering wither doors
    NORMAL_CONNECTION: 9 //for rendering connections between normal rooms
}

const Color = Java.type("java.awt.Color")

const SoopyMapColorMap = new Map()
SoopyMapColorMap.set(roomHash.SPAWN, new Color(Renderer.color(0, 124, 0, 255)))
SoopyMapColorMap.set(roomHash.NORMAL, new Color(Renderer.color(114, 67, 27, 255)))
SoopyMapColorMap.set(roomHash.NORMAL_CONNECTION, new Color(Renderer.color(114, 67, 27, 255)))
SoopyMapColorMap.set(roomHash.PUZZLE, new Color(Renderer.color(178, 76, 216, 255)))
SoopyMapColorMap.set(roomHash.MINIBOSS, new Color(Renderer.color(229, 229, 51, 255)))
SoopyMapColorMap.set(roomHash.FAIRY, new Color(Renderer.color(242, 127, 165, 255)))
SoopyMapColorMap.set(roomHash.BLOOD, new Color(Renderer.color(255, 0, 0, 255)))
SoopyMapColorMap.set(roomHash.TRAP, new Color(Renderer.color(216, 127, 51, 255)))
SoopyMapColorMap.set(roomHash.UNKNOWN, new Color(Renderer.color(65, 65, 65, 255)))
SoopyMapColorMap.set(roomHash.BLACK, new Color(Renderer.color(0, 0, 0, 255)))