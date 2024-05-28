class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;

        // Initialize counters and states
        this.coinCount = 0;
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;
    }

    preload(){
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }

    create() {
        // Set a temporary solid color background
        this.cameras.main.setBackgroundColor('#3498db');

        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 120 tiles wide and 40 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 120, 40);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Find coins in the "Objects" layer in Phaser
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        // Convert coins to Arcade Physics sprites
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        this.coinGroup = this.add.group(this.coins);

        // Find mushrooms in the "Objects" layer in Phaser
        this.mushrooms = this.map.createFromObjects("Objects", {
            name: "mushroom",
            key: "tilemap_sheet",
            frame: 128 // Assuming frame 128 is the mushroom
        });

        // Convert mushrooms to Arcade Physics sprites
        this.physics.world.enable(this.mushrooms, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.mushrooms
        this.mushroomGroup = this.add.group(this.mushrooms);

        // Find bars in the "Objects" layer in Phaser
        this.bars = this.map.createFromObjects("Objects", {
            name: "bar",
            key: "tilemap_sheet",
            frame: 131 // Assuming frame 200 is the bar
        });

        // Convert bars to Arcade Physics sprites
        this.physics.world.enable(this.bars, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.bars
        this.barGroup = this.add.group(this.bars);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.coinCount += 1;
            this.coinText.setText('Coins: ' + this.coinCount);
        });

        // Handle collision detection with mushrooms
        this.physics.add.overlap(my.sprite.player, this.mushroomGroup, (obj1, obj2) => {
            obj2.destroy(); // remove mushroom on overlap
            this.canDoubleJump = true; // enable double jump
            this.showDoubleJumpText();
        });

        // Handle collision detection with bars
        this.physics.add.overlap(my.sprite.player, this.barGroup, (obj1, obj2) => {
            this.scene.start('EndScene'); // Transition to EndScene
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // Add a text object to display the coin count
        this.coinText = this.add.text(16, 16, 'Coins: 0', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        // Add a text object for double jump notification (initially hidden)
        this.doubleJumpText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'You can now double jump!', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#000000'
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;
            this.physics.world.debugGraphic.clear();
        }, this);

        // Movement VFX
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            scale: { start: 0.03, end: 0.1 },
            lifespan: 350,
            alpha: { start: 1, end: 0.1 },
        });

        my.vfx.walking.stop();

        // Set the world bounds to match the size of the tilemap
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Set the camera bounds to match the size of the tilemap
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.animatedTiles.init(this.map);
    }

    update() {
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }

        if (my.sprite.player.body.blocked.down) {
            this.hasDoubleJumped = false; // reset double jump when on the ground
        }

        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
            if (my.sprite.player.body.blocked.down) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            } else if (this.canDoubleJump && !this.hasDoubleJumped) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.hasDoubleJumped = true; // mark double jump as used
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }

    showDoubleJumpText() {
        this.doubleJumpText.setVisible(true);
        this.time.delayedCall(2000, () => {
            this.doubleJumpText.setVisible(false);
        });
    }
}
