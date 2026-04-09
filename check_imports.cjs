const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const getAllFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(file));
    } else {
      results.push(file);
    }
  });
  return results;
};

const files = getAllFiles(srcDir);
const errors = [];

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    const content = fs.readFileSync(file, 'utf8');
    const importRegex = /(?:import|from)\s+['"](.*?)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const impPath = match[1];
      if (impPath.startsWith('@/')) {
        const absolutePath = path.join(srcDir, impPath.replace('@/', ''));
        // check if absolutePath exists as a file, file + .js, file + .jsx, or directory
        const exists = fs.existsSync(absolutePath) || 
                       fs.existsSync(absolutePath + '.js') || 
                       fs.existsSync(absolutePath + '.jsx') || 
                       fs.existsSync(path.join(absolutePath, 'index.js')) ||
                       fs.existsSync(path.join(absolutePath, 'index.jsx')) ||
                       fs.existsSync(absolutePath + '.module.css') ||
                       fs.existsSync(absolutePath + '.css');
        if (!exists) {
          errors.push(`${path.relative(__dirname, file)}: Broken alias import '${impPath}'`);
        }
      } else if (impPath.startsWith('.')) {
        const absolutePath = path.resolve(path.dirname(file), impPath);
        const exists = fs.existsSync(absolutePath) || 
                       fs.existsSync(absolutePath + '.js') || 
                       fs.existsSync(absolutePath + '.jsx') || 
                       fs.existsSync(path.join(absolutePath, 'index.js')) ||
                       fs.existsSync(path.join(absolutePath, 'index.jsx')) ||
                       fs.existsSync(absolutePath + '.module.css') ||
                       fs.existsSync(absolutePath + '.css');
        if (!exists) {
            errors.push(`${path.relative(__dirname, file)}: Broken relative import '${impPath}' -> ${absolutePath}`);
        }
      }
    }
  }
});

if (errors.length > 0) {
    console.log("Broken imports found, seeing broken_imports.txt");
    fs.writeFileSync('broken_imports.txt', errors.join('\n'));
} else {
    console.log("No broken imports found!");
    fs.writeFileSync('broken_imports.txt', 'No broken imports found!');
}
