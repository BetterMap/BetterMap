import DungeonMap from "../Components/DungeonMap";
import PlayerManager from "../Components/PlayerManager";

const mimicDeadMessages = ["$SKYTILS-DUNGEON-SCORE-MIMIC$", "Mimic Killed!", "Mimic Dead!", "Mimic dead!"];

export default class ChatUpdater {

    /**
     * Creates a new ChatUpdater and registers 
     * @param {DungeonMap} dungeonMap 
     * @param {PlayerManager} players 
     * @param {boolean} registerEvents
     */
    constructor(dungeonMap, players, registerEvents = true) {
        this.dungeonMap = dungeonMap;
        this.players= players;
        if (!registerEvents) return;
        this.triggers = [
            register("chat", this.killMimic).setChatCriteria("&r&9Party &8> ${msg}"),
            register("chat", this.showRunOverview).setChatCriteria('&r&c${*}e Catacombs &r&8- &r&eFloor${end}').setContains(),
            register("chat", this.openBloodDoor).setChatCriteria("&r&cThe &r&c&lBLOOD DOOR&r&c has been opened!&r"),
            register("chat", this.increaseKeyCount).setChatCriteria("${*} &r&ehas obtained &r&a&r&${*} Key&r&e!&r"),
            register("chat", this.increaseKeyCount).setChatCriteria("&r&eA &r&a&r&${*} Key&r&e was picked up!&r"),
            register("chat", this.decreaseKeyCount).setChatCriteria("&r&a${player}&r&a opened a &r&8&lWITHER &r&adoor!&r"),
            register("chat", this.detectDeath).setChatCriteria("&r&c ☠ ${info} became a ghost&r&7.&r"),
            register("chat", this.watcherComplete).setChatCriteria("[BOSS] The Watcher: That will be enough for now.")
        ]
    }

    watcherComplete() {
        this.roomsArr.forEach(r => {
            if (r.type === Room.BLOOD) {
                r.checkmarkState = Room.CLEARED
                this.markChanged()
            }
        })
    }

    killMimic(msg) {
        mimicDeadMessages.forEach(dmsg => {
            if (msg.includes(dmsg))
                this.dungeonMap.mimicKilled = true
        })
    }

    detectDeath(info) {
        let player = ChatLib.removeFormatting(info).split(" ")[0];
        for (let p of this.players) {
            if (p.username === player || p.username == Player.getName() && player.toLowerCase() === 'you') {
                p.deaths++;
            }
        }

        this.dungeonMap.scanFirstDeathForSpiritPet(player);
    }

    showRunOverview(end) {
        if (end.includes("Stats")) return

        this.dungeonFinished = true

        if (!settings.settings.clearedRoomInfo) return
        this.players.forEach(p => p.updateCurrentSecrets())

        Client.scheduleTask(5 * 20, () => { // Wait 5 seconds (5*20tps)
            ChatLib.chat(MESSAGE_PREFIX + "Cleared room counts:")
            this.players.forEach(p => {
                let mess = new Message()
                mess.addTextComponent(new TextComponent(MESSAGE_PREFIX_SHORT + "&3" + p.username + "&7 cleared "))

                let roomLore = ""
                p.roomsData.forEach(([players, room]) => {
                    let name = room.data?.name ?? room.shape
                    let type = room.typeToName()
                    let color = room.typeToColor()

                    let stackStr = players.length === 1 ? "" : " Stacked with " + players.filter(pl => pl !== p).map(p => p.username).join(", ")

                    roomLore += `&${color}${name} (${type})${stackStr}\n`
                })

                mess.addTextComponent(new TextComponent("&6" + p.minRooms + "-" + p.maxRooms).setHover("show_text", roomLore.trim()))

                mess.addTextComponent(new TextComponent("&7 rooms | &6" + p.secretsCollected + "&7 secrets"))

                mess.addTextComponent(new TextComponent("&7 | &6" + p.deaths + "&7 deaths"))

                mess.chat()
            })
        });
    }

    decreaseKeyCount() {
        this.dungeonMap.keys--;
    }

    increaseKeyCount() {
        this.dungeonMap.keys++;
    }

    openBloodDoor() {
        this.dungeonMap.bloodOpen = true;
        this.decreaseKeyCount();
    }


}
//&r&r&r                     &r&cThe Catacombs &r&8- &r&eFloor I Stats&r
//&r&r&r               &r&cMaster Mode Catacombs &r&8- &r&eFloor III Stats&r
//&r&r&r                         &r&cThe Catacombs &r&8- &r&eFloor V&r

this.triggers.push(register("entityDeath", (entity) => {
    if (entity.getClassName() !== "EntityBlaze") return
    this.deadBlazes++;
    if (this.deadBlazes === 10) {
        this.roomsArr.forEach(room => {
            if (room.data?.name?.toLowerCase() === 'higher or lower') {
                room.checkmarkState = room.currentSecrets ? Room.COMPLETED : Room.CLEARED;
            }
        })

        this.sendSocketData({ type: "blazeDone" })
    }
}))
this.triggers.push(register("entityDeath", (entity) => {
    if (entity.getClassName() !== "EntityZombie") return
    let e = entity.getEntity()
    if (!e.func_70631_g_()) return // .isChild()

    // Check all armor slots, if they are all null then mimic is die!
    if ([0, 1, 2, 3].every(a => e.func_82169_q(a) === null)) {
        // ChatLib.chat("Mimic Kapow!")
        this.mimicKilled = true
        this.sendSocketData({ type: "mimicKilled" })
    }
}))


this.triggers.push(register("step", () => {
    this.pingIdFuncs.forEach(([timestamp, callback], id) => {
        if (Date.now() - timestamp < 5000) return

        callback(false)
        this.pingIdFuncs.delete(id)
    })
}).setFps(1))

// On dungeon start
// this.triggers.push(register("chat", () => {
//     // wait 2 secs
//     Client.scheduleTask(2 * 20, () => {
//         // update all player classes
//         this.players.forEach(p => {
//             p.updateDungeonClass().updatePlayerColor()
//         })
//     })
// }).setChatCriteria("&r&aDungeon starts in 1 second.&r"))

