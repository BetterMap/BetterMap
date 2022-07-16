import SoopyNumber from "../Utils/SoopyNumber"

class MapPlayer {
    /**
     * @param {NetworkPlayerInfo} networkPlayerInfo
     * @param {DungeonMap} dunegonMap
     */
    constructor(networkPlayerInfo, dunegonMap) {
        this.networkPlayerInfo = networkPlayerInfo
        this.dungeonMap = dungeonMap

        this.location = new Location(0, 0)

        this.yaw = 0
        this.username = p[m.getDisplayName.NetworkPlayerInfo]()[m.getUnformattedText]() //TODO: NetworkPlayerInfo may be loaded from tab list -> filter out stuff around tab list name
    }

    /**
     * TODO: Option for black border
     * @param {Number} mapSize 
     * @param {Number} imgSize 
     */
    drawIcon() {
        let { x, y, size, headScale } = dungeonMap.getCurrentRenderContext()

        let rx = -headScale / 2 * size / 100 //offsetting to the left by half image width,
        let ry = -headScale / 2 * size / 100 //image width = headscale* size /100 (size = map size eg 100px, dividing by 100 so its exactly headscale when mapsize is 100)
        let rw = headScale * size / 100
        let rh = headScale * size / 100

        Renderer.translate(x + this.location.renderX * size, y + this.location.renderY * size)
        Renderer.rotate(this.yaw)
        GlStateManager[m.enableBlend]()
        GlStateManager[m.scale](1, 1, 50)
        Client.getMinecraft()[m.getTextureManager]()[m.bindTexture.TextureManager](player.skin)
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