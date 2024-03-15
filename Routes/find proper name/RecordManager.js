
export default class RecordManager {

    constructor() {
        this.records = JSON.parse(FileLib.read("soopyAddonsData", "bettermapPbData.json") || "{}");
    }

    saveRecords() {
        new Thread(() => {
            FileLib.write("soopyAddonsData", "bettermapsettings.json", JSON.stringify(this.currentSettings))
        }).start();
    }

    updateRecord(roomId, full, secrets) {
        const recordData = records[roomId] || { full, secrets };
    }

    startTracking(roomId) {
        this.trackedRoomId = roomId;
        this.startTime = Date.now();
        this.completeSecrets = false;
        this.completeClear = false;
    }

    completeSecrets()  {
        this.completeSecrets = true;
        this.secretTime = Date.now();
    }

    completeClear() {
        this.completeClear = true;
        this.clearTime = Date.now();
    }

}