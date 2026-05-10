import Phaser from 'phaser';

export class Projectile extends Phaser.GameObjects.Image {
  private targetX = 0;
  private targetY = 0;
  private vx = 0;
  private vy = 0;
  private trail: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile');
    this.targetX = x;
    this.targetY = y;
    this.setDepth(5);

    this.trail = scene.add.graphics();
    this.trail.setDepth(4);

    scene.add.existing(this);
  }

  setTargetPosition(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  interpolate(): void {
    const prevX = this.x;
    const prevY = this.y;

    // Use velocity for extrapolation between server updates
    this.x += (this.targetX - this.x) * 0.3;
    this.y += (this.targetY - this.y) * 0.3;

    // Draw trail
    this.trail.clear();
    this.trail.lineStyle(1.5, 0xfbbf24, 0.4);
    this.trail.lineBetween(prevX, prevY, this.x, this.y);

    // Rotation
    this.setRotation(Math.atan2(this.vy, this.vx));
  }

  destroy(fromScene?: boolean): void {
    this.trail?.destroy();
    super.destroy(fromScene);
  }
}
