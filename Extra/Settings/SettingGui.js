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
import ColorPicker from "../../../guimanager/GuiElement/ColorPicker"
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent"
import TextWithArrow from "../../../guimanager/GuiElement/TextWithArrow"
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow"
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement"
import LocationGui from "./LocationEditGui"
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent"
import SoopyNumber from "../../../guimanager/Classes/SoopyNumber"
import SoopyOpenGuiEvent from "../../../guimanager/EventListener/SoopyOpenGuiEvent"
import { fetch } from "../../Utils/networkUtils"
import NumberTextBox from "../../../guimanager/GuiElement/NumberTextBox"
import TextBox from "../../../guimanager/GuiElement/TextBox"
import { MESSAGE_PREFIX } from "../../Utils/Utils"
import Notification from "../../../guimanager/Notification"

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
        this.gui.setOpenCommand("bm")

        this.gui.element.addChild(new SoopyGuiElement().addEvent(new SoopyRenderEvent().setHandler((mouseX, mouseY) => {
            mapRenderer.draw(renderContext, fakeDungeon, mouseX, mouseY)
        })))

        this.mainSidebar = new SoopyBoxElement().setLocation(0, 0, 0.5, 1)
        this.gui.element.addChild(this.mainSidebar)

        this.changelogData = undefined
        this.mainpage = new SoopyGuiElement().setLocation(0, 0, 1, 1).setScrollable(true)
        this.changelog = new SoopyGuiElement().setLocation(1, 0, 1, 1).setScrollable(true)
        this.howToUse = new SoopyGuiElement().setLocation(-1, 0, 1, 1).setScrollable(true)

        this.mainSidebar.addChild(this.mainpage)
        this.mainSidebar.addChild(this.changelog)
        this.mainSidebar.addChild(this.howToUse)

        this.y = 0.05

        this.mainpage.addChild(new TextWithArrow().setText("§0Changelog").setLocation(0.675, 0, 0.3, 0.05).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.howToUse.location.location.x.set(-2, 250)
            this.mainpage.location.location.x.set(-1, 250)
            this.changelog.location.location.x.set(0, 250)
        })))
        this.mainpage.addChild(new TextWithArrow().setText("§0How To Use").setLocation(0.025, 0, 0.3, 0.05).setDirectionRight(false).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.howToUse.location.location.x.set(0, 250)
            this.mainpage.location.location.x.set(1, 250)
            this.changelog.location.location.x.set(2, 250)
        })))

        this.howToUse.addChild(new TextWithArrow().setText("§0Settings").setLocation(0.675, 0, 0.3, 0.05).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.howToUse.location.location.x.set(-1, 250)
            this.mainpage.location.location.x.set(0, 250)
            this.changelog.location.location.x.set(1, 250)
        })))

        this.howToUse.addChild(new SoopyTextElement().setText("§0How To Use").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1))
        this.howToUse.addChild(new SoopyMarkdownElement().setText(FileLib.read("BetterMap", "Extra/Settings/HowToUse.md")).setLocation(0.1, 0.2, 0.8, 0))

        // TITLE
        this.addSidebarElement(new SoopyTextElement().setText("§0BetterMap Settings").setMaxTextScale(3))

        this.addToggle("Map enabled", "showMap", this.defaultSettings.showMap)

        this.addDropdown("Map Style", {
            "legalmap": "Legal Map",
            "hypixelmap": "Hypixel",
            "teniosmap": "Tenios Map"
        }, "mapStyle", "legalmap")


        this.addSidebarElement(new ButtonWithArrow().setText("&0Discord").addEvent(new SoopyMouseClickEvent().setHandler(() => {
            java.awt.Desktop.getDesktop().browse(
                new java.net.URI("https://discord.gg/Uq5YzpaMsr")
            );
        })), 0.3, 0.4, 0.075)
        this.addSidebarElement()


        // Location edit gui
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
            "default": "NEU Map",
            "hypixel": "Hypixel",
            "tenios": "tenios",
            "secrets": "Secrets Found (Above head)",
            "secrets_underhead": "Secrets Found (Under head)",
        }, "tickStyle", this.defaultSettings.tickStyle)


        this.addDropdown("Puzzle Style", {
            "none": "None",
            "text": "Text",
            "icon": "Icon"
        }, "puzzleNames", this.defaultSettings.puzzleNames)

        this.addToggle("Border around heads", "headBorder", this.defaultSettings.headBorder)

        this.addDropdown("Player names on map", {
            "never": "Never",
            "leap": "Holding Leaps",
            "always": "Always"
        }, "playerNames", this.defaultSettings.playerNames)

        this.addSlider("Head Scale", "headScale", this.defaultSettings.headScale || 8, 2, 15)
        this.addSlider("Icon Scale", "iconScale", this.defaultSettings.iconScale || 10, 2, 15)

        this.addColorSelector("Border Color", "borderColor", this.defaultSettings.borderColor)
        this.addColorSelector("Map Color", "mapBackgroundColor", this.defaultSettings.mapBackgroundColor)
        this.addColorSelector("Extra Info Color", "extraInfoBackroundColor", this.defaultSettings.extraInfoBackroundColor)

        this.addCategory("Secret info Settings")

        this.addDropdown("Score info under map style", {
            "none": "None",
            "legalmap": "LegalMap",
            "simplified": "Simplified"
        }, "scoreInfoUnderMap", this.defaultSettings.scoreInfoUnderMap)

        this.addCategory("Tab Info")

        this.addToggle("Show current Secret total", "tabSecretCount", this.defaultSettings.tabSecretCount)[1].setLore(["Change the secrets found number in tab to also show total secrets in dungeon"])

        this.addToggle("Show current Crypt total", "tabCryptCount", this.defaultSettings.tabCryptCount)[1].setLore(["Change the crypts found number in tab to also show total crypts in dungeon"])

        this.addToggle("Show Mimic Status", "tabMimic", this.defaultSettings.tabMimic)[1].setLore(["Add a line to tab displaying wether the minic has been killed"])

        this.addToggle("Fix Score in Scoreboard", "fixScore", this.defaultSettings.fixScore)[1].setLore(["Replaces the score in the Sidebar-Scoreboard with the correct score"])

        this.addCategory("Other Settings")

        this.addToggle("Hide map in Boss", "hideInBoss", this.defaultSettings.hideInBoss)
        this.addToggle("Show tabs on map", "showTabs", this.defaultSettings.showTabs)[1].setLore(["Shows tabs at the top of the map that can be clicked", "eg to look at the dungeon map when in boss"])

        this.addDropdown("Current room info next to map", {
            "none": "None",
            "left": "Left of map",
            "right": "Right of map"
        }, "currentRoomInfo", this.defaultSettings.currentRoomInfo)[1].setLore(["Shows the same info that would be shown when hovering over a room"])

        this.addToggle("Force paul +10 score", "forcePaul", this.defaultSettings.forcePaul)[1].setLore(["Paul score bonus will get auto-detected when paul is mayor", "But it wont be auto detected from jerry-paul"])

        this.addToggle("Dungeon clear breakdown", "clearedRoomInfo", this.defaultSettings.clearedRoomInfo)[1].setLore(["Shows the cleared room count and specific rooms in chat when the dungeon ends"])

        this.addToggle("Show secret waypoints (scuffed)", "showSecrets", this.defaultSettings.showSecrets)[1].setLore(["Syncs between bettermap users"])

        this.addToggle("Spirit leap overlay", "spiritLeapOverlay", this.defaultSettings.spiritLeapOverlay)[1].setLore(["You can click on player heads in overlay!", "Most people probs wont like the design though."])

        this.addSidebarElement(new ButtonWithArrow().setText("&0Load api key from other mods").addEvent(new SoopyMouseClickEvent().setHandler(() => {
            findKey(key => {
                this.setApiKey(key)
            })
        })), 0.3, 0.4, 0.075)
        this.addSidebarElement() //adds a gap because the button diddnt auto add one

        this.apiKeySetting = this.addString("Api key", "apiKey", this.defaultSettings.apiKey)[0]

        this.addToggle("Show dev info", "devInfo", this.defaultSettings.devInfo)

        // END OF SETTINGS

        // ANIMATIONS!!!!
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

            this.howToUse.location.location.x.set(-1, 0)
            this.mainpage.location.location.x.set(0, 0)
            this.changelog.location.location.x.set(1, 0)
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

        register("chat", (key, event) => { //Api key detection
            ChatLib.chat(MESSAGE_PREFIX + "Copied api key!")

            this.setApiKey(key)
        }).setChatCriteria("&aYour new API key is &r&b${key}&r")

        this.generateChangelog()
    }

    setApiKey(key) {
        this.apiKeySetting.setText(key)

        this.changed("apiKey", key)
    }

    generateChangelog() {
        let data = FileLib.read("BetterMap", "Extra/Settings/Changelog.md")

        let lines = data.split("\n");

        let currData = {
            version: "",
            description: ""
        }

        let changelog = []

        lines.forEach(line => {
            if (line.startsWith("@ver ")) {
                if (currData.version) {
                    currData.description = currData.description.trim();

                    changelog.push(currData);

                    if (changelog.length > 100) changelog.shift()

                    currData = {
                        version: "",
                        description: ""
                    }
                }
                currData.version = line.substring(5);
            } else {
                currData.description += line + "\n";
            }
        })

        currData.description = currData.description.trim();

        changelog.push(currData);
        if (changelog.length > 100) changelog.shift()

        changelog.reverse()
        this.changelogData = changelog
        this.updateChangelogtext()
    }

    updateChangelogtext() {
        this.changelog.clearChildren()

        // Title
        this.changelog.addChild(new SoopyTextElement().setText("§0BetterMap Changelog").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1))

        // Back button

        this.changelog.addChild(new TextWithArrow().setText("§0Settings").setDirectionRight(false).setLocation(0.025, 0, 0.3, 0.05).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.howToUse.location.location.x.set(-1, 250)
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
        let drop = this.addSidebarElement(new DropDown().setOptions(options).setSelectedOption(this.defaultSettings[setting] ?? defau).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, val)
        })), 0.55, 0.35, 0.075)

        return [drop, this.addSidebarElement(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    }


    /**
     * 
     * @param {String} label The text to go to the left of the dropdown
     * @param {String} setting internal name of the setting to control
     * @param {Boolean} defau Default value
     */
    addToggle(label, setting, defau) {
        let toggle = this.addSidebarElement(new Toggle().setValue(this.defaultSettings[setting] ?? defau).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, val)
        })), 0.625, 0.2, 0.05)

        return [toggle, this.addSidebarElement(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    }

    /**
     * @param {String} label The text to go to the left of the dropdown
     * @param {String} setting internal name of the setting to control
     * @param {String} defau Default value
     */
    addString(label, setting, defau) {
        let textBox = this.addSidebarElement(new TextBox().setText(this.defaultSettings[setting] ?? defau).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, val)
        })), 0.625, 0.2, 0.05)

        return [textBox, this.addSidebarElement(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    }

    /**
     * 
     * @param {String} label The text to go to the left of the slider
     * @param {String} setting internal name of the setting to control
     * @param {Object[]} defau Default value
     */
    addColorSelector(label, setting, defau) {

        let colorPicker = new ColorPicker().setRGBColor(this.defaultSettings[setting][0] ?? defau[0], this.defaultSettings[setting][1] ?? defau[1], this.defaultSettings[setting][2] ?? defau[2]).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changedArr(setting, 0, val[0])
            this.changedArr(setting, 1, val[1])
            this.changedArr(setting, 2, val[2])
        }))

        // Slider 3
        let slider3 = new Slider().setValue(this.defaultSettings[setting][3] ?? defau[3]).setMin(0).setMax(255).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changedArr(setting, 3, Math.round(val))
            numberT3.setText(Math.round(val).toString())
        }))

        let numberT3 = new NumberTextBox().setText((this.defaultSettings[setting][3] ?? defau[3]).toString())

        numberT3.isNumber = isNumber

        numberT3.text.addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            if (!val) return

            this.changedArr(setting, 3, parseInt(val))
            slider3.setValue(parseInt(val))
        }))

        this.addSidebarElement(colorPicker, 0.5, 0.1, 0.05)

        this.addSidebarElement(slider3, 0.6, 0.2, 0.05).setLore(["opacity"])
        this.addSidebarElement(numberT3, 0.8, 0.1, 0.05).setLore(["opacity"])

        return [[], this.addSidebarElement(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
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

        this.addSidebarElement(slider, 0.55, 0.2, 0.05)
        this.addSidebarElement(numberT, 0.8, 0.1, 0.05)
        return [[slider, numberT], this.addSidebarElement(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    } //Cinda scuffed its a different return type, but trying to keep atleast semi-consistant

    /**
     * 
     * @param {String} label The text/name of the category
     */
    addCategory(label) {
        let elm = new SoopyTextElement().setText("§7" + label).setMaxTextScale(2)
        this.addSidebarElement(elm, 0.1, 0.8, 0.06)
        elm.location.location.y.set(this.y - 0.1 + 0.04)
        return elm
    }


    /**
     * @param {Object} elm The element being added
     * @param {Number} x the x pos
     * @param {Number} width The width of the elm
     * @param {Number} height The height of the elm
     * @returns {Object} elm
     */
    addSidebarElement(elm = null, x = 0.1, width = 0.8, height = 0.1) {
        if (elm) this.mainpage.addChild(elm.setLocation(x, this.y + 0.05 - height / 2, width, height))
        if (x === 0.1) this.y += 0.1
        return elm
    }
}

export default SettingGui


function verifyApiKeySync(key) {
    if (key) {
        try {
            var url = "https://api.hypixel.net/key?key=" + key
            let data = fetch(url).json()

            return !!data.success
        } catch (e) {
            return false
        }
    } else {
        return false
    }
}

const JavaString = Java.type("java.lang.String")
const JavaLong = Java.type("java.lang.Long")
const Files = Java.type("java.nio.file.Files")
const Paths = Java.type("java.nio.file.Paths")
/**
 * NOTE: this will display a notification with key finding information
 */
function findKey(callback = () => { }) {
    new Thread(() => {

        //       NEU
        try {
            let testKey = JSON.parse(new JavaString(Files.readAllBytes(Paths.get("./config/notenoughupdates/configNew.json")))).apiKey.apiKey
            if (testKey) {
                if (verifyApiKeySync(testKey)) {
                    new Notification("§aSuccess!", ["Found api key in NotEnoughUpdates!"])
                    callback(testKey)
                    return;
                } else {
                    console.log("[BETERMAP] Found invalid key in NotEnoughUpdates")
                }
            }
        } catch (_) { }

        //       SBE
        try {
            let testKey = JSON.parse(new JavaString(Files.readAllBytes(Paths.get("./config/SkyblockExtras.cfg")))).values.apiKey
            if (testKey) {
                if (verifyApiKeySync(testKey)) {
                    new Notification("§aSuccess!", ["Found api key in SkyblockExtras!"])
                    callback(testKey)
                    return;
                } else {
                    console.log("[BETERMAP] Found invalid key in SkyblockExtras")
                }
            }
        } catch (_) { }
        //       SKYTILS
        try {
            let testKey2 = new JavaString(Files.readAllBytes(Paths.get("./config/skytils/config.toml")))
            let testKey = undefined
            testKey2.split("\n").forEach(line => {
                if (line.startsWith("		hypixel_api_key = \"")) {
                    testKey = line.split("\"")[1]
                }
            })
            if (testKey) {
                if (verifyApiKeySync(testKey)) {
                    new Notification("§aSuccess!", ["Found api key in Skytils!"])
                    callback(testKey)
                    return;
                } else {
                    console.log("[BETERMAP] Found invalid key in Skytils")
                }
            }
        } catch (_) { }

        //       SOOPYADDONS DATA
        try {
            let testKey = FileLib.read("soopyAddonsData", "apikey.txt")
            if (testKey) {
                if (verifyApiKeySync(testKey)) {
                    new Notification("§aSuccess!", ["Found api key in old soopyaddons version!"])
                    callback(testKey)
                    return;
                } else {
                    console.log("[BETERMAP] Found invalid key in soopyaddonsData")
                }
            }
        } catch (_) { }

        //       SOOPYV2
        try {
            let testKey = JSON.parse(FileLib.read("soopyAddonsData", "soopyaddonsbetafeaturesdata.json")).globalSettings.subSettings.api_key.value
            if (testKey) {
                if (verifyApiKeySync(testKey)) {
                    new Notification("§aSuccess!", ["Found api key in old soopyaddons version!"])
                    callback(testKey)
                    return;
                } else {
                    console.log("[BETERMAP] Found invalid key in soopyaddonsData")
                }
            }
        } catch (_) { }

        //       HypixelApiKeyManager
        try {
            let testKey = JSON.parse(FileLib.read("HypixelApiKeyManager", "localdata.json")).key
            if (testKey) {
                if (verifyApiKeySync(testKey)) {
                    new Notification("§aSuccess!", ["Found api key in HypixelApiKeyManager!"])
                    callback(testKey)
                    return;
                } else {
                    console.log("[BETERMAP] Found invalid key in HypixelApiKeyManager")
                }
            }
        } catch (_) { }


        new Notification("§cUnable to find api key", [])
    }).start()
}

function isNumber(val) {
    if (val.includes(".")) return false
    val = "" + val; //coerce num to be a string
    return !isNaN(val) && !isNaN(parseInt(val));
}