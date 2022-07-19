const BufferedImage = Java.type("java.awt.image.BufferedImage")

import { m } from "../../mappings/mappings"

import RoomRenderer from "./RoomRenderer"
import DoorRenderer from "./DoorRenderer"
import renderLibs from "../../guimanager/renderLibs"
import DungeonMap from "../Components/DungeonMap"

class MapRenderer {

    imageSize = 256;

    paddingTop = 24;
    paddingLeft = 24;

    borderWidth = 2;

    roomGap = 6;
    roomSize = 26;

    constructor() {
        this.roomRenderer = new RoomRenderer(this.roomSize, this.roomGap);
        this.doorRenderer = new DoorRenderer();
    }


    createMapImage(dungeon) {
        let image = new BufferedImage(this.imageSize, this.imageSize, BufferedImage.TYPE_INT_ARGB);

        let graphics = image.createGraphics();

        //shift border + padding so less math involved
        graphics.translate(this.paddingLeft + this.borderWidth, +this.paddingTop + this.borderWidth);

        //render all doors
        //rendering before rooms that way rooms cover it as there is 1 specific situation where early dungeon will put a room in the middle of an L shape
        for (let door of dungeon.doors.values()) {
            this.doorRenderer.drawDoor(graphics, door);
        }
        //render all rooms
        for (let room of dungeon.roomsArr) {
            this.roomRenderer.drawRoom(graphics, room);
        }

        graphics.dispose();
        return image;
    }

    /**
     * 
     * @param {*} renderContext 
     * @param {DungeonMap} dungeonMap 
     */
    draw(renderContext, dungeonMap) {
        if (!renderContext) return

        if (renderContext.image) {
            let { x, y, size } = renderContext.getMapDimensions()

            Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y, size, size)//background

            renderContext.image.draw(x, y, size, size)

            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, size, this.borderWidth) //border
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, this.borderWidth, size)
            Renderer.drawRect(Renderer.color(0, 0, 0), x + size - this.borderWidth, y, this.borderWidth, size)

            //dont render bottom line if scoreinfo rendering
            //Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - this.borderWidth, size, this.borderWidth)

            //score info under map
            //TODO: add toggle

            let scoreInfoHeight = 10 * size / 100

            Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y + size, size, scoreInfoHeight)//background

            let scoreInfo = dungeonMap.getScore() //TODO: better display text
            renderLibs.drawStringCenteredFull(scoreInfo.total, x + size / 4, y + size + scoreInfoHeight / 2, size / 100)

            renderLibs.drawStringCenteredFull(scoreInfo.mimic.toString(), x + size / 4 * 3, y + size + scoreInfoHeight / 2, size / 100)

            Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y + size - this.borderWidth, size, scoreInfoHeight)

            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size, this.borderWidth, scoreInfoHeight) //border of score info
            Renderer.drawRect(Renderer.color(0, 0, 0), x + size - this.borderWidth, y + size, this.borderWidth, scoreInfoHeight)
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size + scoreInfoHeight, size, this.borderWidth)

        }

        if (!renderContext.image
            || (renderContext.imageLastUpdate < dungeonMap.lastChanged)) {
            //create image if not cached or cache outdated
            if (renderContext.image) {
                try {
                    renderContext.image.destroy()
                } catch (_) { }//if u dont have modified ct version
            }
            renderContext.image = new Image(this.createMapImage(dungeonMap));

            renderContext.imageLastUpdate = Date.now()
        }
    }

}

export default MapRenderer