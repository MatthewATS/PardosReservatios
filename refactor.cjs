const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const ensureDirs = [
  'presentation/components',
  'presentation/pages',
  'presentation/features',
  'domain/context',
  'domain/hooks',
  'domain/models',
  'domain/utils',
  'data/services',
  'data/adapters',
  'data/config'
];

console.log("Creando nuevas carpetas estructurales...");
ensureDirs.forEach(dir => {
  fs.mkdirSync(path.join(srcDir, dir), { recursive: true });
});

const movePath = (fromRel, toRel) => {
  const from = path.join(srcDir, fromRel);
  const to = path.join(srcDir, toRel);
  if (fs.existsSync(from)) {
    fs.cpSync(from, to, { recursive: true });
    fs.rmSync(from, { recursive: true, force: true });
    console.log(`Movido: ${fromRel} -> ${toRel}`);
  }
};

console.log("Moviendo carpetas actuales a las nuevas capas...");
// move ui components
movePath('components/ui', 'presentation/components/ui');
movePath('components/layout', 'presentation/components/layout');
movePath('components/auth', 'presentation/components/auth');
// Move any remaining components inside src/components to presentation/components
const oldComponents = path.join(srcDir, 'components');
if (fs.existsSync(oldComponents)) {
    const items = fs.readdirSync(oldComponents);
    for (const item of items) {
        const itemPath = path.join(oldComponents, item);
        const targetPath = path.join(srcDir, 'presentation/components', item);
        if (!fs.existsSync(targetPath)) {
            fs.renameSync(itemPath, targetPath);
            console.log(`Movido: components/${item} -> presentation/components/${item}`);
        }
    }
    // try to remove the old components folder if empty
    try { fs.rmdirSync(oldComponents); } catch(e){}
}

// move context
movePath('context', 'domain/context');

// move pages
movePath('pages', 'presentation/pages');

// move features
movePath('features', 'presentation/features');


console.log("Actualizando importaciones en archivos de código...");

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
    }
  });

  return arrayOfFiles;
};

const files = getAllFiles('src');

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    let content = fs.readFileSync(file, 'utf8');
    let hasChanges = false;
    
    // We rewrite relative imports pointing to context or components to use @/ path alias
    // Since we don't know the exact relative "../.." depth, we look for anything that ends with /context/X or /components/X
    // Example: import { AuthContext } from '../../context/AuthContext'
    // Regex matches the import path string.

    // Helper to replace import strings
    const replaceImports = (regexMatch, newPrefix) => {
       const [fullMatch, importStatement, pathString] = regexMatch;
       // pathString is like "../../context/AuthContext"
       // we want to extract the part from "context" onwards
       let newPath = null;
       
       if (pathString.includes('/context/')) {
          const parts = pathString.split('/context/');
          newPath = `@/domain/context/${parts[1]}`;
       } else if (pathString.includes('/components/')) {
          const parts = pathString.split('/components/');
          newPath = `@/presentation/components/${parts[1]}`;
       } else if (pathString.includes('/features/')) {
          const parts = pathString.split('/features/');
          newPath = `@/presentation/features/${parts[1]}`;
       } else if (pathString.includes('/pages/')) {
          const parts = pathString.split('/pages/');
          newPath = `@/presentation/pages/${parts[1]}`;
       } else if (pathString.startsWith('../') || pathString.startsWith('./')) {
          // If it's a relative path to something like ReservationForm (same folder)
          // We can leave it as relative, or if it points to a root file like App we might need to fix it.
          // In most cases, relative sibling imports work perfectly (e.g. ./ReservationForm)
          
          // Let's catch if they explicitly point to something that moved relative to the current file.
          // For instance, App.jsx imports features/.. from src/. App didn't move.
       }
       
       if (newPath) {
          hasChanges = true;
          return `${importStatement} '${newPath}'`;
       }
       return fullMatch;
    };

    // Regex to match "import ... from '...'" or "import ... from "...""
    const importRegex = /(import.*?from\s+)['"](.*?)['"]/g;
    
    content = content.replace(importRegex, (...args) => replaceImports(args, ""));

    // Also handle dynamic imports and requires just in case
    const dynamicImportRegex = /(import\()['"](.*?)['"](\))/g;
    content = content.replace(dynamicImportRegex, (...args) => {
        const pathString = args[2];
        if (pathString.includes('/context/')) return `import('@/domain/context/${pathString.split('/context/')[1]}')`;
        if (pathString.includes('/components/')) return `import('@/presentation/components/${pathString.split('/components/')[1]}')`;
        if (pathString.includes('/features/')) return `import('@/presentation/features/${pathString.split('/features/')[1]}')`;
        if (pathString.includes('/pages/')) return `import('@/presentation/pages/${pathString.split('/pages/')[1]}')`;
        return args[0];
    });
    
    // Custom fix for main.jsx and App.jsx which are at root src/
    if (file.endsWith('main.jsx') || file.endsWith('App.jsx') || file.endsWith('index.jsx')) {
        content = content.replace(/['"]\.\/pages(.*?)\/.*?['"]/g, match => match.replace('./pages', '@/presentation/pages'));
        content = content.replace(/['"]\.\/components(.*?)\/.*?['"]/g, match => match.replace('./components', '@/presentation/components'));
        content = content.replace(/['"]\.\/context(.*?)\/.*?['"]/g, match => match.replace('./context', '@/domain/context'));
        content = content.replace(/['"]\.\/features(.*?)\/.*?['"]/g, match => match.replace('./features', '@/presentation/features'));
    }

    if (content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Actualizadas importaciones en:", file);
    }
  }
});
console.log("Refactorización base completada.");
