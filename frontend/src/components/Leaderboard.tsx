import React from 'react';

interface PlayerScore {
  id: string;
  username: string;
  kills: number;
  deaths: number;
  health: number;
  maxHealth: number;
  alive: boolean;
}

interface LeaderboardProps {
  players: PlayerScore[];
  currentPlayerId: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players, currentPlayerId }) => {
  const sorted = [...players].sort((a, b) => {
    if (b.kills !== a.kills) return b.kills - a.kills;
    return a.deaths - b.deaths;
  });

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel-strong w-full max-w-lg p-6">
        <h3 className="text-center font-display text-xl font-bold tracking-wider text-white mb-1">
          SCOREBOARD
        </h3>
        <p className="text-center text-xs text-gray-500 mb-5 font-mono">
          {players.length} PLAYER{players.length !== 1 ? 'S' : ''}
        </p>

        <div className="space-y-1">
          {/* Header */}
          <div className="flex items-center px-4 py-2 text-xs text-gray-500 font-mono uppercase tracking-wider">
            <span className="w-8">#</span>
            <span className="flex-1">Player</span>
            <span className="w-16 text-center">K</span>
            <span className="w-16 text-center">D</span>
            <span className="w-16 text-center">K/D</span>
            <span className="w-20 text-center">Status</span>
          </div>

          {sorted.map((player, index) => {
            const isMe = player.id === currentPlayerId;
            const kd = player.deaths === 0 ? player.kills.toFixed(1) : (player.kills / player.deaths).toFixed(1);

            return (
              <div
                key={player.id}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isMe
                    ? 'bg-nexus-600/15 border border-nexus-500/20'
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <span className={`w-8 font-mono text-sm font-bold ${
                  index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'
                }`}>
                  {index + 1}
                </span>
                <span className={`flex-1 font-semibold text-sm ${isMe ? 'text-nexus-300' : 'text-white'}`}>
                  {player.username}
                  {isMe && <span className="ml-2 text-xs text-nexus-500 font-mono">(YOU)</span>}
                </span>
                <span className="w-16 text-center font-mono text-sm text-green-400">{player.kills}</span>
                <span className="w-16 text-center font-mono text-sm text-red-400">{player.deaths}</span>
                <span className="w-16 text-center font-mono text-sm text-gray-300">{kd}</span>
                <span className="w-20 text-center">
                  {player.alive ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      ALIVE
                    </span>
                  ) : (
                    <span className="text-xs text-red-400">DEAD</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-600 mt-4 font-mono">
          Hold TAB to view
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
