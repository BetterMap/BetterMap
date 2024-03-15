import FakePlayer from './FakePlayer'

export default class Replay {

    constructor() {
        this.states = [];
        this.replayIndex = 0;
        //record a state every n ticks
        this.tickRate = 2;
        this.tickRateCounter = 1;
        this.fakePlayer = new FakePlayer();
    }

    addState(state) {
        if (this.tickRateCounter !== this.tickRate) {
            this.tickRateCounter++;
            return;
        }
        this.states.push(state);
        this.tickRateCounter = 1;
    }

    replay() {
        if (this.replayIndex % this.tickRate !== 0) {
            this.replayIndex++; 
            return;
        }
        if (this.replayIndex >= this.states.length) {
            return true;
        }
        let state = this.states[this.replayIndex];
        if (this.replayIndex === 0) {
            this.fakePlayer.init(state);
        } else {
            this.fakePlayer.moveToPosition(state);
        }
        if (state.swinging) this.fakePlayer.swing();
        this.fakePlayer.setHeldItem(state.heldItem);
        this.fakePlayer.setSneaking(state.isSneaking);
        //increment replay position
        this.replayIndex++;
        return this.replayIndex >= this.states.length;
    }

    reset() {
        this.replayIndex = 0;
        this.fakePlayer.removeFromWorld();
    }
}