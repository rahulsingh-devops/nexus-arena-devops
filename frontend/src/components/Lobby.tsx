import React, { useState, useEffect, useCallback } from 'react';
import useSocket from '../hooks/useSocket';

interface Room {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
}

interface LobbyProps {
  user: { id: string; username: string; token: string };
  onJoinRoom: (roomId: string) => void;
  onLogout: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ user, onJoinRoom, onLogout }) => {
  const { connected, on, off } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Listen for room updates via socket
  useEffect(() => {
    const handleRoomUpdate = (updatedRooms: unknown) => {
      setRooms(updatedRooms as Room[]);
    };
    on('rooms:update', handleRoomUpdate);
    return () => off('rooms:update', handleRoomUpdate);
  }, [on, off]);

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewRoomName('');
        setShowCreate(false);
        onJoinRoom(data.room.id);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const joinRoom = (roomId: string) => {
    onJoinRoom(roomId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'playing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'finished': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-arena-darker bg-grid">
      {/* Header */}
      <header className="glass-panel border-x-0 border-t-0 rounded-none px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-2xl font-bold tracking-wider text-white">
            NEXUS <span className="text-nexus-400">ARENA</span>
          </h1>
          <div className={`status-badge border ${connected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            {connected ? '● ONLINE' : '○ OFFLINE'}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Signed in as</p>
            <p className="text-white font-semibold">{user.username}</p>
          </div>
          <button onClick={onLogout} className="btn-secondary text-sm px-4 py-2">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Title + Create Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Game Rooms</h2>
              <p className="text-gray-400 text-sm mt-1">
                {rooms.length} room{rooms.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="btn-primary flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Create Room</span>
            </button>
          </div>

          {/* Create Room Panel */}
          {showCreate && (
            <div className="glass-panel p-6 mb-6 animate-slide-up">
              <h3 className="text-lg font-semibold text-white mb-4">Create New Room</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Room name (e.g., Death Match #1)"
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                />
                <button onClick={createRoom} className="btn-primary" disabled={!newRoomName.trim()}>
                  Create
                </button>
                <button onClick={() => setShowCreate(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Room List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-nexus-500/30 border-t-nexus-500 rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Rooms Yet</h3>
              <p className="text-gray-400">Create the first room and start battling!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="glass-panel p-5 flex items-center justify-between hover:border-nexus-500/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-nexus-600/20 flex items-center justify-center text-nexus-400 font-display font-bold text-lg">
                      {room.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold group-hover:text-nexus-300 transition-colors">
                        {room.name}
                      </h4>
                      <p className="text-sm text-gray-400 mt-0.5">
                        Room ID: <span className="font-mono text-gray-500">{room.id.slice(0, 8)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`status-badge border ${getStatusColor(room.status)}`}>
                      {room.status}
                    </span>
                    <span className="text-sm text-gray-400 font-mono">
                      {room.players}/{room.maxPlayers}
                    </span>
                    <button
                      onClick={() => joinRoom(room.id)}
                      disabled={room.players >= room.maxPlayers || room.status === 'finished'}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
