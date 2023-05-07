import { fetch } from "./networkUtils"

class DataLoader {
    constructor() {
        this.stats = {}

        this.area = undefined
        this.areaFine = undefined
        this.bits = undefined
        this.purse = undefined
        this.dungeonFloor = undefined
        this.isInDungeon = false

        this.isInSkyblock = false

        this.dungeonPercentCleared = 0

        register("step", this.step.bind(this)).setFps(2)
        register("worldLoad", this.worldLoad.bind(this))

        this.currentMayorPerks = new Set()

        this.partyMembers = new Set()
        this.partyMembers.add(Player.getName())

        this.firstLoaded = false;

        ["You are not currently in a party.", "You have been kicked from the party by ${*}", "You left the party.", "The party was disbanded because all invites expired and the party was empty", "${*} &r&ehas disbanded the party!&r"].forEach(m => this.registerChat(m, () => {
            this.partyMembers.clear()
            this.partyMembers.add(Player.getName())
        }));

        ["${mem} &r&ejoined the party.&r", "${mem} &r&einvited &r${*} &r&eto the party! They have &r&c60 &r&eseconds to accept.&r", "&dDungeon Finder &r&f> &r${mem} &r&ejoined the dungeon group! (&r&b${*}&r&e)&r"].forEach(m => this.registerChat(m, (mem) => {
            this.partyMembers.add(ChatLib.removeFormatting(mem.trim().split(" ").pop().trim()))
        }));
        ["${mem} &r&ehas been removed from the party.&r", "${mem} &r&ehas left the party.&r", "${mem} &r&ewas removed from your party because they disconnected&r", "Kicked ${mem} because they were offline."].forEach(m => this.registerChat(m, (mem) => {
            this.partyMembers.delete(ChatLib.removeFormatting(mem.trim().split(" ").pop().trim()))
        }))
        this.registerChat("&eYou have joined &r${mem}'s &r&eparty!&r", (mem) => {
            this.partyMembers.clear()
            this.partyMembers.add(Player.getName())
            this.partyMembers.add(ChatLib.removeFormatting(p = mem.trim().split(" ").pop().trim()))
        })
        this.registerChat("&eYou have joined &r${mem}' &r&eparty!&r", (mem) => {
            this.partyMembers.clear()
            this.partyMembers.add(Player.getName())
            this.partyMembers.add(ChatLib.removeFormatting(mem).trim())
        })
        this.registerChat("&eYou'll be partying with: ${mem}", (mem) => {
            mem.split(",").forEach(p => {
                this.partyMembers.add(ChatLib.removeFormatting(p.trim().split(" ").pop().trim()))
            })
        })
        this.registerChat("&eParty ${type}: ${mem}", (type, mem) => {
            if (type.toLowerCase().includes("leader")) this.partyMembers.clear()
            ChatLib.removeFormatting(mem).split("●").forEach(p => {
                if (!p.trim()) return
                this.partyMembers.add(p.trim().split(" ").pop().trim())
            })
        })
    }
    registerChat(msg, fun) {
        return register("chat", fun.bind(this)).setChatCriteria(msg)
    }

    worldLoad() {
        this.area = undefined
        this.areaFine = undefined

        this.isInDungeon = false
        this.dungeonFloor = undefined


        fetch("https://soopy.dev/api/v2/mayor").json(data => {
            if (!data.success) return
            this.mayorData = data.data
            this.currentMayorPerks = new Set(data.data.mayor.perks.map(a => a.name))
        })
    }

    step() { // 2fps
        this.isInSkyblock = Scoreboard.getTitle()?.removeFormatting().includes("SKYBLOCK") || Scoreboard.getTitle()?.removeFormatting().includes("SKIBLOCK")

        if (!this.isInSkyblock) {
            this.stats = {}
            this.isInDungeon = false
            this.dungeonFloor = undefined
            return
        }

        this.stats["Area"] = undefined
        this.stats["Dungeon"] = undefined

        if (World.isLoaded() && TabList.getNames()) {
            TabList.getNames().forEach(n => {
                n = ChatLib.removeFormatting(n)
                if (!n.includes(": ")) return
                if (n.includes('Secrets Found')) {
                    if (n.includes('%')) {
                        this.stats["Secrets Found%"] = n.split(": ")[1]
                    } else {
                        this.stats["Secrets Found"] = n.split(": ")[1]
                    }
                } else {
                    this.stats[n.split(": ")[0].trim()] = n.split(": ")[1].trim()
                }
            })
        }

        if (this.stats["Dungeon"]) {
            this.stats["Area"] = this.stats["Dungeon"]
            this.isInDungeon = true
        }

        Scoreboard.getLines().forEach(line => {
            let name = ChatLib.removeFormatting(line.getName()).replace(/[^A-z0-9 \:\(\)\.]/g, "")
            if (this.isInDungeon) {
                if (name.includes("The Catacombs (")) {
                    this.dungeonFloor = name.split("(")[1].split(")")[0].toUpperCase()
                }
            }
            if (ChatLib.removeFormatting(line).startsWith(" ⏣ ")) {
                this.areaFine = ChatLib.removeFormatting(line).split(" ⏣ ")[1].replace(/[^A-z0-9 \:\(\)\.\-]/g, "")
            }
            if (name.startsWith("Purse: ")) {
                this.purse = parseInt(name.split("Purse: ")[1].split(" ")[0])
            }
            if (name.startsWith("Bits: ")) {
                this.bits = parseInt(name.split("Bits: ")[1].split(" ")[0])
            }
            if (name.startsWith("Cleared: ")) {
                this.dungeonPercentCleared = parseInt(name.split(" ")[1]) / 100
            }
        })

        this.area = this.stats["Area"]

    }
}

if (!global.betterMapDataLoaderThing) {
    global.betterMapDataLoaderThing = new DataLoader()
}
/**@type {DataLoader} */
let loader = global.betterMapDataLoaderThing

export default loader