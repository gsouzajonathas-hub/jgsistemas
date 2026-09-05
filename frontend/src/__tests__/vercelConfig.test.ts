import { describe, expect, it } from 'vitest';
import vercelConfig from '../../vercel.json';

describe('config de deploy (Vercel)', () => {
  it('reescreve /api/* para o backend no Render', () => {
    expect(vercelConfig.rewrites).toContainEqual({
      source: '/api/:path*',
      destination: 'https://jgsistemas-backend.onrender.com/api/:path*',
    });
  });

  it('reescreve /uploads/* para o backend no Render', () => {
    expect(vercelConfig.rewrites).toContainEqual({
      source: '/uploads/:path*',
      destination: 'https://jgsistemas-backend.onrender.com/uploads/:path*',
    });
  });

  it('define o fallback SPA para /index.html', () => {
    expect(vercelConfig.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' });
  });
});