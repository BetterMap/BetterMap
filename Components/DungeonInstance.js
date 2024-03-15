import ChatUpdater from "../Updater/ChatUpdater";
import TabListUpdater from "../Updater/TabListUpdater";
import DungeonMap from "./DungeonMap";

export default class DungeonInstance {

    constructor(registerEvents = true) {
        this.dungeonMap = new DungeonMap();
        this.players = new PlayerManager();

        this.score = new Score(this.dungeonMap);

        this.updaters = [
            new TabListUpdater(this.dungeonMap),
            new HotbarMapUpdater(),
            new PlayerUpdater(),
            new SocketUpdater(),
            new ChatUpdater(this.dungeonMap, this.players, registerEvents)
        ];


    }


}