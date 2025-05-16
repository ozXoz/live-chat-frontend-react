import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_FLASK_URL, // Flask server
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance;
