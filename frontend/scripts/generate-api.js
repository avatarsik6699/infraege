import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dirname, '..');

execSync('pnpm openapi-typescript http://localhost:8000/openapi.json -o app/shared/types/schema.ts', {
	cwd: root,
	stdio: 'inherit',
});
