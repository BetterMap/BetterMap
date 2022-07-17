import {m} from "../../mappings/mappings"

/**
 * @param {Number} id id of the line that should be changed 
 * @param {String} line text that the line should be changed to
 */
function changeScoreboardLine(id, line){
    let scoreboard = World.getWorld()[m.getScoreboard.World]();
    for (let team of scoreboard[m.getTeams]()) {
        let name = team[m.getTeamName]();
        if (name.includes('team') && name.includes(id)) {
            let prefix = line.substring(0, 15);
            let suffix = line.substring(15, 30);
            team.func_96666_b(prefix); //team.setPrefix()
            team.func_96662_c(suffix); //team.setSuffix()
        }
    }
} 

export default changeScoreboardLine