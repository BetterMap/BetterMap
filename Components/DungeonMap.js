import MapPlayer from "./MapPlayer"
import Room from "./Room"

import { getScoreboardInfo, getTabListInfo, getRequiredSecrets } from "../Utils/Score"

const BufferedImage = Java.type("java.awt.image.BufferedImage")

let mapDataScale = {
    "E": 22,
    "1": 22,
    "2": 22,
    "3": 22,
    "4": 20,
    "5": 20,
    "6": 20,
    "7": 20
}


class DungeonMap {
    constructor(floor, masterMode) {
        /**
         * @type {Map<String, Room>} The string is in form x,y eg 102,134 and will correspond to the top left corner of a room component
         */
        this.rooms = new Map()

        this.roomScaleMap = mapDataScale[floor[floor.length - 1]] //how many pixels on the map is 32 blocks

        /**
         * @type {Set<Room>} So that its easy to loop over all rooms without duplicates
         */
        this.roomsArr = new Set()

        this.floor = floor
        this.masterMode = masterMode;

        this.lastChanged = Date.now()

        /**
         * @type {Array<MapPlayer>}
         */
        this.players = []

        this.currentRenderContextId = 0

        this.lastRenderContext = 0
        this.renderContexts = []

        this.mimicKilled = false;
    }

    markChanged() {
        this.lastChanged = Date.now()
    }

    createRenderContext({ x, y, size, headScale = 8 }) {
        let contextId = this.lastRenderContext++

        let contextData = {
            x,
            y,
            size,
            headScale,
            image,
            imageLastUpdate,
            lastImage
        }

        this.renderContexts[contextId] = contextData

        return contextId
    }

    getRenderContextData(contextId) {
        return this.renderContexts[contextId]
    }

    getCurrentRenderContext() {
        return this.getRenderContextData(this.currentRenderContextId)
    }

    draw(contextId) {
        this.currentRenderContextId = contextId

        //TODO: create image if not cached or cache outdated
        //TODO: render map background
        //TODO: render image
        //TODO: render stuff overlayed on the image (heads, text on map, secrets info ect)
    }

    updateFromMap(mapData) {

    }

    renderImage(contextId) {
        //create 256x256 image
        let image = new BufferedImage(256, 256, BufferedImage.TYPE_INT_ARGB)

        //create graphics rendering context
        let graphics = image.createGraphics()

        //translate dungeon into view
        graphics.translate(256 - 32, 256 - 32)

        //TODO: render doors

        //render rooms
        for (let room of this.roomsArr) {
            room.render(graphics)
        }

        //undo translation
        graphics.translate(-256 + 32, -256 + 32)

        return image
    }

    getScore() {
        let exploration = 0;
        let time = 100; //TODO:  Figure out how to actually do this one
        let skill = 0;
        let bonus = 0;

        let requiredSecrets = getRequiredSecrets(7, false);
        let roomCompletion = getScoreboardInfo();
        let [secrets, crypts, deaths, unfinshedPuzzles, completedRoomsTab] = getTabListInfo();
        let completedRooms = this.rooms?.filter(r => r.isCleared())?.length ?? rooms;

        //if map data is incomplete, it's worth using the higher number
        completedRooms = Math.max(completedRooms, completedRoomsTab);

        //estimate total room count based of the cleared percentage and the tab info. If nothing is cleared, assume 36 rooms
        totalRoomEstimate = roomCompletion ? Math.round(completedRoomsTab / roomCompletion * 100) : 36;

        //exploration
        exploration += Math.min(40, ~~(secrets / requiredSecrets * 40));
        exploration += Math.min(60, ~~(completedRooms / totalRoomEstimate * 60));

        //time
        //NOPE

        //skill
        //TODO: Check for spirit pet through API
        skill += ~~(completedRooms / totalRoomEstimate * 80) - unfinshedPuzzles * 10;
        skill -= deaths * 2;
        //cant physically drop below 20 score, no matter what
        skill = Math.max(0, skill);
        skill += 20;

        //bonus
        bonus += Math.min(5, crypts);
        if (this.floor >= 6 && this.mimicKilled)
            bonus += 2;
        //TODO: Check for Paul through API
        //TODO: Add toggle to check add +10 score anyway, cause of jerry mayor

        return [exploration, time, skill, bonus]
    }
}

export default DungeonMap