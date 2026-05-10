import Phaser from 'phaser';

type PowerUpType = 'health' | 'speed' | 'damage' | 'shield';

const TYPE_TEXTURE_MAP: Record<PowerUpType, string> = {
  health: 'powerup-health',
  speed: 'powerup-speed',
  damage: 'powerup-damage',
  shield: 'powerup-shield',
};

export class PowerUp extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private glowRing: Phaser.GameObjects.Graphics;
  public powerUpType: PowerUpType;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    super(scene, x, y);
    this.powerUpType = type;

    // Glow ring
    this.glowRing = scene.add.graphics();
    this.drawGlowRing();
    this.add(this.glowRing);

    // Sprite
    this.sprite = scene.add.image(0, 0, TYPE_TEXTURE_MAP[type]);
    this.add(this.sprite);

    this.setDepth(3);
    scene.add.existing(this);

    // Floating animation
    scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Pulse glow
    scene.tweens.add({
      targets: this.glowRing,
      alpha: 0.3,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Slow rotation
    scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 4000,
      repeat: -1,
    });
  }

  private drawGlowRing(): void {
    const colorMap: Record<PowerUpType, number> = {
      health: 0x06d6a0,
      speed: 0xf59e0b,
      damage: 0xef4444,
      shield: 0x818cf8,
    };
    const color = colorMap[this.powerUpType];
    this.glowRing.lineStyle(1.5, color, 0.5);
    this.glowRing.strokeCircle(0, 0, 20);
  }
}
