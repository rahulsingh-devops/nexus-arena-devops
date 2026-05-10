import React, { useState, useCallback } from 'react';
import Login from './components/Login';
import Lobby from './components/Lobby';
import GameView from './components/GameView';
import { SocketProvider } from './hooks/useSocket';

type AppView = 'login' | 'lobby' | 'game';

interface UserData {
  id: string;
  username: string;
  token: string;
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('login');
  const [user, setUser] = useState<UserData | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const handleLogin = useCallback((userData: UserData) => {
    setUser(userData);
    setView('lobby');
  }, []);

  const handleJoinRoom = useCallback((roomId: string) => {
    setCurrentRoom(roomId);
    setView('game');
  }, []);

  const handleLeaveGame = useCallback(() => {
    setCurrentRoom(null);
    setView('lobby');
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setCurrentRoom(null);
    setView('login');
  }, []);

  return (
    <div className="w-full h-full bg-arena-darker">
      {view === 'login' && (
        <Login onLogin={handleLogin} />
      )}

      {view !== 'login' && user && (
        <SocketProvider token={user.token}>
          {view === 'lobby' && (
            <Lobby
              user={user}
              onJoinRoom={handleJoinRoom}
              onLogout={handleLogout}
            />
          )}

          {view === 'game' && currentRoom && (
            <GameView
              user={user}
              roomId={currentRoom}
              onLeave={handleLeaveGame}
            />
          )}
        </SocketProvider>
      )}
    </div>
  );
};

export default App;
