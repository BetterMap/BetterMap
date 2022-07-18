import { f, m } from "../../mappings/mappings.js"
import Position from "../Utils/Position.js"

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

        this.yaw = 0
        this.username = username
    }

    setX(x) {
        this.location.worldX = x
    }
    setY(y) {
        this.location.worldY = y
    }
    setRotate(yaw) {
        this.yaw = yaw
    }
    setXAnimate(x) { //TODO: make these actually animate
        this.location.worldX = x
    }
    setYAnimate(y) {
        this.location.worldY = y
    }
    setRotateAnimate(yaw) {
        this.yaw = yaw
    }

    /**
     * TODO: Option for black border
     * @param {Number} mapSize 
     * @param {Number} imgSize 
     */
    drawIcon(renderContext) {
        let { x, y, size, headScale } = renderContext.getMapDimensions()

        let rx = -headScale / 2 * size / 100 //offsetting to the left by half image width,
        let ry = -headScale / 2 * size / 100 //image width = headscale* size /100 (size = map size eg 100px, dividing by 100 so its exactly headscale when mapsize is 100)
        let rw = headScale * size / 100
        let rh = headScale * size / 100

        Renderer.translate(x + (this.location.worldX + 256 - 32) * size / 256, y + (this.location.worldY + 256 - 32) * size / 256, 50)
        Renderer.rotate(this.yaw)
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

        Tessellator.popMatrix()
        Tessellator.pushMatrix()
    }
}

export default MapPlayer