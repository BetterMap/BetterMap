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


    createRenderContext(x, y, size, headScale = 8) {
        this.lastContext++;
        let contextId = this.lastContext;

        let newContext = new RenderContext(x, y, size, headScale);

        this.renderContexts[contextId] = newContext;

        return contextId
    }

}

export default RenderContextManager