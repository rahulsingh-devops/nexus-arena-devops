import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../hooks/useSocket';
import { createGameConfig } from '../game/config';
import Leaderboard from './Leaderboard';
import Chat from './Chat';
import HUD from './HUD';

interface GameViewProps {
  user: { id: string; username: string; token: string };
  roomId: string;
  onLeave: () => void;
}

export interface PlayerState {
  id: string;
  username: string;
  x: number;
  y: number;
  rotation: number;
  health: number;
  maxHealth: number;
  kills: number;
  deaths: number;
  alive: boolean;
}

export interface GameStateData {
  players: Record<string, PlayerState>;
  projectiles: Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    ownerId: string;
  }>;
  powerUps: Array<{
    id: string;
    x: number;
    y: number;
    type: 'health' | 'speed' | 'damage' | 'shield';
  }>;
  tick: number;
}

const GameView: React.FC<GameViewProps> = ({ user, roomId, onLeave }) => {
  const { emit, on, off, connected } = useSocket();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Initialize Phaser game
  useEffect(() => {
    if (!gameContainerRef.current) return;

    const config = createGameConfig(gameContainerRef.current, {
      userId: user.id,
      roomId,
      emit,
      on,
      off,
    });

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [user.id, roomId, emit, on, off]);

  // Listen for game state updates
  useEffect(() => {
    const handleStateUpdate = (state: unknown) => {
      setGameState(state as GameStateData);
    };

    on('game:state', handleStateUpdate);

    return () => {
      off('game:state', handleStateUpdate);
    };
  }, [on, off]);

  // Join room when connected
  useEffect(() => {
    if (!connected) return;

    emit('room:join', { roomId });

    return () => {
      emit('room:leave', { roomId });
    };
  }, [roomId, connected, emit]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowLeaderboard(true);
      }
      if (e.key === 'Enter') {
        setShowChat((prev) => !prev);
      }
      if (e.key === 'Escape') {
        // Could show pause menu
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setShowLeaderboard(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const currentPlayer = gameState?.players[user.id] || null;

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Phaser Game Canvas */}
      <div ref={gameContainerRef} id="game-container" className="absolute inset-0" />

      {/* HUD Overlay */}
      {currentPlayer && (
        <HUD player={currentPlayer} connected={connected} />
      )}

      {/* Leaderboard Overlay (Tab) */}
      {showLeaderboard && gameState && (
        <Leaderboard players={Object.values(gameState.players)} currentPlayerId={user.id} />
      )}

      {/* Chat Panel */}
      {showChat && (
        <Chat userId={user.id} username={user.username} />
      )}

      {/* Top Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
        <div className="glass-panel px-4 py-2 flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">ROOM</span>
          <span className="text-sm text-white font-semibold">{roomId.slice(0, 8)}</span>
          <span className="text-xs text-gray-500">|</span>
          <span className="text-xs text-gray-400">
            {gameState ? Object.keys(gameState.players).length : 0} players
          </span>
          {gameState && (
            <>
              <span className="text-xs text-gray-500">|</span>
              <span className="text-xs text-gray-400 font-mono">
                TICK {gameState.tick}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Leave Button */}
      <button
        onClick={onLeave}
        className="absolute top-4 right-4 z-10 btn-danger text-sm px-4 py-2"
      >
        Leave Game
      </button>

      {/* Controls Help */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel px-3 py-2 text-xs text-gray-500">
        WASD move · Click shoot · Tab scoreboard · Enter chat
      </div>
    </div>
  );
};

export default GameView;
