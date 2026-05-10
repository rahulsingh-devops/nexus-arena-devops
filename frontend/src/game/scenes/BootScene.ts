import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create a loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    progressBox.fillStyle(0x1f2937, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 8);

    const loadingText = this.add.text(width / 2, height / 2 - 40, 'INITIALIZING...', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#9ca3af',
    });
    loadingText.setOrigin(0.5, 0.5);

    const titleText = this.add.text(width / 2, height / 2 - 100, 'NEXUS ARENA', {
      fontFamily: 'Rajdhani, Inter, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x5c7cfa, 1);
      progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 10, 310 * value, 20, 6);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Generate all textures programmatically (no external assets needed)
    this.createTextures();
  }

  private createTextures(): void {
    // Player body texture (circle with glow)
    this.createPlayerTexture('player', 0x5c7cfa);
    this.createPlayerTexture('player-enemy', 0xef4444);

    // Projectile texture
    this.createProjectileTexture();

    // Power-up textures
    this.createPowerUpTexture('powerup-health', 0x06d6a0);
    this.createPowerUpTexture('powerup-speed', 0xf59e0b);
    this.createPowerUpTexture('powerup-damage', 0xef4444);
    this.createPowerUpTexture('powerup-shield', 0x818cf8);

    // Arena tiles
    this.createArenaTile();

    // Crosshair
    this.createCrosshairTexture();
  }

  private createPlayerTexture(key: string, color: number): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const size = 48;

    // Outer glow
    graphics.fillStyle(color, 0.15);
    graphics.fillCircle(size / 2, size / 2, size / 2);

    // Main body
    graphics.fillStyle(color, 0.9);
    graphics.fillCircle(size / 2, size / 2, size / 2 - 6);

    // Inner highlight
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillCircle(size / 2 - 4, size / 2 - 4, size / 2 - 14);

    // Direction indicator (gun barrel)
    graphics.fillStyle(color, 1);
    graphics.fillRect(size / 2, size / 2 - 3, size / 2 - 2, 6);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createProjectileTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const size = 12;

    // Glow
    graphics.fillStyle(0xfbbf24, 0.3);
    graphics.fillCircle(size / 2, size / 2, size / 2);

    // Core
    graphics.fillStyle(0xfbbf24, 1);
    graphics.fillCircle(size / 2, size / 2, 3);

    // Bright center
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(size / 2, size / 2, 1.5);

    graphics.generateTexture('projectile', size, size);
    graphics.destroy();
  }

  private createPowerUpTexture(key: string, color: number): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const size = 32;

    // Outer glow pulse ring
    graphics.lineStyle(2, color, 0.3);
    graphics.strokeCircle(size / 2, size / 2, size / 2 - 1);

    // Inner shape (diamond)
    graphics.fillStyle(color, 0.8);
    const cx = size / 2;
    const cy = size / 2;
    const r = 8;
    graphics.fillPoints([
      new Phaser.Geom.Point(cx, cy - r),
      new Phaser.Geom.Point(cx + r, cy),
      new Phaser.Geom.Point(cx, cy + r),
      new Phaser.Geom.Point(cx - r, cy),
    ], true);

    // Center dot
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillCircle(cx, cy, 2);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createArenaTile(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const tileSize = 64;

    // Dark background
    graphics.fillStyle(0x0a0e1a, 1);
    graphics.fillRect(0, 0, tileSize, tileSize);

    // Grid lines
    graphics.lineStyle(1, 0x5c7cfa, 0.05);
    graphics.strokeRect(0, 0, tileSize, tileSize);

    // Subtle center dot
    graphics.fillStyle(0x5c7cfa, 0.03);
    graphics.fillCircle(tileSize / 2, tileSize / 2, 1);

    graphics.generateTexture('arena-tile', tileSize, tileSize);
    graphics.destroy();
  }

  private createCrosshairTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    const size = 24;
    const cx = size / 2;
    const cy = size / 2;

    // Ring
    graphics.lineStyle(1.5, 0xffffff, 0.7);
    graphics.strokeCircle(cx, cy, 8);

    // Crosshair lines
    graphics.lineStyle(1, 0xffffff, 0.5);
    graphics.lineBetween(cx, cy - 12, cx, cy - 4);
    graphics.lineBetween(cx, cy + 4, cx, cy + 12);
    graphics.lineBetween(cx - 12, cy, cx - 4, cy);
    graphics.lineBetween(cx + 4, cy, cx + 12, cy);

    // Center dot
    graphics.fillStyle(0xff4444, 0.8);
    graphics.fillCircle(cx, cy, 1.5);

    graphics.generateTexture('crosshair', size, size);
    graphics.destroy();
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
