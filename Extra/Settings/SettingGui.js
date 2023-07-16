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
import BoxWithGear from "../../../guimanager/GuiElement/BoxWithGear"
import { MESSAGE_PREFIX } from "../../Utils/Utils"
import Notification from "../../../guimanager/Notification"
import PasswordInput from "../../../guimanager/GuiElement/PasswordInput"
import settings from "./CurrentSettings"

class SettingGui {
    /**
     * @param {import("../../Render/RenderContext").ContextSettings} currentSettings
     * @param {DungeonMap} fakeDungeon 
     * @param {RenderContext} renderContext 
     * @param {MapRenderer} mapRenderer
     */
    constructor(currentSettings, fakeDungeon, renderContext, mapRenderer) {
        this.gui = new SoopyGui()
        this.currentSettings = currentSettings

        this.addSidebarElement = this.addSidebarElement.bind(this) //BatChamp I LOVE JS this. CONTEXT!@

        this.gui.setOpenCommand("bettermap")
        this.gui.setOpenCommand("bm")

        this.gui.element.addChild(new SoopyGuiElement().addEvent(new SoopyRenderEvent().setHandler((mouseX, mouseY) => {
            try {
                mapRenderer.draw(renderContext, fakeDungeon, mouseX, mouseY)
            } catch (e) {
                console.error("BROKE RENDERING DUNGEON MAP PREVIEW!!!") //Incase we break rendering for some obscure combination of settings the user can still change them back
                console.log(JSON.stringify(e, undefined, 2))
            }
        })))

        this.mainSidebar = new SoopyBoxElement().setLocation(0, 0, 0.5, 1)
        this.gui.element.addChild(this.mainSidebar)

        this.changelogData = undefined
        this.mainpage = new SoopyGuiElement().setLocation(0, 0, 1, 1).setScrollable(true)
        this.changelog = new SoopyGuiElement().setLocation(1, 0, 1, 1).setScrollable(true)
        this.moreSettingsPage = new SoopyGuiElement().setLocation(1, 0, 1, 1)
        this.howToUse = new SoopyGuiElement().setLocation(-1, 0, 1, 1).setScrollable(true)

        this.mainSidebar.addChild(this.mainpage)
        this.mainSidebar.addChild(this.changelog)
        this.mainSidebar.addChild(this.moreSettingsPage)
        this.mainSidebar.addChild(this.howToUse)

        this.onSettingChangeFunctions = []

        this.closeMoreSettingsGui = () => { }

        this.y = 0.05

        this.changelogButton = new TextWithArrow().setText("§0Changelog").setLocation(0.675, 0, 0.3, 0.05).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.howToUse.location.location.x.set(-2, 250)
            this.mainpage.location.location.x.set(-1, 250)
            this.changelog.location.location.x.set(0, 250)

            this.generateChangelog()
        }))
        this.mainpage.addChild(this.changelogButton)

        this.howToUseButton = new TextWithArrow().setText("§0How To Use").setLocation(0.025, 0, 0.3, 0.05).setDirectionRight(false).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.howToUse.location.location.x.set(0, 250)
            this.mainpage.location.location.x.set(1, 250)
            this.changelog.location.location.x.set(2, 250)
        }))
        this.mainpage.addChild(this.howToUseButton)

        this.settingsPageButton = new TextWithArrow().setText("§0Settings").setLocation(0.025, 0, 0.3, 0.05).setDirectionRight(false).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.closeMoreSettingsGui()
        }))
        this.moreSettingsPage.addChild(this.settingsPageButton)

        this.howToUse.addChild(new TextWithArrow().setText("§0Settings").setLocation(0.675, 0, 0.3, 0.05).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.howToUse.location.location.x.set(-1, 250)
            this.mainpage.location.location.x.set(0, 250)
            this.changelog.location.location.x.set(1, 250)
        })))

        this.howToUse.addChild(new SoopyTextElement().setText("§0How To Use").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1))
        this.howToUse.addChild(new SoopyMarkdownElement().setText(FileLib.read("BetterMap", "Extra/Settings/HowToUse.md")).setLocation(0.1, 0.2, 0.8, 0))

        // TITLE
        this.addSidebarElement(new SoopyTextElement().setText("§0BetterMap Settings").setMaxTextScale(3))

        this.addToggle("Map enabled", "showMap", this.currentSettings.showMap)

        this.addDropdown("Map Style", {
            "legalmap": "Legal Map",
            "hypixelmap": "Hypixel",
            "teniosmap": "Tenios Map",
            "custom": "Make your own"
        }, "mapStyle", "legalmap")

        this.addGear(() => {
            return this.currentSettings.mapStyle === "custom"
        }, (elm) => {

            elm.addSidebarElement(new ButtonWithArrow().setText("&0Reset to default").addEvent(new SoopyMouseClickEvent().setHandler(() => {
                this.changed("customRoomColorNormal", [114, 67, 27, 255])
                this.changed("customRoomColorMini", [114, 67, 27, 255])
                this.changed("customRoomColorRare", [114, 67, 27, 255])
                this.changed("customRoomColorFairy", [239, 126, 163, 255])
                this.changed("customRoomColorBlood", [255, 0, 0, 255])
                this.changed("customRoomColorTrap", [213, 126, 50, 255])
                this.changed("customRoomColorSpawn", [0, 123, 0, 255])
                this.changed("customRoomColorGold", [226, 226, 50, 255])
                this.changed("customRoomColorPuzzle", [176, 75, 213, 255])
                this.changed("customRoomColorUnknown", [64, 64, 64, 255])
                this.changed("customRoomColorWitherDoor", [0, 0, 0, 255])
                this.changed("customRoomGapSize", 9)
                this.changed("customDoorSize", 15)
            })), 0.3, 0.4, 0.075)
            elm.addSidebarElement()

            elm.addColorSelector("Normal Mob Room Color", "customRoomColorNormal", this.currentSettings.customRoomColorNormal)
            elm.addColorSelector("Miniboss Mob Room Color", "customRoomColorMini", this.currentSettings.customRoomColorMini)
            elm.addColorSelector("Rare 1x1 Room Color", "customRoomColorRare", this.currentSettings.customRoomColorRare)
            elm.addColorSelector("Fairy Room Color", "customRoomColorFairy", this.currentSettings.customRoomColorFairy)
            elm.addColorSelector("Blood Room Color", "customRoomColorBlood", this.currentSettings.customRoomColorBlood)
            elm.addColorSelector("Trap Room Color", "customRoomColorTrap", this.currentSettings.customRoomColorTrap)
            elm.addColorSelector("Spawn Room Color", "customRoomColorSpawn", this.currentSettings.customRoomColorSpawn)
            elm.addColorSelector("Gold Miniboss Room Color", "customRoomColorGold", this.currentSettings.customRoomColorGold)
            elm.addColorSelector("Puzzle Room Color", "customRoomColorPuzzle", this.currentSettings.customRoomColorPuzzle)
            elm.addColorSelector("Unknown Room Color", "customRoomColorUnknown", this.currentSettings.customRoomColorUnknown)
            elm.addColorSelector("Wither Door Color", "customRoomColorWitherDoor", this.currentSettings.customRoomColorWitherDoor)
            elm.addSlider("Gap Size", "customRoomGapSize", this.currentSettings.customRoomGapSize || 5, 2, 36)
            elm.addSlider("Door Width", "customDoorSize", this.currentSettings.customDoorWidth || 5, 2, 36)
        })

        this.addSidebarElement(new ButtonWithArrow().setText("&0Discord").addEvent(new SoopyMouseClickEvent().setHandler(() => {
            java.awt.Desktop.getDesktop().browse(
                new java.net.URI("https://discord.gg/Uq5YzpaMsr")
            );
        })), 0.3, 0.4, 0.075)
        this.addSidebarElement()


        // Location edit gui
        let editLocationGui = new LocationGui(this.currentSettings.posX ?? 0, this.currentSettings.posY ?? 0, (this.currentSettings.size ?? 150) / 100, () => this.gui.open()).onChange(val => {
            this.changed("posX", val.x)
            this.changed("posY", val.y)
            this.changed("size", val.scale * 100)
        })

        this.addSidebarElement(new ButtonWithArrow().setText("&0Edit Location").addEvent(new SoopyMouseClickEvent().setHandler(() => {
            editLocationGui.editPosition()
        })), 0.3, 0.4, 0.075)

        this.addSidebarElement() // Adds 2 gaps (button from above diddnt get one added automatically + seperating setting areas)
        this.addCategory("Style Settings")

        if (this.currentSettings.tickStyle === "secrets_underhead") {
            this.currentSettings.tickStyle = "secrets"
            this.currentSettings.tickStyle_secrets_overHead = false
            Client.scheduleTask(10, () => {
                this.changed("tickStyle", "secrets")
                this.changed("tickStyle_secrets_overHead", false)
            })
        }
        this.addDropdown("Tick Style", {
            "default": "NEU Map",
            "hypixel-old": "Hypixel (old)",
            "hypixel-new": "Hypixel (new)",
            "tenios": "tenios",
            "roomnames": "Roomname",
        }, "tickStyle", this.currentSettings.tickStyle)

        this.addGear(() => {
            return true;
        }, (elm) => {
            elm.addToggle("Center Checkmarks", "centerCheckmarks", this.currentSettings.centerCheckmarks)
            if (this.currentSettings.tickStyle === "roomnames")
                elm.addToggle("Show room names over player heads", "tickStyle_secrets_overHead", this.currentSettings.tickStyle_secrets_overHead)
        })

        this.addDropdown("Secret Count instead of Checkmarks", {
            "never": "Never",
            "hasSecrets": "Rooms with Secrets",
            "always": "Always"
        }, "showSecretCount", this.currentSettings.showSecretCount)

        this.addGear(() => {
            return this.currentSettings.showSecretCount !== "never"
        }, (elm) => {
            elm.addToggle("Use Checkmarks for fully cleared Rooms", "checkmarkCompleteRooms", this.currentSettings.checkmarkCompleteRooms)
            elm.addToggle("Show secret count over player heads", "tickStyle_secrets_overHead", this.currentSettings.tickStyle_secrets_overHead)
        })

        this.addDropdown("Puzzle Style", {
            "none": "None",
            "text": "Text",
            "icon": "Icon"
        }, "puzzleNames", this.currentSettings.puzzleNames)

        this.addGear(() => {
            return this.currentSettings.puzzleNames === "text"
        }, (elm) => {
            elm.addToggle("Show puzzle name over player heads", "tickStyle_secrets_overHead", this.currentSettings.tickStyle_secrets_overHead)
        })

        // This.addToggle("Border around heads", "headBorder", this.defaultSettings.headBorder)
        Client.scheduleTask(0.5 * 20, () => {
            if (typeof renderContext.settings.headBorder === "boolean") {
                if (renderContext.settings.headBorder)
                    this.changed("headBorder", "single")
                else
                    this.changed("headBorder", "none")
            }
        })

        this.addDropdown("Player Heads", {
            "off": "None",
            "icons": "Arrows",
            "self-icon": "Use Arrow for own Head",
            "heads": "Heads"
        }, "showHeads", this.currentSettings.showHeads);

        this.addGear(() => {
            return this.currentSettings.showHeads != 'off'
        }, (elm) => {

            elm.addSlider("Head Scale", "headScale", this.currentSettings.headScale || 8, 2, 15)

            if (this.currentSettings.showHeads === "icons") return this.currentSettings.headBorder

            elm.addDropdown("Border around heads", {
                "none": "None",
                "single": "Single Color",
                "class-color": "Class Colors"
            }, "headBorder", this.currentSettings.headBorder)[1].setLore(["All border colors can be changed in the config file"])
            elm.addSlider("Head border width", "headBorderWidth", this.currentSettings.headBorderWidth ?? 3, 1, 5)

            if (this.currentSettings.headBorder == "single") {
                elm.addColorSelector("Self Border Color", "singleBorderColorSelf", this.currentSettings.singleBorderColorSelf)
                elm.addColorSelector("Others Border Color", "singleBorderColor", this.currentSettings.singleBorderColor)
            } else if (this.currentSettings.headBorder == "class-color") {
                elm.addColorSelector("Healer Border Color", "healerColor", this.currentSettings.healerColor)
                elm.addColorSelector("Mage Border Color", "mageColor", this.currentSettings.mageColor)
                elm.addColorSelector("Berserk Border Color", "bersColor", this.currentSettings.bersColor)
                elm.addColorSelector("Archer Border Color", "archColor", this.currentSettings.archColor)
                elm.addColorSelector("Tank Border Color", "tankColor", this.currentSettings.tankColor)
            }

            return this.currentSettings.headBorder
        }, (lastStyle) => {
            return this.currentSettings.headBorder !== lastStyle
        })

        this.addDropdown("Player names on map", {
            "never": "Never",
            "leap": "Holding Leaps",
            "always": "Always"
        }, "playerNames", this.currentSettings.playerNames)

        this.addSlider("Icon Scale", "iconScale", this.currentSettings.iconScale ?? 10, 2, 15)
        this.addSlider("Text Scale", "textScale", this.currentSettings.textScale ?? 10, 2, 15)

        this.addColorSelector("Map Border Color", "mapBorderColor", this.currentSettings.mapBorderColor)
        this.addColorSelector("Map Color", "mapBackgroundColor", this.currentSettings.mapBackgroundColor)
        this.addColorSelector("Extra Info Color", "extraInfoBackroundColor", this.currentSettings.extraInfoBackroundColor)

        this.addCategory("Score Settings")

        this.addDropdown("Score info under map style", {
            "none": "None",
            "legalmap": "LegalMap",
            "simplified": "Simplified"
        }, "scoreInfoUnderMap", this.currentSettings.scoreInfoUnderMap)

        this.addGear(() => {
            return this.currentSettings.scoreInfoUnderMap === "simplified"
        }, (elm) => {
            elm.addToggle("Show 'Mimic' text before cross/tick", "scoreInfoUnderMap_simplified_showMimicText", this.currentSettings.scoreInfoUnderMap_simplified_showMimicText)[1].setLore(["If this is disabled it will still show whether mimic has been killed", "It just wont show the text before the indicator"])
        })

        this.addToggle("Fix Score in Scoreboard", "fixScore", this.currentSettings.fixScore)[1].setLore(["Replaces the score in the Sidebar-Scoreboard with the correct score"])

        this.addToggle("Force paul +10 score", "forcePaul", this.currentSettings.forcePaul)[1].setLore(["Paul score bonus will get auto-detected when paul is mayor", "But it wont be auto detected from jerry-paul"])

        this.addDropdown("Broadcast score message", {
            "never": "Off",
            "automatic": "Relevant score depending on your floor",
            "at270": "After reaching 270 score",
            "at300": "After reaching 300 score",
            "always": "Both 270 and 300",
        }, "showScoreMessage", this.currentSettings.showScoreMessage);

        this.addGear(() => {
            return this.currentSettings.showScoreMessage !== "never"
        }, (elm) => {
            if (this.currentSettings.showScoreMessage !== "at300")
                elm.addString("270 Score Message", "custom270scoreMessage", this.currentSettings.custom270scoreMessage)
            if (this.currentSettings.showScoreMessage !== "at270")
                elm.addString("300 Score Message", "custom300scoreMessage", this.currentSettings.custom300scoreMessage)
        })

        this.addDropdown("Show score title", {
            "never": "Off",
            "automatic": "Relevant score depending on your floor",
            "at270": "After reaching 270 score",
            "at300": "After reaching 300 score",
            "always": "Both 270 and 300",
        }, "showScoreTitle", this.currentSettings.showScoreTitle);

        this.addGear(() => {
            return this.currentSettings.showScoreTitle !== "never"
        }, (elm) => {
            if (this.currentSettings.showScoreTitle !== "at300")
                elm.addString("270 Score Title", "custom270scoreTitle", this.currentSettings.custom270scoreTitle)
            if (this.currentSettings.showScoreTitle !== "at270")
                elm.addString("300 Score Title", "custom300scoreTitle", this.currentSettings.custom300scoreTitle)
        })

        this.addDropdown("Custom 270 Score sound", {
            "none": "none",
            "creeper.primed": "creeper.primed",
            "dig.cloth": "dig.cloth",
            "dig.glass": "dig.glass",
            "dig.grass": "dig.grass",
            "dig.gravel": "dig.gravel",
            "dig.sand": "dig.sand",
            "dig.snow": "dig.snow",
            "dig.stone": "dig.stone",
            "dig.wood": "dig.wood",
            "fire.fire": "fire.fire",
            "fire.ignite": "fire.ignite",
            "fireworks.blast": "fireworks.blast",
            "fireworks.blast_far": "fireworks.blast_far",
            "fireworks.largeBlast": "fireworks.largeBlast",
            "fireworks.largeBlast_far": "fireworks.largeBlast_far",
            "fireworks.launch": "fireworks.launch",
            "fireworks.twinkle": "fireworks.twinkle",
            "fireworks.twinkle_far": "fireworks.twinkle_far",
            "game.hostile.die": "game.hostile.die",
            "game.hostile.hurt": "game.hostile.hurt",
            "game.hostile.hurt.fall.big": "game.hostile.hurt.fall.big",
            "game.hostile.hurt.fall.small": "game.hostile.hurt.fall.small",
            "game.hostile.swim": "game.hostile.swim",
            "game.hostile.swim.splash": "game.hostile.swim.splash",
            "game.neutral.die": "game.neutral.die",
            "game.neutral.hurt": "game.neutral.hurt",
            "game.neutral.hurt.fall.big": "game.neutral.hurt.fall.big",
            "game.neutral.hurt.fall.small": "game.neutral.hurt.fall.small",
            "game.neutral.swim": "game.neutral.swim",
            "game.neutral.swim.splash": "game.neutral.swim.splash",
            "game.player.die": "game.player.die",
            "game.player.hurt": "game.player.hurt",
            "game.player.hurt.fall.big": "game.player.hurt.fall.big",
            "game.player.hurt.fall.small": "game.player.hurt.fall.small",
            "game.player.swim": "game.player.swim",
            "game.player.swim.splash": "game.player.swim.splash",
            "game.potion.smash": "game.potion.smash",
            "game.tnt.primed": "game.tnt.primed",
            "gui.button.press": "gui.button.press",
            "item.fireCharge.use": "item.fireCharge.use",
            "liquid.lava": "liquid.lava",
            "liquid.lavapop": "liquid.lavapop",
            "liquid.water": "liquid.water",
            "minecart.base": "minecart.base",
            "minecart.inside": "minecart.inside",
            "mob.bat.death": "mob.bat.death",
            "mob.bat.hurt": "mob.bat.hurt",
            "mob.bat.idle": "mob.bat.idle",
            "mob.bat.loop": "mob.bat.loop",
            "mob.bat.takeoff": "mob.bat.takeoff",
            "mob.blaze.breathe": "mob.blaze.breathe",
            "mob.blaze.death": "mob.blaze.death",
            "mob.blaze.hit": "mob.blaze.hit",
            "mob.cat.hiss": "mob.cat.hiss",
            "mob.cat.hitt": "mob.cat.hitt",
            "mob.cat.meow": "mob.cat.meow",
            "mob.cat.purr": "mob.cat.purr",
            "mob.cat.purreow": "mob.cat.purreow",
            "mob.chicken.hurt": "mob.chicken.hurt",
            "mob.chicken.plop": "mob.chicken.plop",
            "mob.chicken.say": "mob.chicken.say",
            "mob.chicken.step": "mob.chicken.step",
            "mob.cow.hurt": "mob.cow.hurt",
            "mob.cow.say": "mob.cow.say",
            "mob.cow.step": "mob.cow.step",
            "mob.creeper.death": "mob.creeper.death",
            "mob.creeper.say": "mob.creeper.say",
            "mob.enderdragon.end": "mob.enderdragon.end",
            "mob.enderdragon.growl": "mob.enderdragon.growl",
            "mob.enderdragon.hit": "mob.enderdragon.hit",
            "mob.enderdragon.wings": "mob.enderdragon.wings",
            "mob.endermen.death": "mob.endermen.death",
            "mob.endermen.hit": "mob.endermen.hit",
            "mob.endermen.idle": "mob.endermen.idle",
            "mob.endermen.portal": "mob.endermen.portal",
            "mob.endermen.scream": "mob.endermen.scream",
            "mob.endermen.stare": "mob.endermen.stare",
            "mob.ghast.affectionate_scream": "mob.ghast.affectionate_scream",
            "mob.ghast.charge": "mob.ghast.charge",
            "mob.ghast.death": "mob.ghast.death",
            "mob.ghast.fireball": "mob.ghast.fireball",
            "mob.ghast.moan": "mob.ghast.moan",
            "mob.ghast.scream": "mob.ghast.scream",
            "mob.guardian.attack": "mob.guardian.attack",
            "mob.guardian.curse": "mob.guardian.curse",
            "mob.guardian.death": "mob.guardian.death",
            "mob.guardian.elder.death": "mob.guardian.elder.death",
            "mob.guardian.elder.hit": "mob.guardian.elder.hit",
            "mob.guardian.elder.idle": "mob.guardian.elder.idle",
            "mob.guardian.flop": "mob.guardian.flop",
            "mob.guardian.hit": "mob.guardian.hit",
            "mob.guardian.idle": "mob.guardian.idle",
            "mob.guardian.land.death": "mob.guardian.land.death",
            "mob.guardian.land.hit": "mob.guardian.land.hit",
            "mob.guardian.land.idle": "mob.guardian.land.idle",
            "mob.horse.angry": "mob.horse.angry",
            "mob.horse.armor": "mob.horse.armor",
            "mob.horse.breathe": "mob.horse.breathe",
            "mob.horse.death": "mob.horse.death",
            "mob.horse.donkey.angry": "mob.horse.donkey.angry",
            "mob.horse.donkey.death": "mob.horse.donkey.death",
            "mob.horse.donkey.hit": "mob.horse.donkey.hit",
            "mob.horse.donkey.idle": "mob.horse.donkey.idle",
            "mob.horse.gallop": "mob.horse.gallop",
            "mob.horse.hit": "mob.horse.hit",
            "mob.horse.idle": "mob.horse.idle",
            "mob.horse.jump": "mob.horse.jump",
            "mob.horse.land": "mob.horse.land",
            "mob.horse.leather": "mob.horse.leather",
            "mob.horse.skeleton.death": "mob.horse.skeleton.death",
            "mob.horse.skeleton.hit": "mob.horse.skeleton.hit",
            "mob.horse.skeleton.idle": "mob.horse.skeleton.idle",
            "mob.horse.soft": "mob.horse.soft",
            "mob.horse.wood": "mob.horse.wood",
            "mob.horse.zombie.death": "mob.horse.zombie.death",
            "mob.horse.zombie.hit": "mob.horse.zombie.hit",
            "mob.horse.zombie.idle": "mob.horse.zombie.idle",
            "mob.irongolem.death": "mob.irongolem.death",
            "mob.irongolem.hit": "mob.irongolem.hit",
            "mob.irongolem.throw": "mob.irongolem.throw",
            "mob.irongolem.walk": "mob.irongolem.walk",
            "mob.magmacube.big": "mob.magmacube.big",
            "mob.magmacube.jump": "mob.magmacube.jump",
            "mob.magmacube.small": "mob.magmacube.small",
            "mob.pig.death": "mob.pig.death",
            "mob.pig.say": "mob.pig.say",
            "mob.pig.step": "mob.pig.step",
            "mob.rabbit.death": "mob.rabbit.death",
            "mob.rabbit.hop": "mob.rabbit.hop",
            "mob.rabbit.hurt": "mob.rabbit.hurt",
            "mob.rabbit.idle": "mob.rabbit.idle",
            "mob.sheep.say": "mob.sheep.say",
            "mob.sheep.shear": "mob.sheep.shear",
            "mob.sheep.step": "mob.sheep.step",
            "mob.silverfish.hit": "mob.silverfish.hit",
            "mob.silverfish.kill": "mob.silverfish.kill",
            "mob.silverfish.say": "mob.silverfish.say",
            "mob.silverfish.step": "mob.silverfish.step",
            "mob.skeleton.death": "mob.skeleton.death",
            "mob.skeleton.hurt": "mob.skeleton.hurt",
            "mob.skeleton.say": "mob.skeleton.say",
            "mob.skeleton.step": "mob.skeleton.step",
            "mob.slime.attack": "mob.slime.attack",
            "mob.slime.big": "mob.slime.big",
            "mob.slime.small": "mob.slime.small",
            "mob.spider.death": "mob.spider.death",
            "mob.spider.say": "mob.spider.say",
            "mob.spider.step": "mob.spider.step",
            "mob.villager.death": "mob.villager.death",
            "mob.villager.haggle": "mob.villager.haggle",
            "mob.villager.hit": "mob.villager.hit",
            "mob.villager.idle": "mob.villager.idle",
            "mob.villager.no": "mob.villager.no",
            "mob.villager.yes": "mob.villager.yes",
            "mob.wither.death": "mob.wither.death",
            "mob.wither.hurt": "mob.wither.hurt",
            "mob.wither.idle": "mob.wither.idle",
            "mob.wither.shoot": "mob.wither.shoot",
            "mob.wither.spawn": "mob.wither.spawn",
            "mob.wolf.bark": "mob.wolf.bark",
            "mob.wolf.death": "mob.wolf.death",
            "mob.wolf.growl": "mob.wolf.growl",
            "mob.wolf.howl": "mob.wolf.howl",
            "mob.wolf.hurt": "mob.wolf.hurt",
            "mob.wolf.panting": "mob.wolf.panting",
            "mob.wolf.shake": "mob.wolf.shake",
            "mob.wolf.step": "mob.wolf.step",
            "mob.wolf.whine": "mob.wolf.whine",
            "mob.zombie.death": "mob.zombie.death",
            "mob.zombie.hurt": "mob.zombie.hurt",
            "mob.zombie.infect": "mob.zombie.infect",
            "mob.zombie.metal": "mob.zombie.metal",
            "mob.zombie.remedy": "mob.zombie.remedy",
            "mob.zombie.say": "mob.zombie.say",
            "mob.zombie.step": "mob.zombie.step",
            "mob.zombie.unfect": "mob.zombie.unfect",
            "mob.zombie.wood": "mob.zombie.wood",
            "mob.zombie.woodbreak": "mob.zombie.woodbreak",
            "mob.zombiepig.zpig": "mob.zombiepig.zpig",
            "mob.zombiepig.zpigangry": "mob.zombiepig.zpigangry",
            "mob.zombiepig.zpigdeath": "mob.zombiepig.zpigdeath",
            "mob.zombiepig.zpighurt": "mob.zombiepig.zpighurt",
            "note.bass": "note.bass",
            "note.bassattack": "note.bassattack",
            "note.bd": "note.bd",
            "note.harp": "note.harp",
            "note.hat": "note.hat",
            "note.pling": "note.pling",
            "note.snare": "note.snare",
            "portal.portal": "portal.portal",
            "portal.travel": "portal.travel",
            "portal.trigger": "portal.trigger",
            "random.anvil_break": "random.anvil_break",
            "random.anvil_land": "random.anvil_land",
            "random.anvil_use": "random.anvil_use",
            "random.bow": "random.bow",
            "random.bowhit": "random.bowhit",
            "random.break": "random.break",
            "random.burp": "random.burp",
            "random.chestclosed": "random.chestclosed",
            "random.chestopen": "random.chestopen",
            "random.click": "random.click",
            "random.door_close": "random.door_close",
            "random.door_open": "random.door_open",
            "random.drink": "random.drink",
            "random.eat": "random.eat",
            "random.explode": "random.explode",
            "random.fizz": "random.fizz",
            "random.levelup": "random.levelup",
            "random.orb": "random.orb",
            "random.pop": "random.pop",
            "random.splash": "random.splash",
            "random.successful_hit": "random.successful_hit",
            "random.wood_click": "random.wood_click",
            "step.cloth": "step.cloth",
            "step.grass": "step.grass",
            "step.gravel": "step.gravel",
            "step.ladder": "step.ladder",
            "step.sand": "step.sand",
            "step.snow": "step.snow",
            "step.stone": "step.stone",
            "step.wood": "step.wood",
            "tile.piston.in": "tile.piston.in",
            "tile.piston.out": "tile.piston.out"
        }, "custom270scoreSound", this.currentSettings.custom270scoreSound);

        this.addSidebarElement(new ButtonWithArrow().setText("&0Test selected 270 Score sound").addEvent(new SoopyMouseClickEvent().setHandler(() => {
            testSound270()
        })), 0.55, 0.35, 0.075)

        this.addSidebarElement()

        this.addDropdown("Custom 300 Score sound", {
            "none": "none",
            "creeper.primed": "creeper.primed",
            "dig.cloth": "dig.cloth",
            "dig.glass": "dig.glass",
            "dig.grass": "dig.grass",
            "dig.gravel": "dig.gravel",
            "dig.sand": "dig.sand",
            "dig.snow": "dig.snow",
            "dig.stone": "dig.stone",
            "dig.wood": "dig.wood",
            "fire.fire": "fire.fire",
            "fire.ignite": "fire.ignite",
            "fireworks.blast": "fireworks.blast",
            "fireworks.blast_far": "fireworks.blast_far",
            "fireworks.largeBlast": "fireworks.largeBlast",
            "fireworks.largeBlast_far": "fireworks.largeBlast_far",
            "fireworks.launch": "fireworks.launch",
            "fireworks.twinkle": "fireworks.twinkle",
            "fireworks.twinkle_far": "fireworks.twinkle_far",
            "game.hostile.die": "game.hostile.die",
            "game.hostile.hurt": "game.hostile.hurt",
            "game.hostile.hurt.fall.big": "game.hostile.hurt.fall.big",
            "game.hostile.hurt.fall.small": "game.hostile.hurt.fall.small",
            "game.hostile.swim": "game.hostile.swim",
            "game.hostile.swim.splash": "game.hostile.swim.splash",
            "game.neutral.die": "game.neutral.die",
            "game.neutral.hurt": "game.neutral.hurt",
            "game.neutral.hurt.fall.big": "game.neutral.hurt.fall.big",
            "game.neutral.hurt.fall.small": "game.neutral.hurt.fall.small",
            "game.neutral.swim": "game.neutral.swim",
            "game.neutral.swim.splash": "game.neutral.swim.splash",
            "game.player.die": "game.player.die",
            "game.player.hurt": "game.player.hurt",
            "game.player.hurt.fall.big": "game.player.hurt.fall.big",
            "game.player.hurt.fall.small": "game.player.hurt.fall.small",
            "game.player.swim": "game.player.swim",
            "game.player.swim.splash": "game.player.swim.splash",
            "game.potion.smash": "game.potion.smash",
            "game.tnt.primed": "game.tnt.primed",
            "gui.button.press": "gui.button.press",
            "item.fireCharge.use": "item.fireCharge.use",
            "liquid.lava": "liquid.lava",
            "liquid.lavapop": "liquid.lavapop",
            "liquid.water": "liquid.water",
            "minecart.base": "minecart.base",
            "minecart.inside": "minecart.inside",
            "mob.bat.death": "mob.bat.death",
            "mob.bat.hurt": "mob.bat.hurt",
            "mob.bat.idle": "mob.bat.idle",
            "mob.bat.loop": "mob.bat.loop",
            "mob.bat.takeoff": "mob.bat.takeoff",
            "mob.blaze.breathe": "mob.blaze.breathe",
            "mob.blaze.death": "mob.blaze.death",
            "mob.blaze.hit": "mob.blaze.hit",
            "mob.cat.hiss": "mob.cat.hiss",
            "mob.cat.hitt": "mob.cat.hitt",
            "mob.cat.meow": "mob.cat.meow",
            "mob.cat.purr": "mob.cat.purr",
            "mob.cat.purreow": "mob.cat.purreow",
            "mob.chicken.hurt": "mob.chicken.hurt",
            "mob.chicken.plop": "mob.chicken.plop",
            "mob.chicken.say": "mob.chicken.say",
            "mob.chicken.step": "mob.chicken.step",
            "mob.cow.hurt": "mob.cow.hurt",
            "mob.cow.say": "mob.cow.say",
            "mob.cow.step": "mob.cow.step",
            "mob.creeper.death": "mob.creeper.death",
            "mob.creeper.say": "mob.creeper.say",
            "mob.enderdragon.end": "mob.enderdragon.end",
            "mob.enderdragon.growl": "mob.enderdragon.growl",
            "mob.enderdragon.hit": "mob.enderdragon.hit",
            "mob.enderdragon.wings": "mob.enderdragon.wings",
            "mob.endermen.death": "mob.endermen.death",
            "mob.endermen.hit": "mob.endermen.hit",
            "mob.endermen.idle": "mob.endermen.idle",
            "mob.endermen.portal": "mob.endermen.portal",
            "mob.endermen.scream": "mob.endermen.scream",
            "mob.endermen.stare": "mob.endermen.stare",
            "mob.ghast.affectionate_scream": "mob.ghast.affectionate_scream",
            "mob.ghast.charge": "mob.ghast.charge",
            "mob.ghast.death": "mob.ghast.death",
            "mob.ghast.fireball": "mob.ghast.fireball",
            "mob.ghast.moan": "mob.ghast.moan",
            "mob.ghast.scream": "mob.ghast.scream",
            "mob.guardian.attack": "mob.guardian.attack",
            "mob.guardian.curse": "mob.guardian.curse",
            "mob.guardian.death": "mob.guardian.death",
            "mob.guardian.elder.death": "mob.guardian.elder.death",
            "mob.guardian.elder.hit": "mob.guardian.elder.hit",
            "mob.guardian.elder.idle": "mob.guardian.elder.idle",
            "mob.guardian.flop": "mob.guardian.flop",
            "mob.guardian.hit": "mob.guardian.hit",
            "mob.guardian.idle": "mob.guardian.idle",
            "mob.guardian.land.death": "mob.guardian.land.death",
            "mob.guardian.land.hit": "mob.guardian.land.hit",
            "mob.guardian.land.idle": "mob.guardian.land.idle",
            "mob.horse.angry": "mob.horse.angry",
            "mob.horse.armor": "mob.horse.armor",
            "mob.horse.breathe": "mob.horse.breathe",
            "mob.horse.death": "mob.horse.death",
            "mob.horse.donkey.angry": "mob.horse.donkey.angry",
            "mob.horse.donkey.death": "mob.horse.donkey.death",
            "mob.horse.donkey.hit": "mob.horse.donkey.hit",
            "mob.horse.donkey.idle": "mob.horse.donkey.idle",
            "mob.horse.gallop": "mob.horse.gallop",
            "mob.horse.hit": "mob.horse.hit",
            "mob.horse.idle": "mob.horse.idle",
            "mob.horse.jump": "mob.horse.jump",
            "mob.horse.land": "mob.horse.land",
            "mob.horse.leather": "mob.horse.leather",
            "mob.horse.skeleton.death": "mob.horse.skeleton.death",
            "mob.horse.skeleton.hit": "mob.horse.skeleton.hit",
            "mob.horse.skeleton.idle": "mob.horse.skeleton.idle",
            "mob.horse.soft": "mob.horse.soft",
            "mob.horse.wood": "mob.horse.wood",
            "mob.horse.zombie.death": "mob.horse.zombie.death",
            "mob.horse.zombie.hit": "mob.horse.zombie.hit",
            "mob.horse.zombie.idle": "mob.horse.zombie.idle",
            "mob.irongolem.death": "mob.irongolem.death",
            "mob.irongolem.hit": "mob.irongolem.hit",
            "mob.irongolem.throw": "mob.irongolem.throw",
            "mob.irongolem.walk": "mob.irongolem.walk",
            "mob.magmacube.big": "mob.magmacube.big",
            "mob.magmacube.jump": "mob.magmacube.jump",
            "mob.magmacube.small": "mob.magmacube.small",
            "mob.pig.death": "mob.pig.death",
            "mob.pig.say": "mob.pig.say",
            "mob.pig.step": "mob.pig.step",
            "mob.rabbit.death": "mob.rabbit.death",
            "mob.rabbit.hop": "mob.rabbit.hop",
            "mob.rabbit.hurt": "mob.rabbit.hurt",
            "mob.rabbit.idle": "mob.rabbit.idle",
            "mob.sheep.say": "mob.sheep.say",
            "mob.sheep.shear": "mob.sheep.shear",
            "mob.sheep.step": "mob.sheep.step",
            "mob.silverfish.hit": "mob.silverfish.hit",
            "mob.silverfish.kill": "mob.silverfish.kill",
            "mob.silverfish.say": "mob.silverfish.say",
            "mob.silverfish.step": "mob.silverfish.step",
            "mob.skeleton.death": "mob.skeleton.death",
            "mob.skeleton.hurt": "mob.skeleton.hurt",
            "mob.skeleton.say": "mob.skeleton.say",
            "mob.skeleton.step": "mob.skeleton.step",
            "mob.slime.attack": "mob.slime.attack",
            "mob.slime.big": "mob.slime.big",
            "mob.slime.small": "mob.slime.small",
            "mob.spider.death": "mob.spider.death",
            "mob.spider.say": "mob.spider.say",
            "mob.spider.step": "mob.spider.step",
            "mob.villager.death": "mob.villager.death",
            "mob.villager.haggle": "mob.villager.haggle",
            "mob.villager.hit": "mob.villager.hit",
            "mob.villager.idle": "mob.villager.idle",
            "mob.villager.no": "mob.villager.no",
            "mob.villager.yes": "mob.villager.yes",
            "mob.wither.death": "mob.wither.death",
            "mob.wither.hurt": "mob.wither.hurt",
            "mob.wither.idle": "mob.wither.idle",
            "mob.wither.shoot": "mob.wither.shoot",
            "mob.wither.spawn": "mob.wither.spawn",
            "mob.wolf.bark": "mob.wolf.bark",
            "mob.wolf.death": "mob.wolf.death",
            "mob.wolf.growl": "mob.wolf.growl",
            "mob.wolf.howl": "mob.wolf.howl",
            "mob.wolf.hurt": "mob.wolf.hurt",
            "mob.wolf.panting": "mob.wolf.panting",
            "mob.wolf.shake": "mob.wolf.shake",
            "mob.wolf.step": "mob.wolf.step",
            "mob.wolf.whine": "mob.wolf.whine",
            "mob.zombie.death": "mob.zombie.death",
            "mob.zombie.hurt": "mob.zombie.hurt",
            "mob.zombie.infect": "mob.zombie.infect",
            "mob.zombie.metal": "mob.zombie.metal",
            "mob.zombie.remedy": "mob.zombie.remedy",
            "mob.zombie.say": "mob.zombie.say",
            "mob.zombie.step": "mob.zombie.step",
            "mob.zombie.unfect": "mob.zombie.unfect",
            "mob.zombie.wood": "mob.zombie.wood",
            "mob.zombie.woodbreak": "mob.zombie.woodbreak",
            "mob.zombiepig.zpig": "mob.zombiepig.zpig",
            "mob.zombiepig.zpigangry": "mob.zombiepig.zpigangry",
            "mob.zombiepig.zpigdeath": "mob.zombiepig.zpigdeath",
            "mob.zombiepig.zpighurt": "mob.zombiepig.zpighurt",
            "note.bass": "note.bass",
            "note.bassattack": "note.bassattack",
            "note.bd": "note.bd",
            "note.harp": "note.harp",
            "note.hat": "note.hat",
            "note.pling": "note.pling",
            "note.snare": "note.snare",
            "portal.portal": "portal.portal",
            "portal.travel": "portal.travel",
            "portal.trigger": "portal.trigger",
            "random.anvil_break": "random.anvil_break",
            "random.anvil_land": "random.anvil_land",
            "random.anvil_use": "random.anvil_use",
            "random.bow": "random.bow",
            "random.bowhit": "random.bowhit",
            "random.break": "random.break",
            "random.burp": "random.burp",
            "random.chestclosed": "random.chestclosed",
            "random.chestopen": "random.chestopen",
            "random.click": "random.click",
            "random.door_close": "random.door_close",
            "random.door_open": "random.door_open",
            "random.drink": "random.drink",
            "random.eat": "random.eat",
            "random.explode": "random.explode",
            "random.fizz": "random.fizz",
            "random.levelup": "random.levelup",
            "random.orb": "random.orb",
            "random.pop": "random.pop",
            "random.splash": "random.splash",
            "random.successful_hit": "random.successful_hit",
            "random.wood_click": "random.wood_click",
            "step.cloth": "step.cloth",
            "step.grass": "step.grass",
            "step.gravel": "step.gravel",
            "step.ladder": "step.ladder",
            "step.sand": "step.sand",
            "step.snow": "step.snow",
            "step.stone": "step.stone",
            "step.wood": "step.wood",
            "tile.piston.in": "tile.piston.in",
            "tile.piston.out": "tile.piston.out"
        }, "custom300scoreSound", this.currentSettings.custom300scoreSound);

        this.addSidebarElement(new ButtonWithArrow().setText("&0Test selected 300 Score sound").addEvent(new SoopyMouseClickEvent().setHandler(() => {
            testSound300()
        })), 0.55, 0.35, 0.075)

        this.addSidebarElement()

        this.addToggle("Disbale min secret modification", "staticSecretsLeft", this.currentSettings.staticSecretsLeft)[1].setLore(["When enabled, do not subtract bonus/ add deathscore from min Secrets"])

        this.addCategory("Tab Info")

        this.addToggle("Show current Secret total", "tabSecretCount", this.currentSettings.tabSecretCount)[1].setLore(["Change the secrets found number in tab to also show total secrets in dungeon", "&cMAY CONFLICT WITH OTHER MODS (DG)"])

        this.addToggle("Show current Crypt total", "tabCryptCount", this.currentSettings.tabCryptCount)[1].setLore(["Change the crypts found number in tab to also show total crypts in dungeon", "&cMAY CONFLICT WITH OTHER MODS (DG)"])

        this.addToggle("Show Mimic Status", "tabMimic", this.currentSettings.tabMimic)[1].setLore(["Add a line to tab displaying wether the minic has been killed"])

        this.addCategory("Other Settings")

        this.addToggle("Hide map in Boss", "hideInBoss", this.currentSettings.hideInBoss)
        this.addToggle("Show tabs on map", "showTabs", this.currentSettings.showTabs)[1].setLore(["Shows tabs at the top of the map that can be clicked", "eg to look at the dungeon map when in boss"])

        this.addDropdown("Current room info next to map", {
            "none": "None",
            "left": "Left of map",
            "right": "Right of map"
        }, "currentRoomInfo", this.currentSettings.currentRoomInfo)[1].setLore(["Shows the same info that would be shown when hovering over a room"])

        this.addToggle("Box wither doors", "boxDoors", this.currentSettings.boxDoors)[1].setLore(["Not esp, loads door locations from map."])

        this.addToggle("Dungeon clear breakdown", "clearedRoomInfo", this.currentSettings.clearedRoomInfo)[1].setLore(["Shows the cleared room count and specific rooms in chat when the dungeon ends"])

        this.addToggle("Advanced breakdown", "advancedClearedRooms", this.currentSettings.advancedClearedRooms)[1].setLore(["Add shortcuts to /p kick and /ignore add per Player in the breakdown"])

        this.addString("Advanced breakdown ignore list", "breakdownIgnoreList", this.currentSettings.breakdownIgnoreList)[1].setLore(["Space separated List of users to not show shortcuts for","eg Name1 Name2 Name3"])

        this.addToggle("Secrets breakdown", "showSecretsBreakdown", this.currentSettings.showSecretsBreakdown)[1].setLore(["Adds a Secret summary after the breakdown", "Player collected / Secrets found / Minimum required / Total secrets (Unaccounted)"])

        this.addToggle("Show secret waypoints (scuffed)", "showSecrets", this.currentSettings.showSecrets)[1].setLore(["Syncs between bettermap users"])

        this.addToggle("Spirit leap overlay", "spiritLeapOverlay", this.currentSettings.spiritLeapOverlay)[1].setLore(["You can click on player heads in overlay!", "Most people probs wont like the design though."])

        this.addToggle("Close Secret chests by moving", "movingClosesChests", this.currentSettings.movingClosesChests)[1].setLore(["Using any movement key should close any Container (secrets/ Dungeon rewards)"])

        this.addDropdown("Hide DH Reward Chest messages", {
            "none": "Off",
            "Just RARE REWARD": "Hide the chest opening",
            "Just Dungeon Treasure": "Hide the item pickup",
            "both": "Hide both messages",
        }, "rewardAnnounceHider", this.currentSettings.rewardAnnounceHider);

        this.addSidebarElement(new ButtonWithArrow().setText("&0Load api key from other mods").addEvent(new SoopyMouseClickEvent().setHandler(() => {
            findKey(key => {
                this.setApiKey(key)
            })
        })), 0.3, 0.4, 0.075)
        this.addSidebarElement() // Adds a gap because the button diddnt auto add one

        this.apiKeySetting = this.addHiddenString("Api key", "apiKey", this.currentSettings.apiKey)[0]

        this.addToggle("Show dev info", "devInfo", this.currentSettings.devInfo)

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

            this.closeMoreSettingsGui()
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

        register("chat", (key, event) => { // Api key detection
            ChatLib.chat(MESSAGE_PREFIX + "Copied api key!")

            this.setApiKey(key)
        }).setChatCriteria("&aYour new API key is &r&b${key}&r")

        this.generateChangelog()
    }

    setApiKey(key) {
        this.apiKeySetting.setText(key)

        this.changed("apiKey", key)
    }

    /**
     * Will add a gear to the right of the last added setting
     * @param {function():Boolean} shouldShowFun
     * @param {function(CustomSettingsBuilder):Any} generateGuiElementFun
     * @param {function(Any)} generateGuiElementFun
     * @example ```js
     * this.addGear(()=>{
     *      //Return true/false wether to show the gear (based of selected settings)
     *      //eg this will only show the button if you have spirit leap overlay enabled
     *      return this.currentSettings.spiritLeapOverlay
     * }, (elm)=>{
     *      //add settings to the the soopy gui element to show when the user clicks on the gear
     *      //eg
     *      elm.addToggle("Spirit leap overlay", "spiritLeapOverlay", this.defaultSettings.spiritLeapOverlay)[1].setLore(["You can click on player heads in overlay!", "Most people probs wont like the design though."])
     * })
     * ```
     */
    addGear(shouldShowFun = () => { }, generateGuiElementFun = () => { }, regenerateWhen = () => { }) {
        let shouldShowStart = shouldShowFun()

        let button = new BoxWithGear().setLocation(0.905, this.y - 0.05 - 0.075 / 2, 0.075, 0.075)
        this.mainpage.addChild(button)

        button.visable = shouldShowStart
        let menuOpen = false

        let state

        let openFun = () => {
            let element = new CustomSettingsBuilder(this)
            state = generateGuiElementFun(element)

            this.moreSettingsPage.clearChildren()

            this.moreSettingsPage.addChild(element.getElement())
            this.moreSettingsPage.addChild(this.settingsPageButton)

            this.mainpage.location.location.x.set(-1, 250)
            this.moreSettingsPage.location.location.x.set(0, 250)

            menuOpen = true

            this.closeMoreSettingsGui = () => {
                this.mainpage.location.location.x.set(0, 250)
                this.moreSettingsPage.location.location.x.set(1, 250)

                menuOpen = false

                this.closeMoreSettingsGui = () => { }
            }
        }

        button.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            //Open button
            openFun()
        }))

        this.onSettingChangeFunctions.push(() => {
            let shouldShowNow = shouldShowFun()

            button.visable = shouldShowNow

            if (menuOpen && regenerateWhen(state)) {
                openFun()
            }

        })

        return button
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
    addDropdown(label, options, setting, defau, addFun = this.addSidebarElement) {
        let drop = addFun(new DropDown().setOptions(options).setSelectedOption(this.currentSettings[setting] ?? defau).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, val)
        })), 0.55, 0.35, 0.075)

        return [drop, addFun(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    }


    /**
     * 
     * @param {String} label The text to go to the left of the dropdown
     * @param {String} setting internal name of the setting to control
     * @param {Boolean} defau Default value
     */
    addToggle(label, setting, defau, addFun = this.addSidebarElement) {
        let toggle = addFun(new Toggle().setValue(this.currentSettings[setting] ?? defau).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, val)
        })), 0.625, 0.2, 0.05)

        return [toggle, addFun(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    }

    /**
     * @param {String} label The text to go to the left of the dropdown
     * @param {String} setting internal name of the setting to control
     * @param {String} defau Default value
     */
    addString(label, setting, defau, addFun = this.addSidebarElement) {
        let textBox = new TextBox().setText(this.currentSettings[setting] ?? defau)
        textBox.text.addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, val)
        }))

        addFun(textBox, 0.55, 0.35, 0.05)

        return [textBox, addFun(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    }

    /**
     * @param {String} label The text to go to the left of the dropdown
     * @param {String} setting internal name of the setting to control
     * @param {String} defau Default value
     */
    addHiddenString(label, setting, defau, addFun = this.addSidebarElement) {
        let textBox = new PasswordInput().setText(this.currentSettings[setting] ?? defau)
        textBox.text.addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, val)
        }))

        addFun(textBox, 0.55, 0.35, 0.05)

        return [textBox, addFun(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    }

    /**
     * @param {String} label The text to go to the left of the slider
     * @param {String} setting internal name of the setting to control
     * @param {[r:Number, g:Number, b:Number, a:number]} defau Default value
     */
    addColorSelector(label, setting, defau, addFun = this.addSidebarElement) {

        let colorPicker = new ColorPicker().setRGBColor(this.currentSettings[setting][0] ?? defau[0], this.currentSettings[setting][1] ?? defau[1], this.currentSettings[setting][2] ?? defau[2]).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changedArr(setting, 0, val[0])
            this.changedArr(setting, 1, val[1])
            this.changedArr(setting, 2, val[2])
        }))

        // Slider 3
        let slider3 = new Slider().setValue(this.currentSettings[setting][3] ?? defau[3]).setMin(0).setMax(255).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changedArr(setting, 3, Math.round(val))
            numberT3.setText(Math.round(val).toString())
        }))

        let numberT3 = new NumberTextBox().setText((this.currentSettings[setting][3] ?? defau[3]).toString())

        numberT3.isNumber = isNumber

        numberT3.text.addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            if (!val) return

            this.changedArr(setting, 3, parseInt(val))
            slider3.setValue(parseInt(val))
        }))

        addFun(colorPicker, 0.5, 0.1, 0.05)

        addFun(slider3, 0.6, 0.2, 0.05).setLore(["opacity"])
        addFun(numberT3, 0.8, 0.1, 0.05).setLore(["opacity"])

        return [[], addFun(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    }

    /**
     * 
     * @param {String} label The text to go to the left of the slider
     * @param {String} setting internal name of the setting to control
     * @param {Number} defau Default value
     * @param {Number} min Minimum value
     * @param {Number} max Maximum value
     */
    addSlider(label, setting, defau, min, max, addFun = this.addSidebarElement) {
        let slider = new Slider().setValue(this.currentSettings[setting] ?? defau).setMin(min).setMax(max).addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            this.changed(setting, Math.round(val))
            numberT.setText(Math.round(val).toString())
        }))

        let numberT = new NumberTextBox().setText((this.currentSettings[setting] ?? defau).toString())

        numberT.isNumber = (val) => {
            if (val.includes(".")) return false
            val = "" + val; // Coerce num to be a string
            return !isNaN(val) && !isNaN(parseInt(val));
        }

        numberT.text.addEvent(new SoopyContentChangeEvent().setHandler((val, prev, cancelFun) => {
            if (!val) return
            if (isNaN(val)) return

            this.changed(setting, parseInt(val))
            slider.setValue(parseInt(val))
        }))

        addFun(slider, 0.55, 0.2, 0.05)
        addFun(numberT, 0.8, 0.1, 0.05)
        return [[slider, numberT], addFun(new SoopyTextElement().setText("§0" + label).setMaxTextScale(2), 0.1, 0.35)]
    }

    /**
     * 
     * @param {String} label The text/name of the category
     */
    addCategory(label, addFun = this.addSidebarElement) {
        let elm = new SoopyTextElement().setText("§7" + label).setMaxTextScale(2)
        addFun(elm, 0.1, 0.8, 0.06)
        elm.location.location.y.set(addFun("getYPlease") - 0.1 + 0.04)
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
        if (elm === "getYPlease") { //OMEGA SCUFFED
            return this.y
        }
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

function testSound270() {
    if (settings.settings.custom270scoreSound !== 'none') World.playSound(settings.settings.custom270scoreSound, 1, 1)
}

function testSound300() {
    if (settings.settings.custom300scoreSound !== 'none') World.playSound(settings.settings.custom300scoreSound, 1, 1)
}

function isNumber(val) {
    if (val.includes(".")) return false
    val = "" + val; // Coerce num to be a string
    return !isNaN(val) && !isNaN(parseInt(val));
}

class CustomSettingsBuilder {
    constructor(parent) {
        this.parent = parent

        this.addSidebarElement = this.addSidebarElement.bind(this) //BatChamp I LOVE JS this. CONTEXT!

        this.guiElement = new SoopyGuiElement().setLocation(0, 0, 1, 1).setScrollable(true)

        this.y = 0.1
    }

    getElement() {
        return this.guiElement
    }

    /**
     * @param {Object} elm The element being added
     * @param {Number} x the x pos
     * @param {Number} width The width of the elm
     * @param {Number} height The height of the elm
     * @returns {Object} elm
     */
    addSidebarElement(elm = null, x = 0.1, width = 0.8, height = 0.1) {
        if (elm === "getYPlease") { //OMEGA SCUFFED
            return this.y
        }
        if (elm) this.guiElement.addChild(elm.setLocation(x, this.y + 0.05 - height / 2, width, height))
        if (x === 0.1) this.y += 0.1
        return elm
    }

    /**
     * @param {String} label The text to go to the left of the dropdown
     * @param {Object} options {key:value} where key = setting internal value and value = render text
     * @param {String} setting internal name of the setting to control
     * @param {String} defau Default value
     */
    addDropdown(label, options, setting, defau) {
        return this.parent.addDropdown(label, options, setting, defau, this.addSidebarElement)
    }

    /**
     * @param {String} label The text to go to the left of the dropdown
     * @param {String} setting internal name of the setting to control
     * @param {Boolean} defau Default value
     */
    addToggle(label, setting, defau) {
        return this.parent.addToggle(label, setting, defau, this.addSidebarElement)
    }

    /**
     * @param {String} label The text to go to the left of the dropdown
     * @param {String} setting internal name of the setting to control
     * @param {String} defau Default value
     */
    addString(label, setting, defau) {
        return this.parent.addString(label, setting, defau, this.addSidebarElement)
    }

    /**
     * @param {String} label The text to go to the left of the dropdown
     * @param {String} setting internal name of the setting to control
     * @param {String} defau Default value
     */
    addHiddenString(label, setting, defau) {
        return this.parent.addHiddenString(label, setting, defau, this.addSidebarElement)
    }

    /**
     * @param {String} label The text to go to the left of the slider
     * @param {String} setting internal name of the setting to control
     * @param {Object[]} defau Default value
     */
    addColorSelector(label, setting, defau) {
        return this.parent.addColorSelector(label, setting, defau, this.addSidebarElement)
    }

    /**
     * @param {String} label The text to go to the left of the slider
     * @param {String} setting internal name of the setting to control
     * @param {Number} defau Default value
     * @param {Number} min Minimum value
     * @param {Number} max Maximum value
     */
    addSlider(label, setting, defau, min, max) {
        return this.parent.addSlider(label, setting, defau, min, max, this.addSidebarElement)
    }

    /**
     * @param {String} label The text/name of the category
     */
    addCategory(label) {
        return this.parent.addCategory(label, this.addSidebarElement)
    }
}