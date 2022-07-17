
import { getScoreboardInfo, getTabListInfo, getRequiredSecrets } from "./Utils/Score"

register('command', (rooms) => {


    let exploration = 0;
    let time = 100; //TODO:  Figure out how to actually do this one
    let skill = 0;
    let bonus = 0;

    let requiredSecrets = getRequiredSecrets(7, false);
    let roomCompletion = getScoreboardInfo();
    let [secrets, crypts, deaths, unfinshedPuzzles, completedRoomsTab] = getTabListInfo();
    let completedRooms = this.rooms?.filter(r => r.isCleared())?.length ?? rooms;

    //if map data is incomplete, it's worth using the higher number
    completedRooms = Math.max(completedRooms, completedRoomsTab);

    //estimate total room count based of the cleared percentage and the tab info. If nothing is cleared, assume 36 rooms
    totalRoomEstimate = roomCompletion ? Math.round(completedRoomsTab / roomCompletion * 100) : 36;

    //exploration
    exploration += Math.min(40, ~~(secrets / requiredSecrets * 40));
    exploration += Math.min(60, ~~(completedRooms / totalRoomEstimate * 60));

    //time
    //NOPE

    //skill
    //TODO: Check for spirit pet through API
    skill += ~~(completedRooms / totalRoomEstimate * 80) - unfinshedPuzzles * 10;
    skill -= deaths * 2;
    //cant physically drop below 20 score, no matter what
    skill = Math.max(0, skill);
    skill += 20;

    //bonus
    bonus += Math.min(5, crypts);
    if (this.floor >= 6 && this.mimicKilled)
        bonus += 2;
    //TODO: Check for Paul through API
    //TODO: Add toggle to check add +10 score anyway, cause of jerry mayor
    ChatLib.chat(JSON.stringify([exploration, time, skill, bonus]));
    return [exploration, time, skill, bonus]
}).setName('testScore');