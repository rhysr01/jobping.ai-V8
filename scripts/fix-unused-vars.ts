#!/usr/bin/env ts-node
/**
 * Script to fix unused variable errors by prefixing them with underscore
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface UnusedVar {
  file: string;
  line: number;
  varName: string;
}

function parseTypeErrors(): UnusedVar[] {
  const output = execSync('npx tsc --noEmit 2>&1 || true', { encoding: 'utf-8' });
  const errors: UnusedVar[] = [];
  
  const regex = /(.+)\((\d+),\d+\): error TS6133: '([^']+)' is declared but its value is never read\./g;
  let match;
  
  while ((match = regex.exec(output)) !== null) {
    errors.push({
      file: match[1],
      line: parseInt(match[2]),
      varName: match[3]
    });
  }
  
  return errors;
}

function fixFile(filePath: string, varsToFix: UnusedVar[]) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Sort by line number descending to avoid offset issues
  varsToFix.sort((a, b) => b.line - a.line);
  
  for (const varInfo of varsToFix) {
    const lineIndex = varInfo.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) continue;
    
    const line = lines[lineIndex];
    
    // Different patterns for different contexts
    const patterns = [
      // Function parameters: (param) => or (param: Type)
      new RegExp(`\\b${varInfo.varName}\\b(?=[:,)])`),
      // Destructuring: { varName }
      new RegExp(`\\{\\s*${varInfo.varName}\\s*\\}`),
      new RegExp(`\\{\\s*([^}]+,\\s*)?${varInfo.varName}(\\s*,[^}]+)?\\s*\\}`),
      // Variable declarations: const varName =
      new RegExp(`\\b(const|let|var)\\s+${varInfo.varName}\\b`),
      // Import statements
      new RegExp(`\\b${varInfo.varName}\\b(?=\\s*[,}])`),
    ];
    
    let modified = line;
    for (const pattern of patterns) {
      if (pattern.test(line) && !line.includes(`_${varInfo.varName}`)) {
        modified = line.replace(pattern, (match) => {
          // Don't prefix if already prefixed
          if (match.includes('_')) return match;
          return match.replace(varInfo.varName, `_${varInfo.varName}`);
        });
        break;
      }
    }
    
    lines[lineIndex] = modified;
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
}

// Main execution
console.log('🔍 Finding unused variables...');
const errors = parseTypeErrors();
console.log(`📊 Found ${errors.length} unused variables`);

// Group by file
const byFile = new Map<string, UnusedVar[]>();
for (const error of errors) {
  if (!byFile.has(error.file)) {
    byFile.set(error.file, []);
  }
  byFile.get(error.file)!.push(error);
}

console.log(`📁 Fixing ${byFile.size} files...`);

for (const [file, vars] of byFile) {
  try {
    console.log(`  ✏️  ${file} (${vars.length} vars)`);
    fixFile(file, vars);
  } catch (err) {
    console.error(`  ❌ Error fixing ${file}:`, err);
  }
}

console.log('✅ Done!');

