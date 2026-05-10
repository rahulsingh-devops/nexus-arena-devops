import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

export interface SocketBridge {
  userId: string;
  roomId: string;
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
}

export const ARENA_WIDTH = 2000;
export const ARENA_HEIGHT = 2000;

export function createGameConfig(
  parent: HTMLElement,
  socketBridge: SocketBridge
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#060810',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [
      new BootScene(),
      new GameScene(socketBridge),
    ],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
    audio: {
      noAudio: true, // We'll add audio in a later phase
    },
  };
}
