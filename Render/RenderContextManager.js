import { bmData } from "../Utils/Utils";
import RenderContext from "./RenderContext";

class RenderContextManager {

    constructor() {
        this.renderContexts = [];
        this.lastContext = 0;
        this.currentRenderContextId = 0
    }

    destroy() {
        for (context of this.renderContexts) {
            context?.destroy();
        }
        this.renderContexts = []
    }

    getRenderContextData(contextId) {
        return this.renderContexts[contextId];
    }


    getCurrentRenderContext() {
        return this.getRenderContextData(this.currentRenderContextId)
    }

    /**
     * Updates the current render context with the values from the PogData object.
     */
    updateCurrentRenderContext() {
        let context = this.renderContexts[this.currentRenderContextId+1]
        if (!context) return
        
        context.posX = bmData.map.x
        context.posY = bmData.map.y
        context.size = 150*bmData.map.scale
        context.headScale = bmData.map.headScale
    }

    createRenderContext(x, y, size, headScale = 8) {
        this.lastContext++;
        let contextId = this.lastContext;

        let newContext = new RenderContext(x, y, size, headScale);

        this.renderContexts[contextId] = newContext;

        return contextId
    }

}

export default RenderContextManager