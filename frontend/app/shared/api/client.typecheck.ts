import { api } from '@shared/api/client';

void api.post('/api/v1/public/auth/login', { body: { email: 'admin@example.com', password: 'changeme123' } });
void api.get('/api/v1/public/auth/me');
