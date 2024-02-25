import Replay from './Model/Replay';
import PlayerState from './Model/PlayerState';

let replays = [];
let recording = false;
let replaying = false;
let currentReplay = null;

register('command', () => {
    routeStack = [];
    recording = true;
    currentReplay = new Replay();
}).setName('startRouteRecording');

register('command', () => {
    recording = false;
    replays.push(currentReplay);
}).setName('endRouteRecording');

register('command', () => {
    replaying = true;
}).setName('runReplay');

register('tick', () => {
    if (recording) {
        currentReplay.addState(new PlayerState(Player));
    }

    if (replaying) {
        replays.forEach(replay => {
            if (replay.replay()) {
                replay.reset();
                replaying = false;
            }
        });
    }

});