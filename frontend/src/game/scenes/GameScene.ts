import Phaser from 'phaser';
import { SocketBridge, ARENA_WIDTH, ARENA_HEIGHT } from '../config';
import { Player } from '../objects/Player';
import { Projectile } from '../objects/Projectile';
import { PowerUp } from '../objects/PowerUp';

interface ServerPlayerState {
  id: string; username: string; x: number; y: number; rotation: number;
  health: number; maxHealth: number; kills: number; deaths: number; alive: boolean;
}
interface ServerProjectileState { id: string; x: number; y: number; vx: number; vy: number; ownerId: string; }
interface ServerPowerUpState { id: string; x: number; y: number; type: 'health' | 'speed' | 'damage' | 'shield'; }
interface ServerGameState { players: Record<string, ServerPlayerState>; projectiles: ServerProjectileState[]; powerUps: ServerPowerUpState[]; tick: number; }

export class GameScene extends Phaser.Scene {
  private socketBridge: SocketBridge;
  private players: Map<string, Player> = new Map();
  private projectiles: Map<string, Projectile> = new Map();
  private powerUps: Map<string, PowerUp> = new Map();
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private crosshair!: Phaser.GameObjects.Image;
  private lastInputTick = 0;
  private inputSequence = 0;
  private minimap!: Phaser.GameObjects.Graphics;
  private pendingInputs: Array<{ seq: number; dx: number; dy: number }> = [];

  constructor(socketBridge: SocketBridge) {
    super({ key: 'GameScene' });
    this.socketBridge = socketBridge;
  }

  create(): void {
    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.drawArena();
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.cameras.main.setBackgroundColor('#060810');

    if (this.input.keyboard) {
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    this.crosshair = this.add.image(0, 0, 'crosshair').setDepth(1000).setScrollFactor(0);
    this.input.setDefaultCursor('none');
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.crosshair.setPosition(p.x, p.y));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) {
        const wp = this.cameras.main.getWorldPoint(p.x, p.y);
        const lp = this.players.get(this.socketBridge.userId);
        if (lp) this.socketBridge.emit('player:shoot', { angle: Phaser.Math.Angle.Between(lp.x, lp.y, wp.x, wp.y) });
      }
    });

    this.socketBridge.on('game:state', this.onGameState.bind(this));
    this.socketBridge.on('game:playerHit', this.onHit.bind(this));
    this.socketBridge.on('game:playerKill', this.onKill.bind(this));
    this.socketBridge.on('game:powerUpCollected', this.onCollect.bind(this));
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(900);
    this.drawBorder();
  }

  private drawArena(): void {
    for (let x = 0; x < ARENA_WIDTH; x += 64) for (let y = 0; y < ARENA_HEIGHT; y += 64) this.add.image(x+32, y+32, 'arena-tile').setDepth(-1);
    const g = this.add.graphics(); const cx = ARENA_WIDTH/2, cy = ARENA_HEIGHT/2;
    g.lineStyle(2, 0x5c7cfa, 0.1); g.strokeCircle(cx,cy,200); g.strokeCircle(cx,cy,100);
    g.lineStyle(1, 0x5c7cfa, 0.05); g.lineBetween(cx-200,cy,cx+200,cy); g.lineBetween(cx,cy-200,cx,cy+200); g.setDepth(-1);
  }

  private drawBorder(): void {
    const b = this.add.graphics(); b.lineStyle(3, 0xef4444, 0.6); b.strokeRect(0,0,ARENA_WIDTH,ARENA_HEIGHT);
    b.lineStyle(1, 0xef4444, 0.1); b.strokeRect(20,20,ARENA_WIDTH-40,ARENA_HEIGHT-40); b.setDepth(0);
  }

  update(_time: number, delta: number): void { this.processInput(); this.updateMinimap(); this.interpolateEntities(delta); }

  private processInput(): void {
    const now = Date.now(); if (now - this.lastInputTick < 33) return; this.lastInputTick = now;
    let dx = 0, dy = 0;
    if (this.wasd?.A?.isDown) dx -= 1; if (this.wasd?.D?.isDown) dx += 1;
    if (this.wasd?.W?.isDown) dy -= 1; if (this.wasd?.S?.isDown) dy += 1;
    if (dx !== 0 && dy !== 0) { const l = Math.sqrt(dx*dx+dy*dy); dx/=l; dy/=l; }
    if (dx !== 0 || dy !== 0) {
      this.inputSequence++;
      const inp = { seq: this.inputSequence, dx, dy };
      this.pendingInputs.push(inp);
      this.socketBridge.emit('player:input', inp);
      const lp = this.players.get(this.socketBridge.userId);
      if (lp) { const ms = 300*(33/1000); lp.x += dx*ms; lp.y += dy*ms; lp.x = Phaser.Math.Clamp(lp.x,24,ARENA_WIDTH-24); lp.y = Phaser.Math.Clamp(lp.y,24,ARENA_HEIGHT-24); }
    }
    const lp = this.players.get(this.socketBridge.userId);
    if (lp) {
      const ptr = this.input.activePointer; const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
      lp.setRotation(Phaser.Math.Angle.Between(lp.x, lp.y, wp.x, wp.y));
    }
  }

  private onGameState(data: unknown): void {
    const st = data as ServerGameState;
    const sIds = new Set(Object.keys(st.players));
    for (const [id, ps] of Object.entries(st.players)) {
      let p = this.players.get(id);
      if (!p) { const isLocal = id === this.socketBridge.userId; p = new Player(this, ps.x, ps.y, isLocal?'player':'player-enemy', ps.username, isLocal); this.players.set(id, p); if (isLocal) this.cameras.main.startFollow(p, true, 0.1, 0.1); }
      if (id === this.socketBridge.userId) { this.pendingInputs = this.pendingInputs.filter(i => i.seq > (st.tick||0)); p.setPosition(ps.x, ps.y); for (const inp of this.pendingInputs) { const ms=300*(33/1000); p.x+=inp.dx*ms; p.y+=inp.dy*ms; p.x=Phaser.Math.Clamp(p.x,24,ARENA_WIDTH-24); p.y=Phaser.Math.Clamp(p.y,24,ARENA_HEIGHT-24); } }
      else { p.setTargetPosition(ps.x, ps.y); }
      p.setRotation(ps.rotation); p.updateState(ps);
    }
    for (const [id, p] of this.players) { if (!sIds.has(id)) { p.destroy(); this.players.delete(id); } }
    const spIds = new Set(st.projectiles.map(p=>p.id));
    for (const pr of st.projectiles) { let proj = this.projectiles.get(pr.id); if (!proj) { proj = new Projectile(this, pr.x, pr.y); this.projectiles.set(pr.id, proj); } proj.setTargetPosition(pr.x, pr.y); proj.setVelocity(pr.vx, pr.vy); }
    for (const [id, pr] of this.projectiles) { if (!spIds.has(id)) { pr.destroy(); this.projectiles.delete(id); } }
    const suIds = new Set(st.powerUps.map(p=>p.id));
    for (const pu of st.powerUps) { if (!this.powerUps.has(pu.id)) { this.powerUps.set(pu.id, new PowerUp(this, pu.x, pu.y, pu.type)); } }
    for (const [id, pu] of this.powerUps) { if (!suIds.has(id)) { pu.destroy(); this.powerUps.delete(id); } }
  }

  private interpolateEntities(_delta: number): void {
    for (const [, pr] of this.projectiles) pr.interpolate();
    for (const [id, p] of this.players) { if (id !== this.socketBridge.userId) p.interpolate(); }
  }

  private onHit(data: unknown): void {
    const { targetId, x, y } = data as { targetId: string; x: number; y: number };
    const g = this.add.graphics(); g.fillStyle(0xfbbf24, 0.8);
    for (let i=0;i<6;i++){const a=(Math.PI*2*i)/6; g.fillCircle(x+Math.cos(a)*8, y+Math.sin(a)*8, 2);}
    this.tweens.add({ targets:g, alpha:0, scaleX:2, scaleY:2, duration:300, onComplete:()=>g.destroy() });
    this.players.get(targetId)?.flashDamage();
  }

  private onKill(data: unknown): void {
    const { victimId, x, y } = data as { victimId: string; x: number; y: number };
    const g = this.add.graphics(); g.fillStyle(0xef4444,0.6); g.fillCircle(x,y,5);
    this.tweens.add({ targets:g, alpha:0, scaleX:6, scaleY:6, duration:600, ease:'Expo.easeOut', onComplete:()=>g.destroy() });
    const r = this.add.graphics(); r.lineStyle(2,0xef4444,0.5); r.strokeCircle(x,y,10);
    this.tweens.add({ targets:r, alpha:0, scaleX:4, scaleY:4, duration:800, ease:'Expo.easeOut', onComplete:()=>r.destroy() });
    const v = this.players.get(victimId); if (v) v.setAlpha(0.3);
  }

  private onCollect(data: unknown): void {
    const { powerUpId, x, y } = data as { powerUpId: string; x: number; y: number };
    const pu = this.powerUps.get(powerUpId); if (pu) { pu.destroy(); this.powerUps.delete(powerUpId); }
    const g = this.add.graphics(); g.fillStyle(0x06d6a0,0.5); g.fillCircle(x,y,16);
    this.tweens.add({ targets:g, alpha:0, scaleX:2, scaleY:2, duration:400, onComplete:()=>g.destroy() });
  }

  private updateMinimap(): void {
    this.minimap.clear(); const ms=140, pad=16, mx=this.cameras.main.width-ms-pad, my=pad;
    this.minimap.fillStyle(0x111827,0.8); this.minimap.fillRoundedRect(mx,my,ms,ms,8);
    this.minimap.lineStyle(1,0x1f2937,1); this.minimap.strokeRoundedRect(mx,my,ms,ms,8);
    const sx=(ms-8)/ARENA_WIDTH, sy=(ms-8)/ARENA_HEIGHT;
    for (const [id, p] of this.players) { const px=mx+4+p.x*sx, py=my+4+p.y*sy; this.minimap.fillStyle(id===this.socketBridge.userId?0x5c7cfa:0xef4444, id===this.socketBridge.userId?1:0.8); this.minimap.fillCircle(px,py,id===this.socketBridge.userId?3:2); }
    for (const [, pu] of this.powerUps) { this.minimap.fillStyle(0x06d6a0,0.6); this.minimap.fillRect(mx+4+pu.x*sx-1, my+4+pu.y*sy-1, 2, 2); }
  }
}
