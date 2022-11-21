const { default: settings } = require("../Settings/CurrentSettings")

import { SoopyGui, SoopyRenderEvent } from "../../../guimanager";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import SoopyKeyPressEvent from "../../../guimanager/EventListener/SoopyKeyPressEvent";
import MapRenderer from "../../Render/MapRenderer";

let renderContext = settings.settingsManager.createRenderContext({ showMap: true, currentRoomInfo: "none", hideInBoss: false, showTabs: false, scoreInfoUnderMap: "none" })
let renderContextData = settings.renderContextManager.getRenderContextData(renderContext)

let mapRenderer = new MapRenderer()
let lastDoorOpener
register("chat", (player) => {
    lastDoorOpener = ChatLib.removeFormatting(player)
}).setChatCriteria("&r&a${player}&r&a opened a &r&8&lWITHER &r&adoor!&r")

register("step", () => {
    overlay.tick()
}).setFps(10)

register("guiOpened", (e) => {
    if (settings.settings.spiritLeapOverlay) overlay.guiOpened(e)
})

const ContainerChest = Java.type("net.minecraft.inventory.ContainerChest")
class SpiritLeapOverlay {
    constructor() {
        this.soopyGui = new SoopyGui()

        let renderThing = new soopyGuiMapRendererThing(this).setLocation(0, 0, 1, 1)
        this.soopyGui.element.addChild(renderThing)

        this.soopyGui.element.addEvent(new SoopyKeyPressEvent().setHandler((key, keyId) => {
            if (keyId === 18) {
                this.soopyGui.close()
            }
        }))

        this.buttonsContainer = new SoopyGuiElement().setLocation(0.2, 0.2, 0.6, 0.3)
        this.soopyGui.element.addChild(this.buttonsContainer)

        this.items = {}

        this.players = {}
    }

    guiOpened(event) {
        if (event.gui && event.gui.field_147002_h instanceof ContainerChest) {
            name = event.gui.field_147002_h.func_85151_d().func_145748_c_().func_150260_c()
            if (name === "Spirit Leap") {
                this.soopyGui.open()
            }
        }
    }

    tick() {
        let itemsNew = {}

        if (Player.getContainer()?.getName() === "Spirit Leap") {

            this.players = {}
            Scoreboard.getLines().forEach(line => {
                let name = ChatLib.removeFormatting(line.getName()).replace(/[^A-z0-9 \:\(\)\.\[\]]/g, "")
                if (name.startsWith("[M] ")) this.players[name.split(" ")[1]] = "M"
                if (name.startsWith("[A] ")) this.players[name.split(" ")[1]] = "A"
                if (name.startsWith("[B] ")) this.players[name.split(" ")[1]] = "B"
                if (name.startsWith("[H] ")) this.players[name.split(" ")[1]] = "H"
                if (name.startsWith("[T] ")) this.players[name.split(" ")[1]] = "T"
            })

            for (let i = 1; i < 9 * 3; i++) {
                let item = Player.getContainer().getStackInSlot(i)
                if (item && item.getID() !== 160) {
                    itemsNew[item.getName()] = i
                }
            }

            if (JSON.stringify(this.items) !== JSON.stringify(itemsNew)) {
                this.items = itemsNew
                this.buttonsContainer.clearChildren()

                getClass = (name) => {
                    let pClass = (this.players[name] || "?")
                    if (pClass === "?") {
                        Object.keys(this.players).forEach(n => {
                            if (name.startsWith(n)) {
                                pClass = this.players[n]
                            }
                        })
                    }
                    return pClass
                }

                Object.keys(this.items).sort((a, b) => {
                    return getClass(ChatLib.removeFormatting(a)).codePointAt(0) - getClass(ChatLib.removeFormatting(b)).codePointAt(0)
                }).forEach((name, i) => {

                    let name2 = ChatLib.removeFormatting(name)
                    let pClass = getClass(name2)

                    let button = new ButtonWithArrow().setText((name2 === lastDoorOpener ? "&4" : "&2") + "[" + pClass + "] " + name2).addEvent(new SoopyMouseClickEvent().setHandler(() => {
                        Player.getContainer().click(itemsNew[name])
                        ChatLib.chat("Leaping to " + name)
                    })).setLocation((i % 2) * 0.5, Math.floor(i / 2) * 0.5, 0.5, 0.5)
                    button.text.setLocation(0.5, 0, 0.4, 1)
                    button.addEvent(new SoopyRenderEvent().setHandler(() => {

                        let player = settings.currentDungeon.players.find(p => p.username === name2)

                        if (!player) return

                        let x = button.location.getXExact()
                        let y = button.location.getYExact()
                        let h = button.location.getHeightExact()

                        player.drawAt(x + h / 5, y + h / 10, 8 * h / 10, 8 * h / 10)

                    }))
                    this.buttonsContainer.addChild(button)
                })
            }
        }
    }
}

class soopyGuiMapRendererThing extends SoopyGuiElement {
    constructor(parent) {
        super()

        this.parentE = parent

        this.addEvent(new SoopyRenderEvent().setHandler((mouseX, mouseY) => {
            if (!settings.currentDungeon) return

            let mapSize = Math.min(Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 2)

            renderContextData.settings.posX = Renderer.screen.getWidth() / 2 - mapSize / 2
            renderContextData.settings.posY = 2 * Renderer.screen.getHeight() / 3 - mapSize / 3
            renderContextData.settings.size = mapSize

            mapRenderer.draw(renderContextData, settings.currentDungeon, -1, -1)
        }))
        this.addEvent(new SoopyMouseClickEvent().setHandler((mouseX, mouseY) => {
            let mapSize = Math.min(Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 2)

            if (mouseY < 2 * Renderer.screen.getHeight() / 3 - mapSize / 3) return

            let closestPlayer = this.getClosestPlayerTo(mouseX, mouseY)

            if (closestPlayer && closestPlayer.username !== Player.getName()) {
                if (Player.getContainer()?.getName() === "Spirit Leap") {
                    for (let i = 1; i < 9 * 3; i++) {
                        let item = Player.getContainer().getStackInSlot(i)
                        if (item && item.getID() !== 160) {
                            if (ChatLib.removeFormatting(item.getName()) === closestPlayer.username) {
                                Player.getContainer().click(i)
                                ChatLib.chat("Leaping to " + closestPlayer.username)
                            }
                        }
                    }
                }
            }
        }))
    }

    getClosestPlayerTo(x, y) {
        let minDist = Infinity
        let minP = undefined
        settings.currentDungeon.players.forEach(p => {
            let [x2, y2] = p.getRenderLocation(renderContextData, settings.currentDungeon)


            let dist = (x - x2) ** 2 + (y - y2) ** 2

            if (dist < minDist) {
                minDist = dist
                minP = p
            }
        })

        return minP
    }
}

let overlay = new SpiritLeapOverlay()