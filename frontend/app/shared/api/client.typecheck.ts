import { api } from '@shared/api/client';

void api.post('/public/auth/login', { body: { email: 'admin@example.com', password: 'changeme123' } });
void api.get('/public/auth/me');
