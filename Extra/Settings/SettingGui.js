import SoopyRenderEvent from "../../../guimanager/EventListener/SoopyRenderEvent"
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement"
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement"
import SoopyGui from "../../../guimanager/SoopyGui"
import DungeonMap from "../../Components/DungeonMap"
import MapRenderer from "../../Render/MapRenderer"
import RenderContext from "../../Render/RenderContext"
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement"
import DropDown from "../../../guimanager/GuiElement/Dropdown"
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
        })), 0.4, 0.4, 0.075)
        this.addSidebarElement(new SoopyTextElement().setText("§0Map Style:").setMaxTextScale(2), 0, 0.4)

        this.addSidebarElement()

        this.addSidebarElement(new DropDown().setOptions({
            "default": "Legal Map",
            "hypixel": "Hypixel"
        }).setSelectedOption("default").addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed("tickStyle", val)
        })), 0.4, 0.4, 0.075)
        this.addSidebarElement(new SoopyTextElement().setText("§0Tick Style:").setMaxTextScale(2), 0, 0.4)
    }

    addSidebarElement(elm, x = 0.1, width = 0.8, height = 0.1) {
        if (elm) this.mainSidebar.addChild(elm.setLocation(x + 0.1 - height, this.y, width, height))
        if (x === 0.1) this.y += 0.1
    }
}

export default SettingGui