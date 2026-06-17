// seed.ts
import db from './repository';

const insert = db.prepare(`
  INSERT INTO todos (title, description)
  VALUES (?, ?)
`);

insert.run('TypeScript学習', '基礎を学ぶ');
insert.run('Hono API', 'CRUD作る');

console.log('seed完了');
