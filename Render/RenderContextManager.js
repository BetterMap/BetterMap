import RenderContext from "./RenderContext";

class RenderContextManager {

    constructor() {
        /**@type {Map<Number, RenderContext>} */
        this.renderContexts = new Map();
        this.lastContext = 0;
    }

    destroy() {
        for (context of this.renderContexts) {
            context?.destroy();
        }
    }

    getRenderContextData(contextId) {
        return this.renderContexts.get(contextId);
    }

    createRenderContext(settings = {}) {
        this.lastContext++;
        let contextId = this.lastContext;

        let newContext = new RenderContext(settings);

        this.renderContexts.set(contextId, newContext);

        newContext.onDestroy(() => {
            this.renderContexts.delete(contextId)
        })

        return contextId
    }

}

export default RenderContextManager