const BASE = (import.meta.env.VITE_API_URL as string | undefined)
  || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Server not reachable — is "npm run server" running on port 3001?');
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data;
}

export const api = {
  get: <T>(path: string) => req<T>('GET', path),
  post: <T>(path: string, body: unknown) => req<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => req<T>('PUT', path, body),
  delete: (path: string) => req<void>('DELETE', path),
  seed: (sheet: string, data: unknown[]) =>
    fetch(`${BASE}/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet, data }),
    }).then(r => r.json()),
};
