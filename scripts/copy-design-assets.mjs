import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const source = resolve(root, 'src/design-system/assets');
const target = resolve(root, 'dist/design-system/assets');

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
