import Phaser from 'phaser';

interface PlayerStateUpdate {
  health: number;
  maxHealth: number;
  kills: number;
  deaths: number;
  alive: boolean;
}

export class Player extends Phaser.GameObjects.Container {
  public playerId = '';
  private body_sprite: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private healthBar: Phaser.GameObjects.Graphics;
  private isLocal: boolean;
  private targetX = 0;
  private targetY = 0;
  private _health = 100;
  private _maxHealth = 100;
  private _alive = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    username: string,
    isLocal: boolean
  ) {
    super(scene, x, y);

    this.isLocal = isLocal;
    this.targetX = x;
    this.targetY = y;

    // Player sprite
    this.body_sprite = scene.add.image(0, 0, texture);
    this.add(this.body_sprite);

    // Name label
    this.nameText = scene.add.text(0, -32, username, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: isLocal ? '#5c7cfa' : '#ef4444',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // Health bar
    this.healthBar = scene.add.graphics();
    this.add(this.healthBar);
    this.drawHealthBar();

    this.setDepth(10);
    scene.add.existing(this);
  }

  setTargetPosition(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  interpolate(): void {
    const lerp = 0.15;
    this.x += (this.targetX - this.x) * lerp;
    this.y += (this.targetY - this.y) * lerp;
  }

  setRotation(angle: number): this {
    this.body_sprite.setRotation(angle);
    return this;
  }

  updateState(state: PlayerStateUpdate): void {
    this._health = state.health;
    this._maxHealth = state.maxHealth;
    this._alive = state.alive;
    this.drawHealthBar();
    this.setAlpha(state.alive ? 1 : 0.3);
  }

  flashDamage(): void {
    this.body_sprite.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
      this.body_sprite.clearTint();
    });
  }

  private drawHealthBar(): void {
    this.healthBar.clear();
    const barWidth = 36;
    const barHeight = 4;
    const offsetY = 26;
    const pct = this._health / this._maxHealth;

    // Background
    this.healthBar.fillStyle(0x000000, 0.6);
    this.healthBar.fillRoundedRect(-barWidth / 2, offsetY, barWidth, barHeight, 2);

    // Health fill
    let color = 0x06d6a0;
    if (pct < 0.3) color = 0xef4444;
    else if (pct < 0.6) color = 0xf59e0b;

    this.healthBar.fillStyle(color, 0.9);
    this.healthBar.fillRoundedRect(-barWidth / 2, offsetY, barWidth * pct, barHeight, 2);
  }
}
