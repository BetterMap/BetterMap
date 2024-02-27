export default class PlayerState {

    constructor(player) {
        this.x = player.getX();
        this.y = player.getY();
        this.z = player.getZ();
        this.yaw = player.getYaw();
        this.pitch = player.getPitch();
        this.head = player.getPlayer().field_70125_A;
        this.swinging = player.getPlayer().field_82175_bq;
        this.heldItem = player.getHeldItem()?.getID() ?? 0;
        this.isSneaking = player.isSneaking();
    }


}