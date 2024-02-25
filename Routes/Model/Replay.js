import FakePlayer from './FakePlayer'

export default class Replay {

    constructor() {
        this.states = [];
        this.replayIndex = 0;
        this.fakePlayer = new FakePlayer();
    }

    addState(state) {
        this.states.push(state);
    }

    replay() {
        if(this.replayIndex >= this.states.length){
            return true;
        }
        let state = this.states[this.replayIndex];
        if(this.replayIndex === 0) {
            this.fakePlayer.init(state);
        } else {
            this.fakePlayer.moveToPosition(state);
        }
        //increment replay position
        this.replayIndex++;
        return this.replayIndex >= this.states.length;
    }

    reset() {
        this.replayIndex = 0;
        this.fakePlayer.removeFromWorld();
    }
}