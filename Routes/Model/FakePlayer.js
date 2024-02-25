const EntityOtherPlayerMP = Java.type('net.minecraft.client.entity.EntityOtherPlayerMP');
const GameProfile = Java.type('com.mojang.authlib.GameProfile');
const UUID = Java.type('java.util.UUID');
const BigInteger = Java.type('java.math.BigInteger');
const ScoreBoard = Java.type('net.minecraft.scoreboard.Scoreboard');

const emptyScoreboard = new ScoreBoard();

export default class PlayerGhost {

    //define players state
    constructor(entityId = -1, name = "Fake Player", playerUUID = null) {
        this.entityId = entityId;
        
        let id = '134f5e80393c47199cce985f6191ba90';
        this.uuid_ = new UUID(
            new BigInteger(id.substring(0, 16), 16).longValue(),
            new BigInteger(id.substring(16), 16).longValue());
        this.gameProfile = new GameProfile(this.uuid_, name);

        this.world = Client.getMinecraft().field_71441_e; //theWorld
    }

    moveToPosition(state) {
        this.fakePlayer.func_180426_a(state.x, state.y, state.z, state.yaw, state.pitch, 1, true);
    }

    init(state) {
        this.fakePlayer = new JavaAdapter(EntityOtherPlayerMP, FakePlayer, this.world, this.gameProfile);
        let x_int = state.x * 32;
        let y_int = state.y * 32;
        let z_int = state.z * 32;
        this.fakePlayer.field_70169_q = x_int; //prevPosX
        this.fakePlayer.field_70118_ct = x_int; //serverPosX
        this.fakePlayer.field_70142_S = x_int; //lastTickPosX
        this.fakePlayer.field_70167_r = y_int; //prevPosY
        this.fakePlayer.field_70117_cu = y_int; //serverPosY
        this.fakePlayer.field_70137_T = y_int; //lastTickPosY
        this.fakePlayer.field_70166_s = z_int; //prevPosZ
        this.fakePlayer.field_70116_cv = z_int; //serverPosZ
        this.fakePlayer.field_70136_U = z_int; //lastTickPosZ

        this.fakePlayer.func_70080_a(state.x, state.y, state.z, state.yaw, state.pitch);
        this.fakePlayer.field_70125_A = state.head;
        this.fakePlayer.func_82142_c(true);
        this.inWorld=true;
        World.getWorld().func_73027_a(this.entityId, this.fakePlayer);
    }

    removeFromWorld(){
       World.getWorld().func_73028_b(this.entityId);
    }


}

const FakePlayer = {
    func_174825_a(player, vec) { //interactAt
        return false;
    },

    func_70998_m(entity) { //interactWith
        return false;
    },

    func_70067_L() { //canBeCollidedWith
        return false;
    },

    func_96123_co() { //getWorldScoreboard
        return emptyScoreboard;
    },

    func_98034_c() { //isInvisibleToPlayer
        return false;//!this.inWorld;
    }
}