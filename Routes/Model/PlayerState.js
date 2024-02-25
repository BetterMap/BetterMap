export default class PlayerState {

    constructor(player) {
        this.x = player.getX();
        this.y = player.getY();
        this.z = player.getZ();
        this.yaw = player.getYaw();
        this.pitch = player.getPitch();
        this.head = player.getPlayer().field_70125_A;
    }


}