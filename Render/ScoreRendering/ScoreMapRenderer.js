
const { default: MapTab } = require("../MapTab");

class ScoreMapRenderer extends MapTab {
    constructor(mapRenderer) {
        super("Score", mapRenderer)
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     * @param {Number} mouseX
     * @param {Number} mouseY
     */
    draw(renderContext, dungeonMap, mouseX, mouseY) {

        let mapData // Get map data from hotbar
        try {
            let item = Player.getInventory().getStackInSlot(8)
            //                      .getMapData
            mapData = item.getItem().func_77873_a(item.getItemStack(), World.getWorld()); // ItemStack.getItem().getMapData()
        } catch (error) {
        }

        if (!mapData) return

        // Render map directly from hotbar

        let { x, y, size } = renderContext.getMapDimensions()

        GlStateManager.func_179094_E(); // GlStateManager.push()
        Renderer.translate(x + renderContext.borderWidth, y + renderContext.borderWidth, 1)
        GlStateManager.func_179152_a((size - 2 * renderContext.borderWidth) / 128, (size - renderContext.borderWidth) / 128, 1); // GlStateManager.scale()
        GlStateManager.func_179131_c(1.0, 1.0, 1.0, 1.0); // GlStateManager.color()
        Client.getMinecraft().field_71460_t.func_147701_i().func_148250_a(mapData, true);
        GlStateManager.func_179121_F(); // GlStateManager.pop()
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     */
    shouldShowTab(renderContext, dungeonMap) {
        return dungeonMap.dungeonFinished
    }
}

export default ScoreMapRenderer