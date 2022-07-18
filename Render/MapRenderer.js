const BufferedImage = Java.type("java.awt.image.BufferedImage")

import { m } from "../../mappings/mappings"

import RoomRenderer from "./RoomRenderer"
import DoorRenderer from "./DoorRenderer"
import DungeonMap from "../Components/DungeonMap"
import Room from "../Components/Room"
import Door from "../Components/Door"

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

    draw(renderContext, dungeonMap) {
        if (!renderContext) return

        if (renderContext.image) {
            let { x, y, size } = renderContext.getMapDimensions()

            Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y, size, size)//background

            renderContext.image.draw(x, y, size, size)

            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, size, this.borderWidth) //border
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, this.borderWidth, size)
            Renderer.drawRect(Renderer.color(0, 0, 0), x + size - this.borderWidth, y, this.borderWidth, size)
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - this.borderWidth, size, this.borderWidth)

        }

        if (!renderContext.image
            || (renderContext.imageLastUpdate < dungeonMap.lastChanged)) {
            //create image if not cached or cache outdated
            if (renderContext.image) {
                renderContext.image.getTexture()[m.deleteGlTexture]()
            }
            renderContext.image = new Image(this.createMapImage(dungeonMap));

            renderContext.imageLastUpdate = Date.now()
        }
    }

}

export default MapRenderer