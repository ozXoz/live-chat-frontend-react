import { Link } from 'react-router-dom';
import './home.css';

export default function Home() {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>Welcome to LiveTalk</h1>
        <p>Real-time chat, video calls, screen share, and live translation.</p>
        <div className="cta-buttons">
          <Link to="/login"><button>Login</button></Link>
          <Link to="/register"><button className="secondary">Register</button></Link>
        </div>
      </div>
    </div>
  );
}
