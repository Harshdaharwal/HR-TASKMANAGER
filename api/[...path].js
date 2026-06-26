import app from '../server.js';

// Explicit handler so Vercel invokes Express correctly
export default function handler(req, res) {
  return app(req, res);
}
