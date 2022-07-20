class RenderContext {

    constructor(x, y, size, headScale = 8) {
        this.posX = x;
        this.posY = y;
        this.size = size;
        this.headScale = headScale;
        this.image = null;
        this.imageLastUpdate = 0;
    }

    destroy() {
        this.image?.getTexture()?.[m.deleteGlTexture]()
        this.image = undefined
    }

    getMapDimensions() {
        return {
            x: this.posX,
            y: this.posY,
            size: this.size,
            headScale: this.headScale
        }
    }
}

export default RenderContext