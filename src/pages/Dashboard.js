import { useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';
import './dashboard.css';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const { user } = useContext(AuthContext);

  const handleCreateRoom = () => {
    const id = Math.random().toString(36).substring(2, 10);
    navigate(`/room/${id}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Welcome, {user?.name} 👋</h2>
      <div className="dashboard-actions">
        <button className="create-btn" onClick={handleCreateRoom}>
          + Create New Room
        </button>

        <div className="join-room">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button className="join-btn" onClick={handleJoinRoom}>
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
