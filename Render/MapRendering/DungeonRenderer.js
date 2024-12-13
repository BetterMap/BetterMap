const BufferedImage = Java.type("java.awt.image.BufferedImage")

import RoomRenderer from "./RoomRenderer"
import DoorRenderer from "./DoorRenderer"
import renderLibs from "../../../guimanager/renderLibs"
import DungeonMap from "../../Components/DungeonMap"
import RenderContext from "./../RenderContext"
import MapTab from "../MapTab"

class DungeonRenderer extends MapTab {
    constructor(mapRenderer) {
        super("Dungeon", mapRenderer)

        this.roomRenderer = new RoomRenderer();
        this.doorRenderer = new DoorRenderer();
    }

    /**
     * 
     * @param {DungeonMap} dungeon 
     * @param {RenderContext} renderContext 
     * @returns 
     */
    createMapImage(dungeon, renderContext) {
        let image = new BufferedImage(renderContext.getImageSize(dungeon.floor), renderContext.getImageSize(dungeon.floor), BufferedImage.TYPE_INT_ARGB);

        let graphics = image.createGraphics();

        // Shift border + padding so less math involved
        graphics.translate(renderContext.paddingLeft + renderContext.borderWidth, renderContext.paddingTop + renderContext.borderWidth);

        // Render all doors
        // Rendering before rooms that way rooms cover it as there is 1 specific situation where early dungeon will put a room in the middle of an L shape
        for (let door of dungeon.doors.values()) {
            this.doorRenderer.drawDoor(renderContext, graphics, door);
        }
        // Render all rooms and draw checkmarks
        for (let room of dungeon.roomsArr) {
            this.roomRenderer.drawRoom(renderContext, graphics, room);
            this.roomRenderer.drawCheckmark(renderContext, graphics, room);
        }

        graphics.dispose();
        return image;
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     * @param {Number} mouseX
     * @param {Number} mouseY
     */
    draw(renderContext, dungeonMap, mouseX, mouseY) {
        if (!renderContext) return

        if (renderContext.image) {
            let { x, y, size } = renderContext.getMapDimensions()

            renderContext.image.draw(x + renderContext.borderWidth, y + renderContext.borderWidth, size, size - renderContext.borderWidth)

            for (let room of dungeonMap.roomsArr) {
                //those arent exclusive, each checks their own conditions
                this.roomRenderer.drawPuzzle(renderContext, room, dungeonMap)
                this.roomRenderer.drawExtras(renderContext, room, dungeonMap)
            }

            // Render heads
            renderLibs.scizzor(x + renderContext.borderWidth, y + renderContext.borderWidth, size - 2 * renderContext.borderWidth, size - renderContext.borderWidth)
            for (let player of dungeonMap.players) {
                if (dungeonMap.deadPlayers.has(player.username.toLowerCase())) continue
                player.drawIcon(renderContext, dungeonMap)
            }
            renderLibs.stopScizzor()
        }

        if (!renderContext.image
            || (renderContext.imageLastUpdate < dungeonMap.lastChanged)) {
            // Create image if not cached or cache outdated
            if (renderContext.image) renderContext.image.destroy() // Causes error for some reason
            renderContext.image = new Image(this.createMapImage(dungeonMap, renderContext));

            renderContext.imageLastUpdate = Date.now()
        }

        dungeonMap.drawRoomTooltip(renderContext, mouseX, mouseY)
    }

}

export default DungeonRenderer