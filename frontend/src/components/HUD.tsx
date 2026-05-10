import React from 'react';
import { PlayerState } from './GameView';

interface HUDProps {
  player: PlayerState;
  connected: boolean;
}

const HUD: React.FC<HUDProps> = ({ player, connected }) => {
  const healthPercent = (player.health / player.maxHealth) * 100;
  const getHealthColor = () => {
    if (healthPercent > 60) return 'bg-green-500';
    if (healthPercent > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  const getHealthGlow = () => {
    if (healthPercent > 60) return 'shadow-green-500/50';
    if (healthPercent > 30) return 'shadow-yellow-500/50';
    return 'shadow-red-500/50';
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
      <div className="glass-panel-strong px-6 py-4 flex items-center gap-8 min-w-[400px]">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${player.alive ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-display text-sm font-bold tracking-wider text-white">{player.username}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 font-mono">HP</span>
            <span className="text-xs text-gray-400 font-mono">{player.health}/{player.maxHealth}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor()} shadow-lg ${getHealthGlow()}`} style={{ width: `${healthPercent}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white font-mono">{player.kills}</p>
            <p className="text-xs text-gray-500 uppercase">Kills</p>
          </div>
          <div className="w-px h-8 bg-arena-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-gray-400 font-mono">{player.deaths}</p>
            <p className="text-xs text-gray-500 uppercase">Deaths</p>
          </div>
        </div>
        {!connected && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-mono">RECONNECTING</span>
          </div>
        )}
      </div>
      {!player.alive && (
        <div className="mt-3 text-center glass-panel px-4 py-3 animate-slide-up">
          <p className="text-red-400 font-display font-bold tracking-wider">ELIMINATED</p>
          <p className="text-xs text-gray-400 mt-1">Respawning...</p>
        </div>
      )}
    </div>
  );
};

export default HUD;
