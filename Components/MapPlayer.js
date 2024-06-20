import SoopyNumber from "../../guimanager/Classes/SoopyNumber.js"
import renderLibs from "../../guimanager/renderLibs.js"
import settings from "../Extra/Settings/CurrentSettings.js"
import RenderContext from "../Render/RenderContext.js"
import Position from "../Utils/Position.js"
import RoomComponent from "../Utils/RoomComponent.js"
import { dungeonOffsetX, dungeonOffsetY, getSBID } from "../Utils/Utils.js"
import { fetch } from "../Utils/networkUtils.js"

const DefaultVertexFormats = Java.type("net.minecraft.client.renderer.vertex.DefaultVertexFormats")
const MCTessellator = Java.type("net.minecraft.client.renderer.Tessellator")

class MapPlayer {
    /**
     * @param {NetworkPlayerInfo} networkPlayerInfo
     * @param {DungeonMap} dunegonMap
     */
    constructor(networkPlayerInfo, dungeonMap, username) {
        this.networkPlayerInfo = networkPlayerInfo
        this.dungeonMap = dungeonMap

        this.location = new RoomComponent(0, 0, dungeonMap)
        this.location.worldXRaw.setAnimMode("linea")
        this.location.worldYRaw.setAnimMode("linea")

        /**@type {import("./Room").default} */
        this.currentRoomCache = undefined // To track player enter/exit events

        this.yaw = new SoopyNumber(0)
        this.yaw.setAnimMode("sin_out")
        this._username = username
        this.uuid = undefined

        this.locallyUpdated = 0

        this.deaths = 0

        this.startedRunSecrets = 0
        this.currentSecrets = 0

        this.minRooms = 0
        this.maxRooms = 0
        /**@type {[MapPlayer[], import("./Room").default][]} */
        this.roomsData = []

        this.skyblockLevel = null
        this.dungeonClass = null
        this.classLevel = null

        this.playerColor = [0, 0, 0, 255]
    }

    get username() {
        return this._username
    }

    set username(name) {
        if (this._username === name) return

        this._username = name
        this.uuid = undefined
        this.checkUpdateUUID()
    }

    // updateDungeonClass() {
    //     // for everything in tab
    //     for (let entry of TabList.getNames()) {
    //         // remove everything thats not a letter space or number and get rid of color codes
    //         entry = ChatLib.removeFormatting(entry).replace('[YOUTUBE] ', '').replace('[ADMIN] ', '').replace(/[^A-Za-z0-9 _]/gi, '').replace('  ', ' ')
    //         // if players username is it it 
    //         if (!entry.includes(this.username)) continue
    //         // pull out the cool stuff and then leave
    //         this.skyblockLevel = entry.split(' ')[0]
    //         this.dungeonClass = entry.split(' ')[2]
    //         this.classLevel = entry.split(' ')[3] // This can be simplified if all the class colors become an object, but thats weird so i didnt do that...
    //         // ChatLib.chat(`SB Level: ${this.skyblockLevel}`)
    //         // ChatLib.chat(`Class: ${this.dungeonClass}`)
    //         // ChatLib.chat(`Class Level: ${this.classLevel}`)
    //         return this
    //     }
    //     return this
    // }

    updatePlayerColor() {
        if (settings.settings.headBorder == "single") {
            if (this.uuid === Player.getUUID().toString()) {
                this.playerColor = settings.settings.singleBorderColorSelf
            } else {
                this.playerColor = settings.settings.singleBorderColor
            }
            return this
        }
        switch (this.dungeonClass) {
            case "Healer":
                this.playerColor = settings.settings.healerColor ?? [240, 70, 240, 255]
                break;
            case "Mage":
                this.playerColor = settings.settings.mageColor ?? [70, 210, 210, 255]
                break;
            case "Berserk":
                this.playerColor = settings.settings.bersColor ?? [255, 0, 0, 255]
                break;
            case "Archer":
                this.playerColor = settings.settings.archColor ?? [30, 170, 50, 255]
                break;
            case "Tank":
                this.playerColor = settings.settings.tankColor ?? [150, 150, 150, 255]
                break;
        }
        return this
    }

    /**
     * Updates the player's username, class, class level and Skyblock level using the match object from running
     * the tablist line against https://regex101.com/r/cUzJoK/3
     * @param {Object} matchObject 
     */
    updateTablistInfo(matchObject) {
        let [_, sbLevel, name, clazz, level] = matchObject
        this.skyblockLevel = parseInt(sbLevel)
        this.username = name
        if (["EMPTY", "DEAD"].includes(clazz)) return
        this.dungeonClass = clazz
        this.classLevel = parseInt(level)
    }


    checkUpdateUUID() {
        if (this.uuid) return
        // Check players in world to update uuid field

        let player = World.getPlayerByName(this.username)
        if (!player) return
        this.uuid = player.getUUID().toString()
        getPlayerSecrets(this.uuid, 120000, secrets => {
            this.startedRunSecrets = secrets
            this.currentSecrets = secrets // So it doesent show negative numbers if error later
        })
    }

    updateCurrentSecrets() {
        if (!this.uuid) return

        getPlayerSecrets(this.uuid, 0, secrets => {
            this.currentSecrets = secrets
        })
    }

    get secretsCollected() {
        return this.currentSecrets - this.startedRunSecrets
    }

    setX(x) {
        this.location.worldX = x
    }
    setY(y) {
        this.location.worldY = y
    }
    setRotate(yaw) {
        this.yaw.set(yaw, 0)
    }
    setXAnimate(x, time = 1000) {
        this.location.worldXRaw.set(x, time)
    }
    setYAnimate(y, time = 1000) {
        this.location.worldYRaw.set(y, time)
    }
    setRotateAnimate(yaw, time = 1000) {
        let dist = yaw - this.yaw.get()
        if (dist > 180) this.yaw.set(this.yaw.get() + 360, 0)
        if (dist < -180) this.yaw.set(this.yaw.get() - 360, 0)

        this.yaw.set(yaw, time)
    }

    getRoom() {
        return this.dungeonMap.getRoomAt(this.location.worldX, this.location.worldY)
    }

    drawAt(x, y, w, h, showIcons = false, rotation = 0, borderWidth = 2) {
        Tessellator.pushMatrix()
        Renderer.retainTransforms(true)

        if (showIcons) {
            h *= 1.4
        }

        Renderer.translate(x + w / 2, y + h / 2, 50)

        Renderer.rotate(rotation)

        if (showIcons) {
            Renderer.drawImage(this.username === Player.getName() ? markerSelf : markerOther, -w / 2, -h / 2, w, h)
        } else {
            if (borderWidth) {
                this.updatePlayerColor()
                Renderer.drawRect(Renderer.color(this.playerColor[0] ?? 0, this.playerColor[1] ?? 0, this.playerColor[2] ?? 0, this.playerColor[3] ?? 255), -w / 2 - borderWidth * w / 30, -h / 2 - borderWidth * w / 30, w + borderWidth * 2 * w / 30, h + borderWidth * 2 * w / 30)
            }

            Tessellator.enableBlend()
            //                   .getTextureManager().bindTexture                     .getLocationSkin
            Client.getMinecraft().func_110434_K().func_110577_a(this.networkPlayerInfo.func_178837_g())
            Tessellator.enableTexture2D()

            //                             .getInstance()
            let tessellator = MCTessellator.func_178181_a()
            //                             .getWorldRenderer()
            let worldRenderer = tessellator.func_178180_c()
            //           .begin                                .POSITION_TEX
            worldRenderer.func_181668_a(7, DefaultVertexFormats.field_181707_g)
            
            //           .pos                              .tex                           .endVertex
            worldRenderer.func_181662_b(-w / 2, h / 2, 0.0).func_181673_a(8 / 64, 16 / 64).func_181675_d()
            worldRenderer.func_181662_b(w / 2, h / 2, 0.0).func_181673_a(16 / 64, 16 / 64).func_181675_d()
            worldRenderer.func_181662_b(w / 2, -h / 2, 0.0).func_181673_a(16 / 64, 8 / 64).func_181675_d()
            worldRenderer.func_181662_b(-w / 2, -h / 2, 0.0).func_181673_a(8 / 64, 8 / 64).func_181675_d()
            //         .draw
            tessellator.func_78381_a()
            
            //           .begin                                .POSITION_TEX
            worldRenderer.func_181668_a(7, DefaultVertexFormats.field_181707_g)

            worldRenderer.func_181662_b(-w / 2, h / 2, 0.0).func_181673_a(40 / 64, 16 / 64).func_181675_d()
            worldRenderer.func_181662_b(w / 2, h / 2, 0.0).func_181673_a(48 / 64, 16 / 64).func_181675_d()
            worldRenderer.func_181662_b(w / 2, -h / 2, 0.0).func_181673_a(48 / 64, 8 / 64).func_181675_d()
            worldRenderer.func_181662_b(-w / 2, -h / 2, 0.0).func_181673_a(40 / 64, 8 / 64).func_181675_d()
            //         .draw
            tessellator.func_78381_a()
        }
        Renderer.retainTransforms(false)
        Tessellator.popMatrix()
    }

    getRenderLocation(renderContext, dungeon) {
        let { x, y } = renderContext.getMapDimensions()

        if (!dungeon) return

        let arrayX = (this.location.worldX + 200) / 32 - 0.5
        let arrayY = (this.location.worldY + 200) / 32 - 0.5

        let x2 = (renderContext.roomGap / 2 + renderContext.blockSize * arrayX + renderContext.roomSize / 2 + renderContext.paddingLeft) / renderContext.getImageSize(dungeon.floor)
        let y2 = (renderContext.roomGap / 2 + renderContext.blockSize * arrayY + renderContext.roomSize / 2 + renderContext.paddingTop) / renderContext.getImageSize(dungeon.floor)

        x2 = x + x2 * renderContext.size + renderContext.borderWidth
        y2 = y + y2 * renderContext.size + renderContext.borderWidth

        return [x2, y2]
    }

    /**
     * @param {RenderContext} renderContext 
     */
    drawIcon(renderContext, dungeon, overrideX, overrideY) {
        if (renderContext.showHeads === 'off') return;
        let { size, headScale } = renderContext.getMapDimensions()

        if (!dungeon) return

        let rx = -headScale / 2 * size / 100 // Offsetting to the left by half image width,
        let ry = -headScale / 2 * size / 100 // Image width = headscale* size /100 (size = map size eg 100px, dividing by 100 so its exactly headscale when mapsize is 100)
        let rw = headScale * size / 100
        let rh = headScale * size / 100

        let [x2, y2] = this.getRenderLocation(renderContext, dungeon)
        x2 = overrideX || x2
        y2 = overrideY || y2

        this.drawAt(x2 + rx, y2 + ry, rw, rh, renderContext.showHeads === "icons" || renderContext.showHeads === 'self-icon' && this.username === Player.getName(), this.yaw.get(), renderContext.headBorder !== 'none' ? renderContext.headBorderWidth : 0)

        let showNametag = renderContext.playerNames === "always"

        if (renderContext.playerNames === "leap") {
            let id = getSBID(Player.getHeldItem())

            if (id === "SPIRIT_LEAP" || id === "INFINITE_SPIRIT_LEAP") showNametag = true
        }

        if (showNametag) {
            renderLibs.stopScizzor()

            Renderer.retainTransforms(true)
            Tessellator.pushMatrix()

            Renderer.translate(x2, y2, 101)
            Renderer.scale(size / 150, size / 150)
            renderLibs.drawStringCentered("&0" + this.username, 1, rh / (2 * size / 150), 1)
            renderLibs.drawStringCentered("&0" + this.username, -1, rh / (2 * size / 150), 1)
            renderLibs.drawStringCentered("&0" + this.username, 0, rh / (2 * size / 150) + 1, 1)
            renderLibs.drawStringCentered("&0" + this.username, 0, rh / (2 * size / 150) - 1, 1)
            renderLibs.drawStringCentered(this.username, 0, rh / (2 * size / 150), 1)

            Tessellator.popMatrix()
            Renderer.retainTransforms(false)

            renderLibs.scizzor(...renderLibs.getCurrScizzor())
        }

    }
}

export default MapPlayer

let secretsData = new Map()

register("step", () => {
    // Check if peoples data needs to be cleared from the map

    secretsData.forEach(([timestamp], uuid) => {
        if (Date.now() - timestamp > 5 * 60 * 1000) secretsData.delete(uuid)
    })
}).setDelay(10)

/**
 * Helper function to get the secrets for a player's uuid
 * This exists so it can have a cache time (eg end of last runs data can be used for start of this run)
 * 
 * cacheMs maxes at 5mins
 */
function getPlayerSecrets(uuid, cacheMs, callback) {

    if (secretsData.get(uuid)?.[0]?.timestamp > Date.now() - cacheMs) {
        callback(secretsData.get(uuid)[1]);
        return;
    }

    fetch(`https://api.tenios.dev/secrets/${uuid}`).text((secretsNum) => {
        let secrets = parseInt(secretsNum);
        secretsData.set(uuid, [Date.now(), secrets]);

        callback(secretsData.get(uuid)[1]);
    });
}

const markerSelf = Image.fromAsset("markerSelf.png");
const markerOther = Image.fromAsset("markerOther.png");