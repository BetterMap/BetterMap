import SoopyRenderEvent from "../../../guimanager/EventListener/SoopyRenderEvent"
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement"
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement"
import SoopyGui from "../../../guimanager/SoopyGui"
import DungeonMap from "../../Components/DungeonMap"
import MapRenderer from "../../Render/MapRenderer"
import RenderContext from "../../Render/RenderContext"
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement"
import DropDown from "../../../guimanager/GuiElement/Dropdown"
import Toggle from "../../../guimanager/GuiElement/Toggle"
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent"
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow"
import LocationGui from "./LocationEditGui"
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent"
import SoopyNumber from "../../../guimanager/Classes/SoopyNumber"
import SoopyOpenGuiEvent from "../../../guimanager/EventListener/SoopyOpenGuiEvent"

class SettingGui {
    /**
     * 
     * @param {DungeonMap} fakeDungeon 
     * @param {RenderContext} renderContext 
     * @param {MapRenderer} mapRenderer
     */
    constructor(defaultSettings, fakeDungeon, renderContext, mapRenderer) {
        this.gui = new SoopyGui()

        this.gui.setOpenCommand("bettermap")

        this.gui.element.addChild(new SoopyGuiElement().addEvent(new SoopyRenderEvent().setHandler((mouseX, mouseY) => {
            mapRenderer.draw(renderContext, fakeDungeon)

            fakeDungeon.drawRoomTooltip(renderContext, mouseX, mouseY)
        })))

        this.mainSidebar = new SoopyBoxElement().setLocation(0, 0, 0.5, 1).setScrollable(true)
        this.gui.element.addChild(this.mainSidebar)

        this.y = 0

        //TITLE
        this.addSidebarElement(new SoopyTextElement().setText("§0BetterMap Settings").setMaxTextScale(3))

        this.addSidebarElement(new DropDown().setOptions({
            "legalmap": "Legal Map",
            "hypixelmap": "Hypixel",
            "teniosmap": "Tenios Map"
        }).setSelectedOption(defaultSettings.mapStyle ?? "legalmap").addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("mapStyle", val)
        })), 0.5, 0.4, 0.075)
        this.addSidebarElement(new SoopyTextElement().setText("§0Map Style:").setMaxTextScale(2), 0.1, 0.4)

        let editLocationGui = new LocationGui(defaultSettings.posX ?? 0, defaultSettings.posY ?? 0, (defaultSettings.size ?? 150) / 100, () => this.gui.open()).onChange(val => {
            this.changed("posX", val.x)
            this.changed("posY", val.y)
            this.changed("size", val.scale * 100)
        })

        this.addSidebarElement(new ButtonWithArrow().setText("&0Edit Location").addEvent(new SoopyMouseClickEvent().setHandler(() => {
            editLocationGui.editPosition()
        })), 0.3, 0.4, 0.075)

        this.addSidebarElement()
        this.addSidebarElement()

        this.addSidebarElement(new DropDown().setOptions({
            "default": "Legal Map",
            "hypixel": "Hypixel",
            "secrets": "Secrets Found"
        }).setSelectedOption(defaultSettings.tickStyle ?? "default").addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("tickStyle", val)
        })), 0.5, 0.4, 0.075)
        this.addSidebarElement(new SoopyTextElement().setText("§0Tick Style:").setMaxTextScale(2), 0.1, 0.4)

        this.addSidebarElement(new DropDown().setOptions({
            "none": "None",
            "text": "Text",
            "icon": "Icon"
        }).setSelectedOption(defaultSettings.puzzleNames ?? "text").addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("puzzleNames", val)
        })), 0.5, 0.4, 0.075)
        this.addSidebarElement(new SoopyTextElement().setText("§0Puzzle Style:").setMaxTextScale(2), 0.1, 0.4)

        this.addSidebarElement(new Toggle().setValue(defaultSettings.headBorder ?? true).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("headBorder", val)
        })), 0.6, 0.2, 0.05)
        this.addSidebarElement(new SoopyTextElement().setText("§0Border around heads:").setMaxTextScale(2), 0.1, 0.4)

        this.addSidebarElement(new Toggle().setValue(defaultSettings.playerNames ?? true).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("playerNames", val)
        })), 0.6, 0.2, 0.05)
        this.addSidebarElement(new SoopyTextElement().setText("§0Player names when holding leap:").setMaxTextScale(2), 0.1, 0.4)

        
        //ANIMATIONS!!!!
        this.lastOpen = 0
        this.mapRenderX = new SoopyNumber(Renderer.screen.getWidth())
        this.gui.element.addEvent(new SoopyOpenGuiEvent().setHandler(() => {
            let settingX = Renderer.screen.getWidth() / 2 + Renderer.screen.getWidth() / 10

            this.mapRenderX.set(Renderer.screen.getWidth(), 0)
            this.mapRenderX.set(settingX, 200)
            renderContext.settings.posX = Renderer.screen.getWidth()

            this.mainSidebar.location.location.x.set(-0.5, 0)
            this.mainSidebar.location.location.x.set(0, 200)

            this.backgroundOpacity.set(0, 0)
            this.backgroundOpacity.set(100, 200)
        }))

        this.gui.element.addEvent(new SoopyRenderEvent().setHandler(() => {
            let settingX = Renderer.screen.getWidth() / 2 + Renderer.screen.getWidth() / 10
            let settingSize = Renderer.screen.getWidth() - (Renderer.screen.getWidth() / 2 + Renderer.screen.getWidth() / 5)
            let settingY = Renderer.screen.getHeight() / 2 - settingSize / 2

            if (this.gui.ctGui.isOpen()) {
                this.lastOpen = Date.now()
                this.mapRenderX.set(settingX, 200)
            }

            renderContext.settings.posX = this.mapRenderX.get()
            renderContext.settings.posY = settingY
            renderContext.settings.size = settingSize
        }))

        this.backgroundOpacity = new SoopyNumber(0)

        this.gui._renderBackground = () => {
            Renderer.drawRect(Renderer.color(0, 0, 0, this.backgroundOpacity.get()), 0, 0, Renderer.screen.getWidth(), Renderer.screen.getHeight())
        }
    }

    renderOverlay() {
        if (!this.gui.ctGui.isOpen() && Date.now() - this.lastOpen < 200) {

            this.mapRenderX.set(Renderer.screen.getWidth(), 200)
            this.mainSidebar.location.location.x.set(-0.5, 200)
            this.backgroundOpacity.set(0, 200)

            this.gui._render(-10, -10, 0)
        }
    }

    addSidebarElement(elm = null, x = 0.1, width = 0.8, height = 0.1) {
        if (elm) this.mainSidebar.addChild(elm.setLocation(x, this.y + 0.05 - height / 2, width, height))
        if (x === 0.1) this.y += 0.1
    }
}

export default SettingGui