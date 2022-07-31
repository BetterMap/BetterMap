import { f, m } from "../../mappings/mappings.js"
import RenderContext from "../Render/RenderContext.js"
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
     * @param {RenderContext} renderContext 
     */
    drawIcon(renderContext, dungeon) {
        let { x, y, size, headScale } = renderContext.getMapDimensions()

        let rx = -headScale / 2 * size / 100 //offsetting to the left by half image width,
        let ry = -headScale / 2 * size / 100 //image width = headscale* size /100 (size = map size eg 100px, dividing by 100 so its exactly headscale when mapsize is 100)
        let rw = headScale * size / 100
        let rh = headScale * size / 100

        let arrayX = (this.location.worldX + 200) / 32 - 0.5
        let arrayY = (this.location.worldY + 200) / 32 - 0.5

        let x2 = (renderContext.roomGap / 2 + renderContext.blockSize * arrayX + renderContext.roomSize / 2 + renderContext.paddingLeft) / renderContext.getImageSize(dungeon.floor)
        let y2 = (renderContext.roomGap / 2 + renderContext.blockSize * arrayY + renderContext.roomSize / 2 + renderContext.paddingTop) / renderContext.getImageSize(dungeon.floor)

        x2 = x + x2 * renderContext.size + renderContext.borderWidth
        y2 = y + y2 * renderContext.size + renderContext.borderWidth

        Renderer.retainTransforms(true)
        Renderer.translate(x2, y2, 50)
        // Renderer.translate(x + (this.location.worldX + 256 - 32) * size / 256, y + (this.location.worldY + 256 - 32) * size / 256, 50)
        Renderer.rotate(this.yaw)

        if (renderContext.headBorder) Renderer.drawRect(Renderer.BLACK, -rw/2-1, -rh/2-1, rw+2, rh+2)
        
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

        Tessellator.popMatrix()
        Tessellator.pushMatrix()
    }
}

export default MapPlayer