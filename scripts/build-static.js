const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const output = path.join(root, 'public');

const copies = [
  ['index.html', 'index.html'],
  ['admin.html', 'admin.html'],
  ['assets', 'assets'],
];

fs.mkdirSync(output, { recursive: true });

for (const [from, to] of copies) {
  const source = path.join(root, from);
  const target = path.join(output, to);

  if (!fs.existsSync(source)) {
    throw new Error(`Arquivo ou pasta nao encontrado: ${from}`);
  }

  fs.cpSync(source, target, {
    recursive: true,
    force: true,
  });
}

console.log('Static files copied to public/.');
