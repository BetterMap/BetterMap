import Position from "../Utils/Position.js"
import MapPlayer from "./MapPlayer.js"
import Room from "./Room.js"

import { getScoreboardInfo, getTabListInfo, getRequiredSecrets } from "../Utils/Score"
import Door from "./Door.js"
import DungeonRoomData from "../Data/DungeonRoomData.js"
import { changeScoreboardLine, dungeonOffsetX, dungeonOffsetY, MESSAGE_PREFIX, MESSAGE_PREFIX_SHORT, renderLore, getPlayerName, getCore, getHighestBlock, getComponentFromPos, Checkmark, chunkLoaded } from "../Utils/Utils.js"
import socketConnection from "../socketConnection.js"
import DataLoader from "../Utils/DataLoader.js"
import { fetch } from "../Utils/networkUtils.js"
import renderLibs from "../../guimanager/renderLibs.js"
import settings from "../Extra/Settings/CurrentSettings.js"
import { RoomEvents, toDisplayString } from "./RoomEvent.js"
import RoomComponent from "../Utils/RoomComponent.js"

let PlayerComparator = Java.type("net.minecraft.client.gui.GuiPlayerTabOverlay").PlayerComparator
let c = PlayerComparator.class.getDeclaredConstructor()
c.setAccessible(true);
let sorter = c.newInstance()

class DungeonMap {
    constructor(floor, deadPlayers, registerEvents = true) {
        /**
         * Maps Rooms to their RoomComponents, making for fast lookups. DO NOT create new RoomComponents. Only use the ones in roomComponentArray.
         * @type {Map<RoomComponent, Room>}
         */
        this.rooms = new Map()
        this.roomComponentArray = []
        this.scannedComponents = new Set() // For scanning, don't wanna re-scan a position multiple times
        this.unknownPuzzles = new Set() // Set of Rooms which are Room.PUZZLE and have no room data

        // Initialize the array of Positions, every spot in the 6x6 area where a room can be
        for (let i = 0; i < 36; i++) {
            let x = i%6
            let z = Math.floor(i/6)
            let rx = -185 + x * 32
            let rz = -185 + z * 32
            let component = new RoomComponent(rx, rz, this)
            this.roomComponentArray.push(component)
        }
        /**
         * @type {Map<String, Door>} The string is in form x,y eg 102,134 and will correspond to the top left corner of a door
         */
        this.doors = new Map()

        /**
         * @type {Set<Door>} A set of all wither doors in the dungeon
         */
        this.witherDoors = new Set()

        this.fullRoomScaleMap = 0 // How many pixels on the map is 32 blocks
        this.widthRoomImageMap = 0 // How wide the main boxes are on the map

        /**
         * @type {Set<Room>} So that its easy to loop over all rooms without duplicates
         */
        this.roomsArr = new Set()

        this.floor = floor // Eg "M2" or "E" or "F7"
        this.floorNumber = this.floor == "E" ? 0 : parseInt(this.floor[this.floor.length - 1])

        this.deadPlayers = deadPlayers
        this.playerNick = null;

        this.lastChanged = Date.now()

        this.dungeonTopLeft = undefined

        /**
         * @type {Array<MapPlayer>}
         */
        this.players = []
        this.playersNameToId = {}

        this.cachedScore = {
            time: 0,
            data: undefined
        }

        this.mimicKilled = false;
        this.firstDeath = false
        this.firstDeathHadSpirit = false

        this.nameToUuid = {
            "you": Player.getUUID().toString()
        }

        this.cursorStoreXY = undefined
        this.dropdownXY = undefined

        // Load from world datra

        this.lastRoomId = undefined
        this.lastChange = 0
        this.roomXY = "0,0"
        this.lastXY = undefined
        this.lastStandingPos = null // Position of where the player was last standing
        this.lastRoomChange = null // Time the player last walked into a new room component

        // Simulate changing bloccks to air to fix green room not having air border around it
        this.setAirLocs = new Set()

        // Set of xyz locations of collected secrets
        this.collectedSecrets = new Set()

        // Rooms that were already identified
        this.identifiedRoomIds = new Set();
        this.identifiedPuzzleCount = 0;

        this.pingIds = 0
        this.pingIdFuncs = new Map()

        this.dungeonFinished = false
        this.deadBlazes = 0;

        this.keys = 0
        this.bloodOpen = false

        // The MapID that represents this dungeon, looked for if the player doesn't have a map in the hotbar.
        this.mapId = undefined;

        //initialize with 0, only if score is below threshold will they get set to 1 then set to 2 after said
        this.broadcast270message = 0;
        this.broadcast300message = 0;

        let mimicDeadMessages = ["$SKYTILS-DUNGEON-SCORE-MIMIC$", "Mimic Killed!", "Mimic Dead!", "Mimic dead!"]

        this.triggers = []
        if (!registerEvents) return

        this.triggers.push(register("chat", (msg) => {
            mimicDeadMessages.forEach(dmsg => {
                if (msg.includes(dmsg)) this.mimicKilled = true
            })
        }).setChatCriteria("&r&9Party &8> ${msg}"))

        // this.triggers.push(register("command", () => {
        //     this.roomsArr.forEach(room => ChatLib.chat(room.toString()))
        // }).setName("sayrooms"))

        this.triggers.push(register("chat", () => {
            this.dungeonFinished = true

            if (!settings.settings.clearedRoomInfo) return
            this.players.forEach(p => p.updateCurrentSecrets())

            Client.scheduleTask(5 * 20, () => { // Wait 5 seconds (5*20tps)
                ChatLib.chat(MESSAGE_PREFIX + "Cleared room counts:")
                this.players.forEach(p => {
                    let final = new Message()
                    final.addTextComponent(new TextComponent(MESSAGE_PREFIX_SHORT + "&3" + p.username + "&7 cleared "))

                    let roomLore = ""
                    p.roomsData.forEach(([players, room]) => {
                        let name = room.name ?? room.shape
                        let type = room.typeToName()
                        let color = room.typeToColor()

                        let stackStr = players.length === 1 ? "" : " Stacked with " + players.filter(pl => pl !== p).map(p => p.username).join(", ")

                        roomLore += `&${color}${name} (${type})${stackStr}\n`
                    })

                    final.addTextComponent(new TextComponent("&6" + p.minRooms + "-" + p.maxRooms).setHover("show_text", roomLore.trim()))

                    final.addTextComponent(new TextComponent("&7 rooms | &6" + p.secretsCollected + "&7 secrets"))

                    final.addTextComponent(new TextComponent("&7 | &6" + p.deaths + "&7 deaths"))

                    final.chat()
                })
            })
        }).setChatCriteria(/^\s*(Master Mode)? ?(?:The)? Catacombs - (Entrance|Floor .{1,3})$/)) // https://regex101.com/r/W4UjWQ/2

        this.triggers.push(register("entityDeath", (entity) => {
            if (entity.getClassName() !== "EntityBlaze") return
            this.deadBlazes++;
            
            if (this.deadBlazes !== 10) return

            this.roomsArr.forEach(room => {
                if (room.name !== 'Blaze') return
                room.checkmarkState = room.currentSecrets ? Checkmark.GREEN : Checkmark.WHITE;
            })

            this.sendSocketData({ type: "blazeDone" })
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

        this.triggers.push(register("chat", (info) => {
            let player = ChatLib.removeFormatting(info).split(" ")[0];
            for (let p of this.players) {
                if (p.username === player || p.username == Player.getName() && player.toLowerCase() === 'you') {
                    p.deaths++;
                }
            }

            this.scanFirstDeathForSpiritPet(player);
        }).setChatCriteria("&r&c ☠ ${info} became a ghost&r&7.&r"));

        this.triggers.push(register("chat", (info) => {
            this.roomsArr.forEach(r => {
                if (r.type !== Room.BLOOD) return

                r.checkmarkState = Room.CLEARED
                this.markChanged()
            })
        }).setChatCriteria("[BOSS] The Watcher: That will be enough for now."))

        this.triggers.push(register("step", () => {
            this.pingIdFuncs.forEach(([timestamp, callback], id) => {
                if (Date.now() - timestamp < 5000) return

                callback(false)
                this.pingIdFuncs.delete(id)
            })
        }).setFps(1))

        this.triggers.push(register("tick", () => {
            this.scanCurrentRoom()
        }))

        this.triggers.push(register("chat", () => {
            this.bloodOpen = true
            this.keys--
        }).setCriteria(/^The BLOOD DOOR has been opened!$/))

        this.triggers.push(register("chat", () => {
            this.keys++
        }).setCriteria(/^(?:\[[\w\+-]+\] )?\w+ has obtained \w+ Key!$/))

        this.triggers.push(register("chat", () => {
            this.keys++
        }).setCriteria(/^A (?:Wither|Blood) Key was picked up!$/))

        this.triggers.push(register("chat", () => {
            this.keys--
        }).setCriteria(/^\w+ opened a WITHER door!$/))
    }
    
    /**
     * 
     * @param {Number} worldX 
     * @param {Number} worldZ 
     * @returns {Room | null}
     */
    getRoomAt(worldX, worldZ) {
        const component = this.getComponentAt(worldX, worldZ)

        return this.rooms.get(component) ?? null
    }

    /**
     * 
     * @param {RoomComponent} component 
     * @returns {Room | null}
     */
    getRoomAtComponent(component) {
        return this.rooms.get(component) ?? null
    }

    /**
     * 
     * @param {Number} arrayX - 0-5
     * @param {Number} arrayY - 0-5
     * @returns {Room | null}
     */
    getRoomAtArrayPos(arrayX, arrayY) {
        const index = arrayX + arrayY * 6
        if (index < 0 || index > 35) return null

        return this.getRoomAtComponent(this.roomComponentArray[index])
    }

    /**
     * 
     * @param {Door} door 
     */
    addDoor(door) {
        this.doors.set(door.position.arrayStr, door)
        this.markChanged()
    }

    /**
     * Adds the room to this dungeon and handles all of the backend shit
     * @param {Room} room 
     */
    addRoom(room) {
        this.roomsArr.add(room)
        room.components.forEach(component => {
            this.rooms.set(component, room)
        })

        if (room.type == Room.PUZZLE && !room.data) {
            this.unknownPuzzles.add(room)
        }

        this.markChanged()
    }

    /**
     * 
     * @param {Room} room 
     */
    deleteRoom(room) {
        this.roomsArr.delete(room)
        room.components.forEach(component => {
            // In case this component got mapped to another room too somehow
            if (this.rooms.get(component) !== room) return

            this.rooms.delete(component)
        })
    }

    /**
     * Merges two rooms. The second room will be merged into the first and the old one will be deleted.
     * @param {Room} room1 
     * @param {Room} room2 
     */
    mergeRooms(room1, room2) {
        this.deleteRoom(room2)

        if (room2.type) room1.type = room2.type

        if (room2.data) {
            room1.setRoomData(room2.data)
        }

        room2.components.forEach(component => room1.addComponent(component))

        this.markChanged()
    }

    /**
     * Checks to see whether both sides of a door have opened rooms
     * @param {Door} door
     */
    shouldDoorBeGray(door) {
        let dx = 0
        let dz = 16
        if (door.horizontal) {
            dx = 16
            dz = 0
        }

        let room1 = this.getRoomAt(door.getX()+dx, door.getZ()+dz)
        let room2 = this.getRoomAt(door.getX()-dx, door.getZ()-dz)

        return !room1 || room1.type == Room.UNKNOWN || !room2 || room2.type == Room.UNKNOWN
    }

    scanCurrentRoom() {
        const currPos = this.getComponentAt(Player.getX(), Player.getZ())
        if (!currPos || !chunkLoaded(currPos.worldX, 68, currPos.worldY)) return

        // [dx, dy, horizontal (for doors)]
        const directions = [
            [0, -16, false], // Up
            [16, 0, true], // Right
            [0, 16, false], // Down
            [-16, 0, true] // Left
        ]

        // Walked into a new component in the dungeon, scan the current room
        if (currPos !== this.lastStandingPos) {
            this.lastStandingPos = currPos
            this.lastRoomChange = Date.now()
        }
        
        
        // Check to see if this room has already been scanned, and get its rotation if needed
        let room = this.getRoomAtComponent(currPos)
        if (room && room.roofHeight && room.data) {
            if (!room.corner) room.findRotationAndCorner()
            return
        }

        if (this.scannedComponents.has(currPos)) return
        this.scannedComponents.add(currPos)

        // const scannedRooms = new Set() // To send via socket after scanning is done
        // const scannedDoors = new Set()
        
        const searched = new Set()
        const queue = [currPos]

        while (queue.length) {
            let component = queue.shift()
            searched.add(component)
            // ChatLib.chat(`Searching ${component}`)

            let worldX = component.worldX
            let worldZ = component.worldY

            let highestBlock = getHighestBlock(worldX, worldZ)
            if (!highestBlock) continue

            if (!room) {
                room = new Room(this, Room.UNKNOWN, [component], highestBlock)
                // scannedRooms.add(room)
                // ChatLib.chat(`Created room ${room}`)
                this.addRoom(room)
            }

            room.roofHeight = highestBlock

            let core = getCore(worldX, worldZ)
            let roomData = DungeonRoomData.getDataFromCore(core)

            if (roomData && !room.data) {
                room.setRoomData(roomData)
                this.markChanged()

            }
            
            if (room.checkmarkState == Checkmark.GRAY) room.checkmarkState = Checkmark.NONE

            for (let dir of directions) {
                let [dx, dz, horizontal] = dir
                
                let newComponent = this.getComponentAt(worldX+dx*2, worldZ+dz*2)
                if (!newComponent) continue // Outside of the dungeon area

                let highest = getHighestBlock(worldX+dx, worldZ+dz)
                if (!highest) continue // Nothing here, no room extension or doors

                let block = World.getBlockAt(worldX+dx, highestBlock, worldZ+dz)
                let block2 = World.getBlockAt(worldX+dx, highestBlock+1, worldZ+dz)

                let doorPos = new Position(worldX+dx, worldZ+dz, this)
                let doorBlock = World.getBlockAt(doorPos.worldX, 69, doorPos.worldY)
                let doorBlockId = doorBlock.type.getID()

                // There is a door here, roof heights do not match, or the block where the door should be is infested stonebrick (Spawn door)
                if (block.type.getID() == 0 || block2.type.getID() !== 0 || (doorBlockId == 97 && doorBlock.getMetadata() == 5)) {
                    let door = this.doors.get(doorPos.arrayStr)
                    if (!door) {
                        door = new Door(Room.UNKNOWN, doorPos, horizontal)
                    }

                    // Add a gray room here if nothing exists already
                    if (!this.getRoomAtComponent(newComponent)) {
                        let newRoom = new Room(this, Room.UNKNOWN, [newComponent], highest)
                        // scannedRooms.add(newRoom)
                        newRoom.checkmarkState = Checkmark.GRAY
                        this.addRoom(newRoom)
                    }

                    // ChatLib.chat(`Door block ${room.name}: ${doorBlockId}`)

                    // Air or barrier blocks
                    if ((doorBlockId == 0 || doorBlockId == 166) && !this.shouldDoorBeGray(door)) door.type = Room.NORMAL
                    else if (doorBlockId == 97) door.type = Room.SPAWN
                    else if (doorBlockId == 173) {
                        door.type = Room.BLACK
                        this.witherDoors.add(door)
                    }
                    else if (doorBlockId == 159) {
                        door.type = Room.BLOOD
                        this.witherDoors.add(door)
                    }

                    // ChatLib.chat(`Added door ${door} from ${room}`)
                    // scannedDoors.add(door)
                    this.addDoor(door)
                    continue
                }   

                // ChatLib.chat(`Adding ${newComponent} to ${room}`)
                
                // Don't want an extra long entrance room
                if (room.type == Room.SPAWN) continue
                
                // Otherwise this is just a room extension, so extend the room outwards!
                room.addComponent(newComponent)
                // scannedRooms.add(room)
                // ChatLib.chat(`Added ${newComponent} to ${room}`)
                this.markChanged()

                if (searched.has(newComponent)) {
                    // ChatLib.chat(`Already searched ${newComponent}`)
                    continue
                }
                queue.push(newComponent)
                // ChatLib.chat(`QUEUE ${newComponent}`)
            }
        }

        // scannedRooms.forEach(room => {
        //     let data = {
        //         type: "newRoom",
        //         components: room.components.map(a => [a.arrayX, a.arrayY]),
        //         roomType: room.type,
        //         cores: room.cores,
        //         roofHeight: room.roofHeight
        //     }
        //     this.sendSocketData(data)
        //     this.socketData(data)
        // })

        // scannedDoors.forEach(door => {
        //     let data = {
        //         type: "newDoor",
        //         x: door.getX(),
        //         z: door.getZ(),
        //         doorType: door.type,
        //         horizontal: door.horizontal
        //     }
        //     this.sendSocketData(data)
        //     this.socketData(data)
        // })

        // this.sendSocketData({
        //     type: "roomLocation",
        //     x, y, rotation, roomId
        // })

    }

    getComponentAtArrayPos(x, z) {
        const index = x + z*6
        
        if (index < 0 || index > 35) return null
        
        return this.roomComponentArray[index]
    }
    
    /**
     * Gets the Position at the given worldX and worldZ coordinate assuming they are inside of the dungeon area
     * will return null if the coord is not inside of the dungeon
     * @param {Number} worldX 
     * @param {Number} worldZ 
     * @returns {Position | null}
     */
    getComponentAt(worldX, worldZ) {
        const [x, z] = getComponentFromPos(worldX, worldZ)
        
        return this.getComponentAtArrayPos(x, z)
    }
    
    socketData(data) {
        // ChatLib.chat(`SOCKET DATA: ${JSON.stringify(data)}`)

        switch (data.type) {
            case "playerLocation":
                let player = this.players[this.playersNameToId[data.username]]
                if (!player) return

                player.setXAnimate(data.x, 350)
                player.setYAnimate(data.z, 350)
                player.setRotateAnimate(data.yaw, 350)
                player.locallyUpdated = Date.now()
                break;

            case "roomSecrets":
                let room = this.getRoomAtArrayPos(data.x, data.y)

                if (!room || room.type === Room.UNKNOWN) return // Current room not loaded yet

                if (room.currentSecrets !== data.min) {
                    room.currentSecrets = data.min
                    room.maxSecrets = data.max

                    this.markChanged() // Re-render map incase of a secret count specific texturing
                }
                break;

            case "newDoor":
                // {type: Door.NORMAL, worldX: 69, worldZ: 69, horizontal: true}
                // let { type, doorType, x, z, horizontal } = data

                // let doorPos = new Position(x, z, this)
                // let door = new Door(doorType, doorPos, horizontal)
                // this.addDoor(door)
                // break;

            case "newRoom":
                // {
                //     let { components, roomType, cores, roofHeight } = data
                    
                //     let componentArr = components.map(([x, y]) => this.getComponentAtArrayPos(x, y))
                //     if (componentArr.some(a => a == null)) return

                    
                //     let room = new Room(this, roomType, componentArr, roofHeight)
                //     if (roomType == Room.UNKNOWN) room.checkmarkState = Checkmark.GRAY

                //     if (cores) {
                //         for (let core of cores) {
                //             if (room.loadFromCore(core)) break
                //         }
                //     }
                    
                //     // Delete existing rooms in this area
                //     componentArr.forEach(component => {
                //         let existingRoom = this.getRoomAtComponent(component)
                //         if (existingRoom) {
                //             this.deleteRoom(existingRoom)
                //             // ChatLib.chat(`&eMerging ${existingRoom} into ${room}`)
                //             this.mergeRooms(room, existingRoom)
                //         }
                //     })
                    
                    

                //     // ChatLib.chat(`&aAdding room from socket: ${room}`)
                        
                //     this.addRoom(room)
                // }
                break;
                
            case "mimicKilled":
                this.mimicKilled = true
                break;
                
            case "blazeDone":
                this.roomsArr.forEach(room => {
                    if (room.name === 'Blaze') {
                        room.checkmarkState = room.currentSecrets ? Checkmark.GRAY : Checkmark.WHITE;
                    }
                })
                break;
                
            case "secretCollect":
                this.collectedSecrets.add(data.location)
                break;
        }
    }

    /*
     * NOTE: the callback function will be given a boolean representing wether the user is using bettermap
     * TODO: Make a server side custom packet to get this info so it doesent require both players to be in a dungeon
     * 
     * @example
     * DungeonMap.pingPlayer("Soopyboo32", (usingMap) => {
     *     if(usingMap){
     *         ChatLib.chat("Soopyboo32 is using bettermap")
     *     }else{
     *         ChatLib.chat("Soopyboo32 is NOT using bettermap")
     *     }
     * })
     */
    pingPlayer(username, callback) {
        if (username === Player.getName()) {
            callback(true) // Server doesent allow sending data to self
            return
        }

        let pingId = this.pingIds++

        this.pingIdFuncs.set(pingId, [Date.now(), callback])

        socketConnection.sendDungeonData({ "data": { "type": "ping", "from": Player.getName(), "id": pingId }, "players": [username] })
    }

    regenRooms() {
        this.doors.clear()
        this.rooms.clear()
        this.roomsArr.clear()
    }

    sendSocketData(data) {
        // ChatLib.chat(`Sending socket data: ${JSON.stringify(data)}`)
        socketConnection.sendDungeonData({ data, players: this.players.map(a => a.username) })
    }

    destroy() {
        this.rooms.clear()
        this.roomsArr.clear()
        this.collectedSecrets.clear()
        this.triggers.forEach(a => a.unregister())
        this.triggers = []
    }

    /**
     * This will re-render all render images
     */
    markChanged() {
        this.lastChanged = Date.now()
    }

    /**
     * Update players from tab list, also sends locations of players in render distance to other players
     */
    updatePlayers() {
        if (!Player.getPlayer()) return; //How tf is this null sometimes wtf 
        let pl = Player.getPlayer().field_71174_a.func_175106_d().sort((a, b) => sorter.compare(a, b)); // Tab player list

        let i = 0;

        let thePlayer = undefined;
        for (let p of pl) {
            if (!p.func_178854_k()) continue;
            let line = p.func_178854_k().func_150260_c();
            // https://regex101.com/r/cUzJoK/3
            line = line.replace(/§./g, ''); //support dungeons guide custom name colors
            let match = line.match(/^\[(\d+)\] (?:\[\w+\] )*(\w+) (?:.)*?\((\w+)(?: (\w+))*\)$/);
            if (!match) continue;
            let [_, sbLevel, name, clazz, level] = match;
            sbLevel = parseInt(sbLevel);
            // This is a tab list line for a player
            let playerName = getPlayerName(Player);
            if (name === playerName || name === this.playerNick) {// Move the current player to end of list
                thePlayer = [p, name, match];
                continue;
            }
            if (!this.players[i]) this.players[i] = new MapPlayer(p, this, name);
            this.players[i].networkPlayerInfo = p;
            this.playersNameToId[name] = i;
            this.players[i].updateTablistInfo(match);

            i++;
        }

        if (thePlayer) {// Move current player to end of list
            let [networkInfo, name, matchObject] = thePlayer;
            if (!this.players[i]) this.players[i] = new MapPlayer(networkInfo, this, name);

            this.players[i].networkPlayerInfo = networkInfo;
            this.playersNameToId[thePlayer[1]] = i;
            if (this.playerNick) this.playersNameToId[Player.getName()] = i;

            this.players[i].updateTablistInfo(matchObject);
        }
        else if (!this.playerNick) {
            //find the players nick
            pl.forEach(playerInfo => {
                if (playerInfo.func_178845_a().getId() == Player.getUUID()) {
                    this.playerNick = playerInfo.func_178845_a().getName();
                }
            })
        }

        for (let player of this.players) {
            let room = player.getRoom(this);
            if (player.currentRoomCache == room) continue;
            if (player.currentRoomCache) player.currentRoomCache.addEvent(RoomEvents.PLAYER_EXIT, player);
            player.currentRoomCache = room;
            room?.addEvent(RoomEvents.PLAYER_ENTER, player);
        }
    }

    /**
     * updates info in tab
     */
    updateTabInfo() {
        // ChatLib.chat(JSON.stringify(settings));
        if (!settings.settings.tabCryptCount && !settings.settings.tabSecretCount && (!settings.settings.tabMimic || this.floorNumber < 6)) return;
        // We pretend it's already done if the settings are disabled
        let modifiedCrypt = !settings.settings.tabCryptCount;
        let modifiedSecrets = !settings.settings.tabSecretCount;
        let modifiedMimic = !settings.settings.tabMimic || this.floorNumber < 6;
        const ChatComponentText = Java.type('net.minecraft.util.ChatComponentText');

        if (!Client.getMinecraft().field_71439_g) return

        let playerInfoList = Client.getMinecraft().field_71439_g.field_71174_a.func_175106_d();
        playerInfoList.forEach((playerInfo) => {
            if (playerInfo.func_178854_k() === null) return;
            let displayName = playerInfo.func_178854_k().func_150254_d();
            if (!modifiedMimic && displayName.includes('Mimic Dead:')) {
                modifiedMimic = true;
                if (displayName.includes('YES')) return;
                if (!this.mimicKilled) return;
                playerInfo.func_178859_a(new ChatComponentText('§r Mimic Dead: ' + (this.mimicKilled ? '§aYES§r' : '§cNO§r')))
            }
            if (!modifiedCrypt && displayName.includes('Crypts:')) {
                modifiedCrypt = true;
                const totalCryptCount = this.roomsArr.reduce((prev, room) => prev + (room.data?.crypts || 0), 0);
                if (displayName.includes('/' + totalCryptCount)) return;
                var newTabLine;
                if (displayName.includes('/')) {
                    newTabLine = displayName.split('/')[0] + '§6/' + totalCryptCount;
                }
                else {
                    newTabLine = displayName + '§6/' + totalCryptCount;
                }
                playerInfo.func_178859_a(new ChatComponentText(newTabLine));
            }
            if (!modifiedSecrets && displayName.includes('Secrets Found:') && !displayName.includes('%')) {
                modifiedSecrets = true;
                const totalSecretCount = this.getScore().totalSecrets || "?"// This.roomsArr.reduce((prev, room) => prev + (room.maxSecrets || 0), 0);
                if (displayName.includes('/' + totalSecretCount)) return;
                var newTabLine;
                if (displayName.includes('/')) {
                    newTabLine = displayName.split('/')[0] + '§b/' + totalSecretCount;
                }
                else {
                    newTabLine = displayName + '§b/' + totalSecretCount;
                }
                playerInfo.func_178859_a(new ChatComponentText(newTabLine));
            }
        })

        // Mimic isnt even in tab yet
        if (!modifiedMimic) {
            let tabInfoList = ['§r Mimic Dead: §cNO'];
            this.addLinesToTabList(tabInfoList, 'Crypt');
        }
    }

    addLinesToTabList = (lines, startCriteria) => {
        const ChatComponentText = Java.type('net.minecraft.util.ChatComponentText');
        let startToInject = false;
        if (!Client.getMinecraft().field_71439_g) return
        let playerInfoList = Client.getMinecraft().field_71439_g.field_71174_a.func_175106_d();
        playerInfoList = [...playerInfoList].sort((first, second) => first.func_178845_a().getName().localeCompare(second.func_178845_a().getName()))
        playerInfoList.forEach((playerInfo) => {
            if (lines.length === 0) return;
            if (playerInfo.func_178854_k() === null) return;
            let displayName = playerInfo.func_178854_k().func_150254_d();
            if (!displayName) return;
            if (displayName.includes(startCriteria)) {
                startToInject = true;
                return;
            }
            if (startToInject) {
                let nextLine = lines.pop();
                playerInfo.func_178859_a(new ChatComponentText(nextLine));
            }
        })
    }

    syncPlayersThruSocket() {
        this.players.forEach(p => p.checkUpdateUUID())

        World.getAllPlayers().forEach(player => {
            let name = getPlayerName(player)
            if (!this.playersNameToId[name]) return
            let p = this.players[name]
            if (!p) return

            p.setX(player.getX())
            p.setY(player.getZ())
            p.setRotate(player.getYaw() + 180)
            p.locallyUpdated = Date.now()
            this.nameToUuid[name] = player.getUUID().toString()

            this.sendSocketData({
                type: "playerLocation",
                username: name,
                x: player.getX(),
                y: player.getY(),
                z: player.getZ(),
                yaw: player.getYaw() + 180
            })
        })
    }

    /**
     * Update players within render distance
     */
    updatePlayersFast() {
        World.getAllPlayers().forEach(player => {
            let playerName = getPlayerName(player);
            let p = this.players[this.playersNameToId[playerName]]
            if (!p) return

            p.setX(player.getX())
            p.setY(player.getZ())
            p.setRotate(player.getYaw() + 180)
            p.locallyUpdated = Date.now()
        })
    }

    /**
     * Update players location/rotation from dungeon rotation
     * @param {Object} deco 
     * @returns 
     */
    loadPlayersFromDecoration(deco) {
        if (!this.dungeonTopLeft) return

        let i = 0
        deco.forEach((icon, vec4b) => {
            if (i > this.players.length) return
            while (!this.players[i] || this.deadPlayers.has(this.players[i].username.toLowerCase())) {
                i++
                if (i > this.players.length) return
            }

            if (Date.now() - this.players[i].locallyUpdated > 1500) {
                let iconX = MathLib.map(vec4b.func_176112_b() - this.dungeonTopLeft[0] * 2, 0, 256, 0, 138)
                let iconY = MathLib.map(vec4b.func_176113_c() - this.dungeonTopLeft[1] * 2, 0, 256, 0, 138)
                let x = iconX / (128 / 6) * 32 - 96
                let y = iconY / (128 / 6) * 32 - 96
                let rot = vec4b.func_176111_d()
                rot = rot * 360 / 16 + 180

                this.players[i].setRotateAnimate(rot)
                this.players[i].setXAnimate(x)
                this.players[i].setYAnimate(y)
            }

            i++
        });
    }

    /**
     * Tries to find the top left of the dungeon map, returns true if successful or false if it fails to find it
     * @param {Number[]} mapColords 
     * @returns 
     */
    loadDungeonTopLeft(mapColors) {
        // Find the top left pixel of the entrance room, the first green pixel which has another green pixel 15 to the right and 15 down
        let thing = mapColors.findIndex((a, i) => a == 30 && i + 15 < mapColors.length && mapColors[i + 7] == 30 && mapColors[i + 15] == 30)
        if (thing == -1) return false

        // Get the room size
        let i = 0
        while (mapColors[thing + i] == 30) i++
        this.widthRoomImageMap = i
        this.roomAndDoorWidth = this.widthRoomImageMap + 4

        // Find the corner of the top left most room on the map
        let x = (thing % 128) % this.roomAndDoorWidth
        let y = Math.floor(thing / 128) % this.roomAndDoorWidth

        // Adjust for Entrance and Floor 1's altered map position
        if ([0, 1].includes(this.floorNumber)) x += this.roomAndDoorWidth
        if (this.floorNumber == 0) y += this.roomAndDoorWidth

        this.dungeonTopLeft = [x, y]
        this.fullRoomScaleMap = Math.floor(this.widthRoomImageMap * 5 / 4)

        return true
    }

    /**
     * Update dungeon from map data
     * @param {Object} mapData 
     * @returns 
     */
    updateFromMap(mapData) {
        if (this.dungeonFinished) return

        //                                    .mapDecorators
        this.loadPlayersFromDecoration(mapData.field_76203_h)
        //                     .colors
        let mapColors = mapData.field_76198_e

        if (!this.dungeonTopLeft && !this.loadDungeonTopLeft(mapColors)) return

        // Includes door colors too
        const roomColors = {
            63: Room.NORMAL,
            30: Room.SPAWN,
            66: Room.PUZZLE,
            82: Room.FAIRY,
            18: Room.BLOOD,
            62: Room.TRAP,
            74: Room.MINIBOSS,
            85: Room.UNKNOWN,
            119: Room.BLACK,
        }

        const checkmarkColors = {
            34: Checkmark.WHITE,
            30: Checkmark.GREEN,
            18: Checkmark.FAILED,
            119: Checkmark.GRAY,
        }
        
        const [x0, y0] = this.dungeonTopLeft

        const offsetSize = Math.floor(this.widthRoomImageMap/2) + 1
        // [dx, dy, dx1, dy1, horizontal] where dx is on-axis with the center of the room, and dx1 is offset slightly
        // if dx exists and dx1 doesn't, then there is a door here, not a room extension.
        const directions = [
            [0, -offsetSize, 5, -offsetSize, false],
            [offsetSize, 0, offsetSize, 5, true],
            [0, offsetSize, -5, offsetSize, false],
            [-offsetSize, 0, -offsetSize, -5, true],
        ]
        
        for (let component of this.roomComponentArray) {
            let dx = component.arrayX
            let dy = component.arrayY
            let cornerX = x0 + this.roomAndDoorWidth * dx
            let cornerY = y0 + this.roomAndDoorWidth * dy

            let roomColor = mapColors[cornerX + cornerY * 128]
            if (!roomColor || !(roomColor in roomColors)) continue // Nothing here! or room color unknown

            let roomCenterX = cornerX + Math.floor(this.widthRoomImageMap / 2)
            let roomCenterY = cornerY + Math.floor(this.widthRoomImageMap / 2)
            let checkColor = mapColors[roomCenterX + roomCenterY * 128]

            // ChatLib.chat(`Checking ${component.arrayX}, ${component.arrayY}`)

            let room = this.getRoomAtComponent(component)

            let newType = roomColors[roomColor]
            let newCheck = checkColor in checkmarkColors ? checkmarkColors[checkColor] : Checkmark.NONE

            if (!room) {
                room = new Room(this, newType, [component])
                room.checkmarkState = newCheck
                // ChatLib.chat(`&bCreated new room &3${room}`)
                this.addRoom(room)
            }

            // White, green, failed checkmarks
            if (newCheck !== Checkmark.GRAY && newCheck !== room.checkmarkState && newCheck !== Checkmark.NONE) {
                room.checkmarkState = newCheck
                this.markChanged()
            }

            // Room type changed
            if (newType !== room.type && newType !== Room.UNKNOWN) {
                room.type = newType

                if (newType == Room.PUZZLE && !room.data) this.unknownPuzzles.add(room)
                    
                this.markChanged()
            }

            // Room went from unopened to opened, get rid of the gray checkmark
            if (room.checkmarkState == Checkmark.GRAY && newType !== Room.UNKNOWN) {
                room.checkmarkState = Checkmark.NONE
                this.markChanged()
            }


            // Branch outwards looking for doors and new rooms
            for (let dir of directions) {
                let [dx, dy, dx1, dy1, horizontal] = dir
                let axisColor = mapColors[roomCenterX + dx + (roomCenterY + dy)*128]
                let offsetColor = mapColors[roomCenterX + dx1 + (roomCenterY + dy1)*128]

                if (!axisColor || !(axisColor in roomColors)) continue // Nothing here

                let doorType = roomColors[axisColor]

                // Door should go here!
                if (axisColor && !offsetColor) {
                    let worldX = component.worldX + Math.sign(dx) * 16
                    let worldZ = component.worldY + Math.sign(dy) * 16
                    let position = new Position(worldX, worldZ, this)
                    // Check if door exists, and update its type (For wither doors)
                    let existingDoor = this.doors.get(position.arrayStr)
                    if (existingDoor) {
                        // Wither door was opened
                        if (existingDoor.type == Room.BLACK && doorType !== Room.BLACK) {
                            this.witherDoors.delete(existingDoor)
                        }
                        if (doorType !== Room.UNKNOWN) existingDoor.type = doorType
                        this.markChanged()
                        continue
                    }
                    
                    let door = new Door(doorType, position, horizontal)
                    this.addDoor(door)
                    if (door.type == Room.BLACK) this.witherDoors.add(door)

                    continue
                }

                // Room extension, no door
                let newWorldX = component.worldX + Math.sign(dx) * 32
                let newWorldZ = component.worldY + Math.sign(dy) * 32
                let newComponent = this.getComponentAt(newWorldX, newWorldZ)

                if (!newComponent) continue
                
                let existingRoom = this.getRoomAtComponent(newComponent)

                // This extension is already part of this room
                if (existingRoom && existingRoom == room) continue

                if (!existingRoom) {
                    room.addComponent(newComponent)
                    this.markChanged()
                    continue
                }

                this.mergeRooms(existingRoom, room)
                continue
            }
        }
    }

    updatePuzzles() {
        if (!this.unknownPuzzles.size) return
        // let puzzleNames = []
        if (!TabList) return
        
        let names = []
        try {
            names = TabList.getNames() // Sometimes this has a null pointer exception inside the function?
        } catch (_) {
            return
        }
        const puzStart = names.findIndex(a => a.removeFormatting().match(/^Puzzles: \(\d+\)$/))
        if (puzStart == -1) return
        
        const replacements = {
            "Higher Or Lower": "Blaze"
        }
        
        let unknownPuzArr = [...this.unknownPuzzles]

        // The five lines after the "Puzzles: (3)" line
        const puzLines = names.slice(puzStart + 1, puzStart + 6).map(a => a.removeFormatting())
        puzLines.forEach(line => {
            // https://regex101.com/r/qhNs78/1
            let match = line.match(/^ ([\w? ]+)+: \[(.)\] (?:\(.+\))?$/)
            if (!match) return
            
            let [_, name, status] = match
            if (name == "???") return
            if (name in replacements) name = replacements[name]

            let found = false
            for (let room of this.roomsArr) {
                // This puzzle has already been identified
                if (room.name == name) {
                    found = true
                    break
                }
            }
            if (!found) {
                let identifiedPuz = unknownPuzArr.shift()
                identifiedPuz.name = name
                this.unknownPuzzles.delete(identifiedPuz)
            }
        })
    }

    /**
     * @returns {{"skill": Number,"exploration": Number,"time": Number,"bonus": Number,"total": Number,"mimic": Boolean,"secretsFound": Number, "crypts": Numbers, "deathPenalty": Number, "totalSecrets": Number, "minSecrets": Number, "totalCrypts": Number}}
     */
    getScore() {
        // Update score calculations every 500ms
        if (Date.now() - this.cachedScore.time < 500) return this.cachedScore.data

        let exploration = 0;
        let time = 100; // TODO:  Figure out how to actually do this one
        let skill = 0;
        let bonus = 0;

        // If floor is enterance the floor integer entered should be 0
        let requiredSecrets = getRequiredSecrets(parseInt(this.floor[this.floor.length - 1]) || 0, this.floor[0] === "M");
        let roomCompletion = getScoreboardInfo();
        let [secrets, crypts, deaths, unfinshedPuzzles, completedRoomsTab, collectedSecrets] = getTabListInfo();
        let completedRooms = [...this.rooms.values()].reduce((a, b) => b.isCleared() ? a + 1 : a, 0)

        // If map data is incomplete, it's worth using the higher number
        completedRooms = Math.max(completedRooms, completedRoomsTab);

        // Estimate total room count based of the cleared percentage and the tab info. If nothing is cleared, assume 36 rooms
        totalRoomEstimate = roomCompletion ? Math.round(completedRoomsTab / roomCompletion * 100) : 36;

        // Exploration
        exploration += Math.min(40, ~~(secrets / requiredSecrets * 40));
        exploration += Math.min(60, ~~(completedRooms / totalRoomEstimate * 60));

        // Time
        // NOPE

        // Skill
        skill += ~~(completedRooms / totalRoomEstimate * 80) - unfinshedPuzzles * 10;
        skill -= deaths * 2;
        if (this.firstDeathHadSpirit) skill += 1

        // Cant physically drop below 20 score, no matter what
        skill = Math.max(0, skill);
        skill += 20;

        // Bonus
        bonus += Math.min(5, crypts);
        if (this.floorNumber >= 6 && this.mimicKilled) bonus += 2;

        let paul = DataLoader.currentMayorPerks.has("EZPZ") || settings.settings.forcePaul

        if (paul) bonus += 10

        let totalCryptCount = this.roomsArr.reduce((prev, room) => prev + (room.data?.crypts || 0), 0);

        let totalSecrets = Math.round(collectedSecrets / (secrets / 100))

        let deathPenalty = deaths * 2 - this.firstDeathHadSpirit // FirstDeathHadSpirit gets coerced to number (0 or 1)

        let minSecrets = Math.ceil(totalSecrets * requiredSecrets / 100 * ((40 - bonus + deathPenalty) / 40))

        let total = skill + exploration + time + bonus;

        let shouldAllow300Message = settings.settings.showScoreMessage === "at300" || settings.settings.showScoreMessage === "always"
        let shouldAllow270Message = settings.settings.showScoreMessage === "at270" || settings.settings.showScoreMessage === "always"

        if (settings.settings.showScoreMessage === "automatic") {
            shouldAllow270Message = this.floorNumber <= 5
            shouldAllow300Message = this.floorNumber >= 5 || this.floor === "M4"
        }

        if (shouldAllow300Message && total >= 300 && this.broadcast300message === 1) {
            this.broadcast300message = 2;
            ChatLib.command('pc ' + settings.settings.custom300scoreMessage);
        } else if (shouldAllow270Message && total >= 270 && this.broadcast270message === 1) {
            this.broadcast270message = 2;
            ChatLib.command('pc ' + settings.settings.custom270scoreMessage);
        }

        if (total < 270 && this.broadcast270message === 0)
            this.broadcast270message = 1;
        if (total < 300 && this.broadcast300message === 0)
            this.broadcast300message = 1;

        this.cachedScore = {
            time: Date.now(),
            data: {
                "skill": skill,
                "exploration": exploration,
                "time": time,
                "bonus": bonus,
                "total": total,
                "mimic": this.mimicKilled,
                "secretsFound": collectedSecrets,
                "crypts": crypts,
                "deathPenalty": deathPenalty,
                "totalSecrets": totalSecrets,
                "minSecrets": minSecrets,
                "totalCrypts": totalCryptCount
            }
        }

        return this.cachedScore.data
    }

    scanFirstDeathForSpiritPet(username) {
        if (this.firstDeath) return;
        this.firstDeath = true;

        if (!this.nameToUuid[username.toLowerCase()]) return;
        let uuid = this.nameToUuid[username.toLowerCase()]?.replace(/-/g, "");

        const printSpiritMessage = () => {
            if (this.firstDeathHadSpirit) return ChatLib.chat(`${MESSAGE_PREFIX}${username} ${username == "You" ? "do" : "does"} have a spirit pet.`);
            ChatLib.chat(`${MESSAGE_PREFIX}${username} ${username == "You" ? "do" : "does"} not have a spirit pet.`);
        };

        fetch(`https://api.tenios.dev/spiritPet/${uuid}`).json((spirit) => {
            this.firstDeathHadSpirit = spirit
            printSpiritMessage();
        });
    }

    canUpdateRoom() {
        return Date.now() - this.lastRoomChange > 1500
    }

    secretCountActionBar(found, total) {
        if (!this.canUpdateRoom()) return

        let currentRoom = this.getCurrentRoom()
        if (!currentRoom || currentRoom.type === Room.UNKNOWN) return; // Current room not loaded yet

        // Secret count is already updated for this room
        if (currentRoom.currentSecrets == found && currentRoom.maxSecrets == total) return

        currentRoom.maxSecrets = total
        currentRoom.currentSecrets = found

        if (currentRoom.checkmarkState === Room.CLEARED && currentRoom.currentSecrets >= currentRoom.maxSecrets) currentRoom.checkmarkState = Room.COMPLETED;

        this.markChanged() // Re-render map incase of a secret count specific texturing

        const currentComponent = this.getComponentAt(Player.getX(), Player.getZ())
        const x = currentComponent.arrayX
        const y = currentComponent.arrayY

        this.sendSocketData({
            type: 'roomSecrets',
            min: found,
            max: total,
            x,
            y
        })
    }

    /**
     * Transforms world coords to relative coords. If the coords are not in a known room, returns null
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     */
    toRelativeCoords(x, y, z) {
        let room = this.getRoomAt(x, z)
        if (!room) return null;

        return room.getRelativeCoords(x, y, z);
    }

    getCurrentRoom() {
        return this.getRoomAt(Player.getX(), Player.getZ())
    }

    roomGuiClicked(context, cursorX, cursorY, button, isPress) {
        // if (!isPress) return

        // if (this.dropdownXY) {
        //     dungeonMapButtons.forEach(([name, callback], index) => {

        //         let bx = this.dropdownXY[0] + 1
        //         let by = this.dropdownXY[1] + 25 * index + 1
        //         let bw = 73
        //         let bh = 23

        //         let hovered = cursorX >= bx && cursorX <= bx + bw && cursorY >= by && cursorY <= by + bh

        //         if (hovered) {
        //             callback(this, this.dropdownXY[2])
        //         }
        //     })
        //     this.dropdownXY = undefined
        //     return
        // }

        // if (button === 1) { // Right click -> store x, y and render even if chat not open
        //     this.dropdownXY = undefined
        //     if (this.cursorStoreXY) this.cursorStoreXY = undefined
        //     else this.cursorStoreXY = [cursorX, cursorY]
        //     return
        // }

        // let { x, y, size } = context.getMapDimensions();
        // const borderPixels = 27 / 256 * size;
        // if (cursorX < x + borderPixels || cursorY < y + borderPixels || cursorX > x + size - borderPixels || cursorY > y + size - borderPixels) return;

        // // Mouse somewhere on map
        // let worldX = (((cursorX - x - context.borderWidth) / context.size * context.getImageSize(this.floor) - context.paddingLeft - context.roomSize / 2 - context.roomGap / 2) / context.blockSize + 0.5) * 32 - 200
        // let worldY = (((cursorY - y - context.borderWidth) / context.size * context.getImageSize(this.floor) - context.paddingTop - context.roomSize / 2 - context.roomGap / 2) / context.blockSize + 0.5) * 32 - 200

        // let coordsX = ~~((worldX + 200) / 32)
        // let coordsY = ~~((worldY + 200) / 32)

        // if (!this.rooms.has(coordsX + ',' + coordsY)) return // No room at mouse

        // let room = this.rooms.get(coordsX + ',' + coordsY); // Hovered room

        // if (button !== 0) return // Ignore buttons like middle mouse

        // this.dropdownXY = [cursorX + 8, cursorY - 16, room]
        // this.cursorStoreXY = undefined

    }

    drawRoomTooltip(context, cursorX, cursorY) {
        let { x, y, size } = context.getMapDimensions();

        if (this.dropdownXY) {
            let width = 125
            Renderer.retainTransforms(true)
            Renderer.translate(0, 0, 1000)
            Renderer.drawRect(Renderer.color(0, 0, 0), this.dropdownXY[0], this.dropdownXY[1], width, 25 * dungeonMapButtons.length)

            dungeonMapButtons.forEach(([name, callback], index) => {

                let bx = this.dropdownXY[0] + 1
                let by = this.dropdownXY[1] + 25 * index + 1
                let bw = width - 2
                let bh = 23

                let hovered = cursorX >= bx && cursorX <= bx + bw && cursorY >= by && cursorY <= by + bh

                Renderer.drawRect(Renderer.color(hovered ? 100 : 50, hovered ? 100 : 50, hovered ? 100 : 50), bx, by, bw, bh)

                let scale = Math.min(1, (bw - 4) / Renderer.getStringWidth(ChatLib.removeFormatting(name)))
                renderLibs.drawStringCenteredFull(name, bx + bw / 2, by + bh / 2, scale)
                Renderer.scale(1 / scale, 1 / scale)
            })
            Renderer.retainTransforms(false)
            return
        }

        if (cursorX < x || cursorY < y || cursorX > x + size || cursorY > y + size) return;

        // Mouse somewhere on map

        let worldX = (((cursorX - x - context.borderWidth) / context.size * context.getImageSize(this.floor) - context.paddingLeft - context.roomSize / 2 - context.roomGap / 2) / context.blockSize + 0.5) * 32 - 200
        let worldY = (((cursorY - y - context.borderWidth) / context.size * context.getImageSize(this.floor) - context.paddingTop - context.roomSize / 2 - context.roomGap / 2) / context.blockSize + 0.5) * 32 - 200

        if (((worldX + 200) / 32) < 0) return
        if (((worldY + 200) / 32) < 0) return

        // const [coordsX, coordsY] = getComponentFromPos(worldX, worldY)
        // const component = this.getComponentAt(worldX, worldZ)
        const room = this.getRoomAt(worldX, worldY)
        if (!room) return

        // No room at mouse
        // if (!this.rooms.has(component)) return

        // let room = this.rooms.get(component);

        let roomLore = room.getLore()

        renderLore(cursorX, cursorY, roomLore)

    }

    getCurrentRoomData() {
        const room = this.getCurrentRoom()
        if (!room) return null

        return room.data
    }

    onSecretCollect(type, x, y, z) {
        let loc = `${x},${y},${z}`

        let currentRoom = this.getCurrentRoom()
        if (!currentRoom || !currentRoom.corner) return

        if (type === "bat" && currentRoom?.data) {
            let closestD = Infinity
            currentRoom.data.secret_coords?.bat?.forEach((pos) => {
                let actualPos = currentRoom.getRealCoord(pos)
                if (!actualPos) return

                let [x2, y2, z2] = actualPos

                if (this.collectedSecrets.has(x2 + "," + y2 + "," + z2)) return
                let distance = (x2 - x) ** 2 + (y2 - y) ** 2 + (z2 - z) ** 2
                if (distance < closestD) {
                    closestD = distance
                    loc = x2 + "," + y2 + "," + z2
                }
            });
        }
        if (type === "item" && currentRoom?.data) {
            let closestD = 25

            currentRoom.data.secret_coords?.item?.forEach((pos) => {
                let actualPos = currentRoom.getRealCoord(pos)
                if (!actualPos) return

                let [x2, y2, z2] = actualPos

                if (this.collectedSecrets.has(x2 + "," + y2 + "," + z2)) return
                let distance = (x2 - x) ** 2 + (y2 - y) ** 2 + (z2 - z) ** 2
                if (distance < closestD) {
                    closestD = distance
                    loc = x2 + "," + y2 + "," + z2
                }
            });
        }

        this.collectedSecrets.add(loc)
        this.sendSocketData({ type: "secretCollect", location: loc })
    }

    updateScoreboardScore() {
        if (!settings.settings.fixScore) return;
        let lines = Scoreboard?.getLines();
        let score = this.cachedScore?.data?.total;
        if (!score) return;
        if (!lines || !lines.length) return
        for (let i = 0; i < lines.length; i++) {
            let cleanedLine = lines[i].getName().removeFormatting().replace(/[^\x00-\x7F]/g, "")
            // https://regex101.com/r/bIMFjc/1
            let match = cleanedLine.match(/^Cleared: (\d+)% \((\d+)\)$/)
            if (!match) continue
            let [_, completion, wrong_score] = match
            let scoreboardScore = lines[i].getPoints()
            changeScoreboardLine(scoreboardScore, `§rCleared: §c${completion}% §7(§b${score}§7)`, false);
            return
        }
    }
}

export default DungeonMap


let dungeonMapButtons = [
    ["Show RoomInfo In Chat", (dungeonMap, clickedRoom) => {
        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
        clickedRoom.getLore().forEach(l => ChatLib.chat(l))
        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
    }],
    ["Show RoomEvents In Chat", (dungeonMap, clickedRoom) => {
        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
        for (let event of clickedRoom.roomEvents) {
            ChatLib.chat(toDisplayString(clickedRoom, event))
        }
        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
    }],
    ["Navigate", (dungeonMap, clickedRoom) => { ChatLib.chat("NAVIGATION NOT ADDED YET D:") }]
]