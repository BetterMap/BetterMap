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

    /**
     * @param {Number} contextId 
     * @returns {RenderContext}
     */
    getRenderContextData(contextId) {
        return this.renderContexts[contextId];
    }

    /**
     * Creates a render context with the given settings
     * @param {*} settings 
     * @returns 
     */
    createRenderContext(settings) {
        this.lastContext++;
        let contextId = this.lastContext;

        let newContext = new RenderContext(settings);

        this.renderContexts[contextId] = newContext;

        return contextId
    }

}

export default RenderContextManager