class Start extends Phaser.Scene {
    constructor() {
        super({ key: 'start' }); // Scene key
    }

    create() {
        // Example: Create a start button that starts the game
        let startButton = this.add.text(550, 500, 'Start Game', { fill: '#0f0' })
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('platformerScene'); // Transition to Movement scene
            });
    }
}
