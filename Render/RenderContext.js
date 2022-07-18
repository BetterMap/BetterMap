class RenderContext {

    constructor(x, y, size, headScale = 8) {
        this.posX = x;
        this.posY = y;
        this.size = size;
        this.headScale = headScale;
        this.image = null;
        this.imageLastUpdate = 0;
        this.lastImage = 0;
    }

    destroy() {
        this.lastImage?.getTexture()?.func_147631_c()//[m.deleteGlTexture]()
        this.image?.getTexture()?.[m.deleteGlTexture]()
        this.lastImage = undefined
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