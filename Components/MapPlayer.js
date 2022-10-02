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
        this.username = username
        this.uuid = undefined

        this.locallyUpdated = 0

        this.startedRunSecrets = 0
        this.currentSecrets = 0

        this.minRooms = 0
        this.maxRooms = 0
        /**@type {[MapPlayer[], import("./Room").default][]} */
        this.roomsData = []
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
                ChatLib.chat(this.username + "'s secrets: " + secrets)
            })
        }
    }

    updateCurrentSecrets() {
        if (!this.uuid) return

        getPlayerSecrets(this.uuid, 0, secrets => {
            this.currentSecrets = secrets
            ChatLib.chat(this.username + "'s secrets: " + secrets + " (from " + this.startedRunSecrets + ")")
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

    /**
     * @param {RenderContext} renderContext 
     */
    drawIcon(renderContext, dungeon, overrideX, overrideY) {
        let { x, y, size, headScale } = renderContext.getMapDimensions()

        if (!dungeon) return

        let rx = -headScale / 2 * size / 100 //offsetting to the left by half image width,
        let ry = -headScale / 2 * size / 100 //image width = headscale* size /100 (size = map size eg 100px, dividing by 100 so its exactly headscale when mapsize is 100)
        let rw = headScale * size / 100
        let rh = headScale * size / 100

        let arrayX = (this.location.worldX + 200) / 32 - 0.5
        let arrayY = (this.location.worldY + 200) / 32 - 0.5

        let x2 = (renderContext.roomGap / 2 + renderContext.blockSize * arrayX + renderContext.roomSize / 2 + renderContext.paddingLeft) / renderContext.getImageSize(dungeon.floor)
        let y2 = (renderContext.roomGap / 2 + renderContext.blockSize * arrayY + renderContext.roomSize / 2 + renderContext.paddingTop) / renderContext.getImageSize(dungeon.floor)

        x2 = overrideX || x + x2 * renderContext.size + renderContext.borderWidth
        y2 = overrideY || y + y2 * renderContext.size + renderContext.borderWidth

        Renderer.retainTransforms(true)
        Renderer.translate(x2, y2, 50)
        // Renderer.translate(x + (this.location.worldX + 256 - 32) * size / 256, y + (this.location.worldY + 256 - 32) * size / 256, 50)
        Renderer.rotate(this.yaw.get())

        if (renderContext.headBorder) Renderer.drawRect(Renderer.BLACK, -rw / 2 - 1, -rh / 2 - 1, rw + 2, rh + 2)

        GlStateManager[m.enableBlend]()
        Client.getMinecraft()[m.getTextureManager]()[m.bindTexture.TextureManager](this.networkPlayerInfo[m.getLocationSkin.NetworkPlayerInfo]())
        GlStateManager[m.enableTexture2D]()

        let tessellator = MCTessellator[m.getInstance.Tessellator]()
        let worldRenderer = tessellator[m.getWorldRenderer]()
        worldRenderer[m.begin](7, DefaultVertexFormats[f.POSITION_TEX])

        worldRenderer[m.pos](rx, ry + rh, 0.0)[m.tex](8 / 64, 16 / 64)[m.endVertex]()
        worldRenderer[m.pos](rx + rw, ry + rh, 0.0)[m.tex](16 / 64, 16 / 64)[m.endVertex]()
        worldRenderer[m.pos](rx + rw, ry, 0.0)[m.tex](16 / 64, 8 / 64)[m.endVertex]()
        worldRenderer[m.pos](rx, ry, 0.0)[m.tex](8 / 64, 8 / 64)[m.endVertex]()
        tessellator[m.draw.Tessellator]()
        Renderer.retainTransforms(false)

        let showNametag = renderContext.playerNames === "always"

        if (renderContext.playerNames === "leap") {
            let id = getSBID(Player.getHeldItem())

            if (id === "SPIRIT_LEAP" || id === "INFINITE_SPIRIT_LEAP") showNametag = true
        }

        if (showNametag) {
            Renderer.retainTransforms(true)

            renderLibs.stopScizzor()
            Renderer.translate(x2, y2, 101)
            Renderer.scale(size / 150, size / 150)
            renderLibs.drawStringCentered("&0" + this.username, 1, rh / (2 * size / 150), 1)
            renderLibs.drawStringCentered("&0" + this.username, -1, rh / (2 * size / 150), 1)
            renderLibs.drawStringCentered("&0" + this.username, 0, rh / (2 * size / 150) + 1, 1)
            renderLibs.drawStringCentered("&0" + this.username, 0, rh / (2 * size / 150) - 1, 1)
            renderLibs.drawStringCentered(this.username, 0, rh / (2 * size / 150), 1)
            renderLibs.scizzorFast(...renderLibs.getCurrScizzor())

            Renderer.retainTransforms(false)
        }

        Tessellator.popMatrix()
        Tessellator.pushMatrix()
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