// Creating JSON code to create a dummy map
console.log(`let dungeon = new DungeonMap("F7", new Set(), false);`)
// NOTE: you need to add the global. back before running this
for (let room of global.betterMapDungeonMap.roomsArr) {
    console.log(`{`)
    console.log(`   let r = new Room(dungeon, ${room.type}, [${room.components.map(a => "new Position(" + a.worldX + ", " + a.worldY + ")").join(",")}], ${JSON.stringify(room.roomId)});`)
    console.log(`   r.currentSecrets = ${room.currentSecrets};`)
    console.log(`   r.checkmarkState = ${room.checkmarkState};`)
    console.log(`   dungeon.roomsArr.add(r);`)
    console.log(`   r.components.forEach(c => {
        dungeon.rooms.set(c.arrayX + "," + c.arrayY, r);
    });`)
    console.log(`}`)
}
for (let data of global.betterMapDungeonMap.doors.entries()) {
    let [key, door] = data
    console.log(`{`)
    console.log(`   let d = new Door(${door.type}, new Position(${door.position.worldX}, ${door.position.worldY}), ${door.horisontal});`)
    console.log(`   dungeon.doors.set("${key}", d);`)
    console.log(`}`)
}

// TODO: players need custom thing cus skin cant be loaded from tab in settings menu
// Or maby just keep not showing players in the gui lol

console.log(`return dungeon;`)