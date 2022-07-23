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

class SettingGui {
    /**
     * 
     * @param {DungeonMap} fakeDungeon 
     * @param {RenderContext} renderContext 
     * @param {MapRenderer} mapRenderer
     */
    constructor(fakeDungeon, renderContext, mapRenderer) {
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
        }).setSelectedOption("legalmap").addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("mapStyle", val)
        })), 0.5, 0.4, 0.075)
        this.addSidebarElement(new SoopyTextElement().setText("§0Map Style:").setMaxTextScale(2), 0.1, 0.4)

        this.addSidebarElement()

        this.addSidebarElement(new DropDown().setOptions({
            "default": "Legal Map",
            "hypixel": "Hypixel",
            "secrets": "Secrets Found"
        }).setSelectedOption("default").addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("tickStyle", val)
        })), 0.5, 0.4, 0.075)
        this.addSidebarElement(new SoopyTextElement().setText("§0Tick Style:").setMaxTextScale(2), 0.1, 0.4)

        this.addSidebarElement(new DropDown().setOptions({
            "none": "None",
            "text": "Text",
            "icon": "Icon"
        }).setSelectedOption("text").addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("puzzleNames", val)
        })), 0.5, 0.4, 0.075)
        this.addSidebarElement(new SoopyTextElement().setText("§0Puzzle Style:").setMaxTextScale(2), 0.1, 0.4)

        this.addSidebarElement(new Toggle().addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("headBorder", val)
        })), 0.6, 0.2, 0.05)
        this.addSidebarElement(new SoopyTextElement().setText("§0Border around heads:").setMaxTextScale(2), 0.1, 0.4)

        this.addSidebarElement(new Toggle().addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("playerNames", val)
        })), 0.6, 0.2, 0.05)
        this.addSidebarElement(new SoopyTextElement().setText("§0Player names when holding leap:").setMaxTextScale(2), 0.1, 0.4)
    }

    addSidebarElement(elm = null, x = 0.1, width = 0.8, height = 0.1) {
        if (elm) this.mainSidebar.addChild(elm.setLocation(x, this.y + 0.05 - height / 2, width, height))
        if (x === 0.1) this.y += 0.1
    }
}

export default SettingGui