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
import Slider from "../../../guimanager/GuiElement/Slider"
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent"
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow"
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement"
import LocationGui from "./LocationEditGui"
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent"
import SoopyNumber from "../../../guimanager/Classes/SoopyNumber"
import SoopyOpenGuiEvent from "../../../guimanager/EventListener/SoopyOpenGuiEvent"
import { fetch } from "../../Utils/networkUtils"
import NumberTextBox from "../../../guimanager/GuiElement/NumberTextBox"

class SettingGui {
    /**
     * 
     * @param {DungeonMap} fakeDungeon 
     * @param {RenderContext} renderContext 
     * @param {MapRenderer} mapRenderer
     */
    constructor(defaultSettings, fakeDungeon, renderContext, mapRenderer) {
        this.gui = new SoopyGui()
        this.defaultSettings = defaultSettings

        this.gui.setOpenCommand("bettermap")

        this.gui.element.addChild(new SoopyGuiElement().addEvent(new SoopyRenderEvent().setHandler((mouseX, mouseY) => {
            mapRenderer.draw(renderContext, fakeDungeon)

            fakeDungeon.drawRoomTooltip(renderContext, mouseX, mouseY)
        })))

        this.mainSidebar = new SoopyBoxElement().setLocation(0, 0, 0.5, 1)
        this.gui.element.addChild(this.mainSidebar)

        this.changelogData = undefined
        this.mainpage = new SoopyGuiElement().setLocation(0, 0, 1, 1).setScrollable(true)
        this.changelog = new SoopyGuiElement().setLocation(1, 0, 1, 1).setScrollable(true)

        this.mainSidebar.addChild(this.mainpage)
        this.mainSidebar.addChild(this.changelog)

        this.mainpage.addChild(new ButtonWithArrow().setText("§0Changelog").setLocation(0.7, 0, 0.3, 0.05).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.mainpage.location.location.x.set(-1, 250)
            this.changelog.location.location.x.set(0, 250)
        })))

        this.generateChangelog()

        this.y = 0.05

        //TITLE
        this.addSidebarElement(new SoopyTextElement().setText("§0BetterMap Settings").setMaxTextScale(3))

        this.addDropdown("Map Style", {
            "legalmap": "Legal Map",
            "hypixelmap": "Hypixel",
            "teniosmap": "Tenios Map"
        }, "mapStyle", "legalmap")


        //location edit gui
        let editLocationGui = new LocationGui(this.defaultSettings.posX ?? 0, this.defaultSettings.posY ?? 0, (this.defaultSettings.size ?? 150) / 100, () => this.gui.open()).onChange(val => {
            this.changed("posX", val.x)
            this.changed("posY", val.y)
            this.changed("size", val.scale * 100)
        })

        this.addSidebarElement(new ButtonWithArrow().setText("&0Edit Location").addEvent(new SoopyMouseClickEvent().setHandler(() => {
            editLocationGui.editPosition()
        })), 0.3, 0.4, 0.075)

        this.addSidebarElement() //adds 2 gaps (button from above diddnt get one added automatically + seperating setting areas)
        this.addCategory("Style Settings")

        this.addDropdown("Tick Style", {
            "default": "Legal Map",
            "hypixel": "Hypixel",
            "secrets": "Secrets Found"
        }, "tickStyle", this.defaultSettings.tickStyle)


        this.addDropdown("Puzzle Style", {
            "none": "None",
            "text": "Text",
            "icon": "Icon"
        }, "puzzleNames", this.defaultSettings.puzzleNames)

        this.addToggle("Border around heads", "headBorder", this.defaultSettings.headBorder)

        this.addToggle("Player names when holding leaps", "playerNames", this.defaultSettings.playerNames)

        this.addSlider("Head Scale", "headScale", this.defaultSettings.headScale || 8, 2, 15)
        this.addSlider("Icon Scale", "iconScale", this.defaultSettings.iconScale || 8, 2, 15)

        this.addCategory("Secret info Settings")

        this.addDropdown("Score info under map style", {
            "none": "None",
            "legalmap": "LegalMap",
            "simplified": "Simplified"
        }, "scoreInfoUnderMap", this.defaultSettings.scoreInfoUnderMap)

        this.addCategory("Other Settings")

        this.addDropdown("Current room info next to map", {
            "none": "None",
            "left": "Left of map",
            "right": "Right of map"
        }, "currentRoomInfo", this.defaultSettings.currentRoomInfo)

        //END OF SETTINGS

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

            this.updateChangelogtext()

            this.mainpage.location.location.x.set(0)
            this.changelog.location.location.x.set(1)
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

    generateChangelog() {
        fetch("http://soopy.dev/api/bettermap/changelog.json").json((data) => {
            this.changelogData = data.changelog
            this.updateChangelogtext()
        })
    }

    updateChangelogtext() {
        this.changelog.clearChildren()

        //title
        this.changelog.addChild(new SoopyTextElement().setText("§0BetterMap Changelog").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1))

        //back button

        this.changelog.addChild(new ButtonWithArrow().setText("§0Settings").setDirectionRight(false).setLocation(0, 0, 0.3, 0.05).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.mainpage.location.location.x.set(0, 250)
            this.changelog.location.location.x.set(1, 250)
        })))

        if (!this.changelogData) return

        let height = 0.25

        this.changelogData.forEach(data => {
            let changes = new SoopyMarkdownElement().setLocation(0.1, height, 0.8, 0)

            this.changelog.addChild(changes)

            changes.setText("# __" + data.version + "__\n" + data.description)

            height += changes.getHeight()

            height += 0.1
        })
    }

    renderOverlay() {
        if (!this.gui.ctGui.isOpen() && Date.now() - this.lastOpen < 200) {

            this.mapRenderX.set(Renderer.screen.getWidth(), 200)
            this.mainSidebar.location.location.x.set(-0.5, 200)
            this.backgroundOpacity.set(0, 200)

            this.gui._render(-10, -10, 0)
        }
    }

    /**
     * 
     * @param {String} label The text to go to the left of the dropdown
     * @param {Object} options {key:value} where key = setting internal value and value = render text
     * @param {String} setting internal name of the setting to control
     * @param {String} defau Default value
     */
    addDropdown(label, options, setting, defau) {
        this.addSidebarElement(new DropDown().setOptions(options).setSelectedOption(this.defaultSettings[setting] ?? defau).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, val)
        })), 0.5, 0.4, 0.075)

        this.addSidebarElement(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.4)
    }


    /**
     * 
     * @param {String} label The text to go to the left of the dropdown
     * @param {String} setting internal name of the setting to control
     * @param {Boolean} defau Default value
     */
    addToggle(label, setting, defau) {
        this.addSidebarElement(new Toggle().setValue(this.defaultSettings[setting] ?? defau).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, val)
        })), 0.6, 0.2, 0.05)

        this.addSidebarElement(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.4)
    }


    /**
     * 
     * @param {String} label The text to go to the left of the slider
     * @param {String} setting internal name of the setting to control
     * @param {Number} defau Default value
     * @param {Number} min Minimum value
     * @param {Number} max Maximum value
     */
    addSlider(label, setting, defau, min, max) {
        let slider = new Slider().setValue(this.defaultSettings[setting] ?? defau).setMin(min).setMax(max).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, Math.round(val))
            numberT.setText(Math.round(val).toString())
        }))

        let numberT = new NumberTextBox().setText((this.defaultSettings[setting] ?? defau).toString())

        numberT.isNumber = (val) => {
            if (val.includes(".")) return false
            val = "" + val; //coerce num to be a string
            return !isNaN(val) && !isNaN(parseInt(val));
        }

        numberT.text.addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            if (!val) return

            this.changed(setting, parseInt(val))
            slider.setValue(parseInt(val))
        }))

        this.addSidebarElement(slider, 0.5, 0.2, 0.05)
        this.addSidebarElement(numberT, 0.75, 0.1, 0.05)
        this.addSidebarElement(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.4)
    }

    /**
     * 
     * @param {String} label The text/name of the category
     */
    addCategory(label) {
        let elm = new SoopyTextElement().setText("§7" + label).setMaxTextScale(2)
        this.addSidebarElement(elm, 0.1, 0.8, 0.06)
        elm.location.location.y.set(this.y - 0.1 + 0.04)
    }


    addSidebarElement(elm = null, x = 0.1, width = 0.8, height = 0.1) {
        if (elm) this.mainpage.addChild(elm.setLocation(x, this.y + 0.05 - height / 2, width, height))
        if (x === 0.1) this.y += 0.1
    }
}

export default SettingGui