import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000', // Flask server
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance;
