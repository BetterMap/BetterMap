import MapPlayer from "./MapPlayer"
import Room from "./Room"


class DungeonMap {
    constructor(floor) {
        /**
         * @type {Map<String, Room>} The string is in form x,y eg 102,134 and will correspond to the top left corner of a room component
         */
        this.rooms = new Map()

        this.floor = floor

        /**
         * @type {Array<MapPlayer>}
         */
        this.players = []

        this.currentRenderContext = undefined
    }

    render({ x, y, size, headScale = 8 }) {
        this.currentRenderContext = { x, y, size, headScale }

        //TODO: create image if not cached or cache outdated
        //TODO: render map background
        //TODO: render image
        //TODO: render stuff overlayed on the image (heads, text on map, secrets info ect)
    }
}

export default DungeonMap