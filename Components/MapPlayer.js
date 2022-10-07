import SoopyNumber from "../../guimanager/Classes/SoopyNumber.js"
import renderLibs from "../../guimanager/renderLibs.js"
import { f, m } from "../../mappings/mappings.js"
import settings from "../Extra/Settings/CurrentSettings.js"
import RenderContext from "../Render/RenderContext.js"
import Position from "../Utils/Position.js"
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

        this.location = new Position(0, 0, dungeonMap)
        this.location.worldXRaw.setAnimMode("linea")
        this.location.worldYRaw.setAnimMode("linea")

        /**@type {import("./Room").default} */
        this.currentRoomCache = undefined //to track player enter/exit events

        this.yaw = new SoopyNumber(0)
        this.yaw.setAnimMode("sin_out")
        this._username = username
        this.uuid = undefined

        this.locallyUpdated = 0

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

    updateDungeonClass() {
        // for everything in tab
        for (let entry of TabList.getNames()) {
            // remove everything thats not a letter space or number and get rid of color codes
            entry = ChatLib.removeFormatting(entry).replace('[YOUTUBE] ', '').replace('[ADMIN] ', '').replace(/[^A-Za-z0-9 _]/gi, '').replace('  ', ' ')
            // if players username is it it 
            if (entry.includes(this.username)){
                // pull out the cool stuff and then leave
                this.skyblockLevel = entry.split(' ')[0]
                this.dungeonClass = entry.split(' ')[2]
                this.classLevel = entry.split(' ')[3]
                switch(this.dungeonClass) {
                    case "Archer":
                        this.playerColor = [30, 170, 50, 255]
                        break;
                    case "Mage":
                        this.playerColor = [70, 210, 210, 255]
                        break;
                    case "Tank":
                        this.playerColor = [150, 150, 150, 255]
                        break;
                    case "Berserk":
                        this.playerColor = [255, 0, 0, 255]
                        break;
                    case "Healer":
                        this.playerColor = [240, 70, 240, 255]
                        break;
                }
                return this
            }
          }
          return this
    }

    checkUpdateUUID() {
        if (this.uuid) return
        //Check players in world to update uuid field

        let player = World.getPlayerByName(this.username)
        if (player) {
            this.uuid = player.getUUID().toString()
            getPlayerSecrets(this.uuid, 120000, secrets => {
                this.startedRunSecrets = secrets
                this.currentSecrets = secrets //So it doesent show negative numbers if error later
            })
        }
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
        if (dist > 180) {
            this.yaw.set(this.yaw.get() + 360, 0)
        }
        if (dist < -180) {
            this.yaw.set(this.yaw.get() - 360, 0)
        }

        this.yaw.set(yaw, time)
    }

    getRoom(dungeon) {
        let x = ~~((this.location.worldX + dungeonOffsetX) / 32);
        let y = ~~((this.location.worldY + dungeonOffsetY) / 32);
        return dungeon.rooms.get(x + ',' + y)
    }

    drawAt(x, y, w, h, rotation = 0, border = true) {
        Tessellator.pushMatrix()
        Renderer.retainTransforms(true)
        Renderer.translate(x + w / 2, y + h / 2, 50)
        // Renderer.translate(x + (this.location.worldX + 256 - 32) * size / 256, y + (this.location.worldY + 256 - 32) * size / 256, 50)
        Renderer.rotate(rotation)
        
        // Player name border color thing
        if (border) Renderer.drawRect(Renderer.color(this.playerColor[0] ?? 0, this.playerColor[1] ?? 0, this.playerColor[2] ?? 0, this.playerColor[3] ?? 255), -w / 2 - 1, -h / 2 - 1, w + 2, h + 2)

        GlStateManager[m.enableBlend]()
        Client.getMinecraft()[m.getTextureManager]()[m.bindTexture.TextureManager](this.networkPlayerInfo[m.getLocationSkin.NetworkPlayerInfo]())
        GlStateManager[m.enableTexture2D]()

        let tessellator = MCTessellator[m.getInstance.Tessellator]()
        let worldRenderer = tessellator[m.getWorldRenderer]()
        worldRenderer[m.begin](7, DefaultVertexFormats[f.POSITION_TEX])

        worldRenderer[m.pos](-w / 2, h / 2, 0.0)[m.tex](8 / 64, 16 / 64)[m.endVertex]()
        worldRenderer[m.pos](w / 2, h / 2, 0.0)[m.tex](16 / 64, 16 / 64)[m.endVertex]()
        worldRenderer[m.pos](w / 2, -h / 2, 0.0)[m.tex](16 / 64, 8 / 64)[m.endVertex]()
        worldRenderer[m.pos](-w / 2, -h / 2, 0.0)[m.tex](8 / 64, 8 / 64)[m.endVertex]()
        tessellator[m.draw.Tessellator]()

        worldRenderer[m.begin](7, DefaultVertexFormats[f.POSITION_TEX])

        worldRenderer[m.pos](-w / 2, h / 2, 0.0)[m.tex](40 / 64, 16 / 64)[m.endVertex]()
        worldRenderer[m.pos](w / 2, h / 2, 0.0)[m.tex](48 / 64, 16 / 64)[m.endVertex]()
        worldRenderer[m.pos](w / 2, -h / 2, 0.0)[m.tex](48 / 64, 8 / 64)[m.endVertex]()
        worldRenderer[m.pos](-w / 2, -h / 2, 0.0)[m.tex](40 / 64, 8 / 64)[m.endVertex]()
        tessellator[m.draw.Tessellator]()
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
        let { size, headScale } = renderContext.getMapDimensions()

        if (!dungeon) return

        let rx = -headScale / 2 * size / 100 //offsetting to the left by half image width,
        let ry = -headScale / 2 * size / 100 //image width = headscale* size /100 (size = map size eg 100px, dividing by 100 so its exactly headscale when mapsize is 100)
        let rw = headScale * size / 100
        let rh = headScale * size / 100

        let [x2, y2] = this.getRenderLocation(renderContext, dungeon)
        x2 = overrideX || x2
        y2 = overrideY || y2

        this.drawAt(x2 + rx, y2 + ry, rw, rh, this.yaw.get(), renderContext.headBorder)

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
    //Check if peoples data needs to be cleared from the map

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
        callback(secretsData.get(uuid)[1])
        return
    }

    let apiKey = settings.settings.apiKey

    if (!apiKey) return
    fetch(`https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}`).json(data => {
        let secrets = data?.player?.achievements?.skyblock_treasure_hunter || 0

        secretsData.set(uuid, [Date.now(), secrets])

        callback(secretsData.get(uuid)[1])
    })
}