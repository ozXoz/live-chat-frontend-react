import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_NODE_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: false
});

export default socket;
