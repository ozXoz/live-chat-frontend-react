import React, { useEffect, useRef, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';
import { AuthContext } from '../context/AuthContext';
import './room.css';

export default function Room() {
  const { roomId } = useParams();
  const { user }   = useContext(AuthContext);

  /* refs */
  const localVideo   = useRef(null);
  const remoteVideo  = useRef(null);
  const chatBottom   = useRef(null);     // ← for auto-scroll
  const localStream  = useRef(null);
  const pcRef        = useRef(null);

  /* state */
  const [peerId,   setPeerId]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');

  /* perfect-negotiation flags */
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const isPolite    = useRef(false);

  /* add each track once */
  const addTracksIfNeeded = () => {
    if (!pcRef.current || !localStream.current) return;
    localStream.current.getTracks().forEach(t => {
      if (!pcRef.current.getSenders().some(s => s.track?.id === t.id))
        pcRef.current.addTrack(t, localStream.current);
    });
  };

  /* create peer */
  const createPeer = targetId => {
    const pc = new RTCPeerConnection({
      sdpSemantics: 'unified-plan',
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = e =>
      e.candidate && socket.emit('signal', { to: targetId, data: { candidate: e.candidate } });

    pc.ontrack = e => {
      if (remoteVideo.current && e.streams[0])
        remoteVideo.current.srcObject = e.streams[0];
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer.current = true;
        await pc.setLocalDescription(await pc.createOffer());
        socket.emit('signal', { to: targetId, data: pc.localDescription });
      } finally { makingOffer.current = false; }
    };

    pcRef.current = pc;
  };

  /* media + signalling */
  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.current.srcObject = stream;
      localStream.current = stream;
      socket.emit('join-room', roomId);
      socket.emit('ready', roomId);
    })();

    socket.on('peer-ready', id => {
      setPeerId(id);
      isPolite.current = socket.id > id;
      if (!pcRef.current) createPeer(id);
      addTracksIfNeeded();
    });

    socket.on('signal', async ({ from, data }) => {
      if (!pcRef.current) {
        setPeerId(from);
        isPolite.current = socket.id > from;
        createPeer(from);
        addTracksIfNeeded();
      }
      const pc = pcRef.current;

      try {
        if (['offer', 'answer'].includes(data.type)) {
          const glare = data.type === 'offer' &&
                        (makingOffer.current || pc.signalingState !== 'stable');
          ignoreOffer.current = !isPolite.current && glare;
          if (ignoreOffer.current) return;

          await pc.setRemoteDescription(data);
          if (data.type === 'offer') {
            await pc.setLocalDescription(await pc.createAnswer());
            socket.emit('signal', { to: from, data: pc.localDescription });
          }
        } else if (data.candidate && pc.remoteDescription) {
          try { await pc.addIceCandidate(data.candidate); } catch {}
        }
      } catch (err) { console.error(err); }
    });

    /* ------------ chat ------------ */
    socket.on('chat-history', msgs => setMessages(msgs));           // NEW
    socket.on('receive-message', m => setMessages(p => [...p, m]));

    /* cleanup */
    return () => {
      socket.off('peer-ready');
      socket.off('signal');
      socket.off('chat-history');
      socket.off('receive-message');
    };
  }, [roomId]);

  /* scroll chat to bottom whenever messages change */
  useEffect(() => {
    chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* send chat */
  const send = e => {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('send-message', { roomId, sender: user.name, message: text });
    setText('');
  };

  /* UI */
  return (
    <div className="room-container">
      <h2>Room <span>{roomId}</span></h2>

      <div className="room-body">
        {/* video */}
        <div className="video-area">
          <div className="video-grid">
            <div className="video-box"><video ref={localVideo}  autoPlay muted playsInline /></div>
            <div className="video-box"><video ref={remoteVideo} autoPlay playsInline /></div>
          </div>
          <div className="controls">
            <button className="btn leave" onClick={() => window.location.href = '/dashboard'}>
              🚪 Leave
            </button>
          </div>
        </div>

        {/* chat */}
        <div className="chat-section">
          <h3>Chat</h3>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className="chat-message">
                <strong>{m.sender === user.name ? 'Me' : m.sender}:</strong> {m.message}
              </div>
            ))}
            <div ref={chatBottom} />   {/* auto-scroll anchor */}
          </div>
          <form className="chat-form" onSubmit={send}>
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Type…" />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
