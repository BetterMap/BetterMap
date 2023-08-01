

/**
 * Returns the percentage of total secrets required to get the maximum exploration score for secrets.
 * @param {Number} floor The floor number
 * @param {Boolean} masterMode true if mastermode 
 * @returns {Number} the percentage of secrets needed eg 50 = 50%
 */
function getRequiredSecrets(floor, masterMode) {

    if (masterMode) return 100;
    switch (floor) {
        case 1:
            return 30;
        case 2:
            return 40;
        case 3:
            return 50;
        case 4:
            return 60;
        case 5:
            return 70;
        case 6:
            return 85;
        default:
            return 100;
    }
}

function getTabListInfo() {
    let secrets = 0;
    let crypts = 0;
    let deaths = 0;
    let puzzleCount = 0;
    let unfinishedPuzzles = 0;
    let completedRooms = 36;
    let collectedSecrets = 0

    TabList.getNames().forEach((line) => {
        cleanedLine = ChatLib.removeFormatting(line).trim();
        if (cleanedLine.includes('Secrets Found:')) {
            if (cleanedLine.includes('%')) {
                let secretString = cleanedLine.split(' ')[2]
                secretString = secretString.substring(0, secretString.length - 1)
                secrets = parseFloat(secretString); // Secrets percentage
            } else {
                collectedSecrets = parseInt(cleanedLine.split(' ')[2]) // Secrets number
            }
        } else if (cleanedLine.includes('Crypts:')) {
            let cryptString = cleanedLine.split(' ')[1]
            crypts = parseInt(cryptString)
        } else if (cleanedLine.includes('Team Deaths:')) {
            let deathString = cleanedLine.split(' ')[2];
            deathString = deathString.substring(1, deathString.length - 1);
            deaths = parseInt(deathString);
        } else if (cleanedLine.includes('Completed Rooms:')) {
            completedRoomString = cleanedLine.split(' ')[2];
            completedRooms = parseInt(completedRoomString);
        } else if (cleanedLine.includes('Puzzles:')) {
            puzzleCountString = cleanedLine.split(' ')[1];
            puzzleCountString = puzzleCountString.substring(1, puzzleCountString.length - 1);
            puzzleCount = parseInt(puzzleCountString);
            unfinishedPuzzles = puzzleCount;
        } else if (puzzleCount > 0) {
            if (cleanedLine.includes('[✔]')) {
                unfinishedPuzzles--;
            }
            puzzleCount--;
        }
    });

    return [
        secrets,
        crypts,
        deaths,
        unfinishedPuzzles,
        completedRooms,
        collectedSecrets
    ]
}

function getScoreboardInfo() {
    let completion = 0;
    let scoreboardLines = Scoreboard.getLines();
    if (scoreboardLines.length === 0)
        return completion;
    for (let line of scoreboardLines) {
        let cleanedLine = ChatLib.removeFormatting(line.toString()).replace(/[^\x00-\x7F]/g, "");
        if (cleanedLine.includes('Cleared:')) {
            let parts = cleanedLine.split(' ');
            let partString = parts[1].substring(0, parts[1].length - 1)
            completion = parseInt(partString);
            break;
        }
    }

    return completion;
}

module.exports = {
    getScoreboardInfo: getScoreboardInfo,
    getTabListInfo: getTabListInfo,
    getRequiredSecrets: getRequiredSecrets
}
