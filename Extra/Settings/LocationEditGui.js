import { SoopyGui } from "../../../guimanager"
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement"
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement"
import BoxWithText from "../../../guimanager/GuiElement/BoxWithText"
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow"
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent"
import NumberTextBox from "../../../guimanager/GuiElement/NumberTextBox"
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent"

class LocationGui {
    constructor(x, y, scale, openParent) {
        this.x = x
        this.y = y
        this.scale = scale

        this.changeEvent = undefined

        let defaultLocation = [10, 10, 1.5]

        this.imageWBase = 100
        this.imageHBase = 100

        this.dragging = false
        this.dragOffset = [0, 0]
        this.resisizing = false
        this.resizePoint = 0
        this.resizeInitialPos = [0, 0, 0, 0, 0, 0]

        this.soopyGui = new SoopyGui()
        this.soopyGui._renderBackground = () => { } // Remove background darkening

        this.elmSettings = new SoopyBoxElement().setLocation(0, 0, 0.25, 0.25)

        let scaleText = new SoopyTextElement().setText("&0Scale: ").setLocation(3, 0.025, 1, 0.15)
        scaleText.location.location.setRelative(false, true)
        scaleText.centeredX = false
        this.elmSettings.addChild(scaleText)

        this.scaleInput = new NumberTextBox().setText(this.scale.toFixed(2)).setLocation(Renderer.getStringWidth("Scale: ") + 3, 0.025, -(Renderer.getStringWidth("Scale: ") + 6), 0.15)
        this.scaleInput.location.location.setRelative(false, true)
        this.scaleInput.location.size.setRelative(false, true)
        this.elmSettings.addChild(this.scaleInput)
        this.scaleInput.text.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun) => {
            try {
                newVal = parseFloat(newVal)
                if (!isNaN(newVal)) {
                    this.scale = newVal
                    this._updateValue()
                }
            } catch (e) { }
        }))
        this.lastScaleRender = this.scale.toFixed(2)

        let xText = new SoopyTextElement().setText("&0X: ").setLocation(3, 0.225, 1, 0.15)
        xText.location.location.setRelative(false, true)
        xText.centeredX = false
        this.elmSettings.addChild(xText)
        this.xInput = new NumberTextBox().setText(this.x.toFixed(0)).setLocation(Renderer.getStringWidth("X: ") + 3, 0.225, -(Renderer.getStringWidth("X: ") + 6), 0.15)
        this.xInput.location.location.setRelative(false, true)
        this.xInput.location.size.setRelative(false, true)
        this.elmSettings.addChild(this.xInput)
        this.xInput.text.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun) => {
            try {
                newVal = parseFloat(newVal)
                if (!isNaN(newVal)) {
                    this.x = newVal
                    this._updateValue()
                }
            } catch (e) { }
        }))
        this.lastXRender = this.x.toFixed(0)

        let yText = new SoopyTextElement().setText("&0Y: ").setLocation(3, 0.425, 1, 0.15)
        yText.location.location.setRelative(false, true)
        yText.centeredX = false
        this.elmSettings.addChild(yText)
        this.yInput = new NumberTextBox().setText(this.y.toFixed(0)).setLocation(Renderer.getStringWidth("Y: ") + 3, 0.425, -(Renderer.getStringWidth("Y: ") + 6), 0.15)
        this.yInput.location.location.setRelative(false, true)
        this.yInput.location.size.setRelative(false, true)
        this.elmSettings.addChild(this.yInput)
        this.yInput.text.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun) => {
            try {
                newVal = parseFloat(newVal)
                if (!isNaN(newVal)) {
                    this.y = newVal
                    this._updateValue()
                }
            } catch (e) { }
        }))
        this.lastYRender = this.y.toFixed(0)

        this.soopyGui.element.addChild(this.elmSettings)

        let button = new ButtonWithArrow().setText("&0Reset").setLocation(0.125, 0.625, 0.75, 0.15)
        button.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.x = defaultLocation[0]
            this.y = defaultLocation[1]
            this.scale = defaultLocation[2]
        }))
        this.elmSettings.addChild(button)

        let button2 = new ButtonWithArrow().setText("&0Back").setLocation(0.125, 0.825, 0.75, 0.15)
        button2.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.soopyGui.close()

            openParent()
        }))
        this.elmSettings.addChild(button2)

        this.editGui = this.soopyGui.ctGui

        this.editGui.registerDraw((mouseX, mouseY, partialTicks) => {
            this.renderGui(mouseX, mouseY)
            this.soopyGui._render(mouseX, mouseY, partialTicks)
        })
        this.editGui.registerClicked((mouseX, mouseY, button) => {
            this.clicked(mouseX, mouseY)
            this.soopyGui._onClick(mouseX, mouseY, button)
        })
        this.editGui.registerMouseReleased((mouseX, mouseY) => {
            this.released(mouseX, mouseY)
        })
    }

    onChange(fun) {
        this.changeEvent = fun
        return this
    }

    _updateValue() {
        // this.setValue([this.x, this.y, this.scale, this.shadowType])
        if (this.changeEvent) {
            this.changeEvent({ x: this.x, y: this.y, scale: this.scale })
        }
    }

    editPosition() {
        this.soopyGui.open()
    }

    clicked(mouseX, mouseY) {
        let width = this.getWidth()
        let height = this.getHeight()

        let locations = [[this.x, this.y], [this.x + width * this.scale, this.y], [this.x, this.y + height * this.scale], [this.x + width * this.scale, this.y + height * this.scale]]

        locations.forEach((loc, i) => {
            if (mouseX >= loc[0] - 1 * Math.max(1, this.scale) && mouseX <= loc[0] + 1 * Math.max(1, this.scale)
                && mouseY >= loc[1] - 1 * Math.max(1, this.scale) && mouseY <= loc[1] + 1 * Math.max(1, this.scale)) {
                this.resisizing = true
                this.resizePoint = i
                this.resizeInitialPos = [mouseX, mouseY, this.x, this.y, width * this.scale, height * this.scale]
            }
        })
        if (this.resisizing) return;

        if (mouseX > this.x && mouseX < this.x + width * this.scale
            && mouseY > this.y && mouseY < this.y + height * this.scale) {
            this.dragging = true;
            this.dragOffset = [this.x - mouseX, this.y - mouseY]
            return true
        }
        return false
    }
    released(mouseX, mouseY) {
        this.updateLocation(mouseX, mouseY)
        this.dragging = false
        this.resisizing = false

        this._updateValue()
    }

    getWidth() {
        return this.imageWBase
    }

    getHeight() {
        return this.imageHBase
    }

    updateLocation(mouseX, mouseY, drawCollidingBox) {
        let width = this.getWidth()
        let height = this.getHeight()

        if (this.dragging) {
            this.x = mouseX + this.dragOffset[0]
            this.y = mouseY + this.dragOffset[1]

        }
        if (this.resisizing) {
            if (this.resizePoint === 3) {
                this.scale = (mouseX - this.x) / width
                this.scale = Math.max(0.25, this.scale)
            }
            if (this.resizePoint === 1) {

                let [oMouseX, oMouseY, oX, oY, ow, oh] = this.resizeInitialPos

                this.scale = (mouseX - this.x) / width
                this.scale = Math.max(0.25, this.scale)
                this.y = oY + oh - height * this.scale
            }
            if (this.resizePoint === 0) {
                let [oMouseX, oMouseY, oX, oY, ow, oh] = this.resizeInitialPos

                this.scale = (oX + ow - mouseX) / width
                this.scale = Math.max(0.25, this.scale)
                this.x = oX + ow - width * this.scale
                this.y = oY + oh - height * this.scale
            }
            if (this.resizePoint === 2) {
                let [oMouseX, oMouseY, oX, oY, ow, oh] = this.resizeInitialPos

                this.scale = (oX + ow - mouseX) / width
                this.scale = Math.max(0.25, this.scale)
                this.x = oX + ow - width * this.scale
            }
        }
    }

    renderGui(mouseX, mouseY) {

        let width = this.getWidth()
        let height = this.getHeight()

        // this.image.draw(this.x, this.y, width * this.scale, height * this.scale)

        this.updateLocation(mouseX, mouseY, true)

        this.renderBox(true)

        if (this.x + width * this.scale / 2 > Renderer.screen.getWidth() / 2) {
            this.elmSettings.location.location.x.set(Math.min(Math.max(this.x / Renderer.screen.getWidth() - 0.25 - 0.03, 0.02), 0.73))
        } else {
            this.elmSettings.location.location.x.set(Math.min(Math.max((this.x + width * this.scale) / Renderer.screen.getWidth() + 0.03, 0.02), 0.73))
        }
        this.elmSettings.location.location.y.set(Math.min(Math.max((this.y + height * this.scale / 2) / Renderer.screen.getHeight() - this.elmSettings.location.size.y.get() / 2, 0.02), 0.73))


        if (this.lastScaleRender !== this.scale.toFixed(2) && !this.scaleInput.text.selected) {
            this.lastScaleRender = this.scale.toFixed(2)
            this.scaleInput.setText(this.scale.toFixed(2))
        }
        if (this.lastXRender !== this.x.toFixed(0) && !this.xInput.text.selected) {
            this.lastXRender = this.x.toFixed(0)
            this.xInput.setText(this.x.toFixed(0))
        }
        if (this.lastYRender !== this.y.toFixed(0) && !this.yInput.text.selected) {
            this.lastYRender = this.y.toFixed(0)
            this.yInput.setText(this.y.toFixed(0))
        }
    }

    renderBox(drawHandles) {
        let width = this.getWidth()
        let height = this.getHeight()

        Renderer.drawRect(Renderer.color(255, 255, 255), this.x, this.y, width * this.scale, 1)
        Renderer.drawRect(Renderer.color(255, 255, 255), this.x, this.y, 1, height * this.scale)
        Renderer.drawRect(Renderer.color(255, 255, 255), this.x, this.y + height * this.scale, width * this.scale, 1)
        Renderer.drawRect(Renderer.color(255, 255, 255), this.x + width * this.scale, this.y, 1, height * this.scale)

        if (drawHandles) {
            Renderer.drawRect(Renderer.color(255, 255, 255), this.x - 1 * Math.max(1, this.scale) + width * this.scale, this.y - 1 * Math.max(1, this.scale), 2 * Math.max(1, this.scale) + 1, 2 * Math.max(1, this.scale) + 1)
            Renderer.drawRect(Renderer.color(255, 255, 255), this.x - 1 * Math.max(1, this.scale), this.y - 1 * Math.max(1, this.scale) + height * this.scale, 2 * Math.max(1, this.scale) + 1, 2 * Math.max(1, this.scale) + 1)
            Renderer.drawRect(Renderer.color(255, 255, 255), this.x - 1 * Math.max(1, this.scale) + width * this.scale, this.y - 1 * Math.max(1, this.scale) + height * this.scale, 2 * Math.max(1, this.scale) + 1, 2 * Math.max(1, this.scale) + 1)
            Renderer.drawRect(Renderer.color(255, 255, 255), this.x - 1 * Math.max(1, this.scale), this.y - 1 * Math.max(1, this.scale), 2 * Math.max(1, this.scale) + 1, 2 * Math.max(1, this.scale) + 1)
        }
    }
}

export default LocationGui