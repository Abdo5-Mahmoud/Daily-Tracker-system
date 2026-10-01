import fs from 'node:fs';
import path from 'node:path';

/**
 * Audit tool to enforce the strict Line-by-Line Formatting Rule:
 * Every non-code line must be either 100% Arabic or 100% English.
 * Mixed lines containing both Arabic characters and Latin letters are flagged.
 */

const ARABIC_REGEX = /[\u0600-\u06FF]/;
const LATIN_REGEX = /[a-zA-Z]/;

export function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const violations = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Toggle fenced code block
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    // Skip empty lines, markdown dividers, pure quotes/badges
    if (!trimmed || trimmed === '---' || trimmed === '***') {
      continue;
    }

    // Check for mixed Arabic and Latin
    const hasArabic = ARABIC_REGEX.test(trimmed);
    const hasLatin = LATIN_REGEX.test(trimmed);

    if (hasArabic && hasLatin) {
      violations.push({
        lineNumber: i + 1,
        line: trimmed,
      });
    }
  }

  return violations;
}

export function scanDirectory(dirPath, extensions = ['.md', '.txt']) {
  let results = {};
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.agents') {
        continue;
      }
      Object.assign(results, scanDirectory(fullPath, extensions));
    } else if (entry.isFile()) {
      if (extensions.includes(path.extname(entry.name).toLowerCase())) {
        const violations = auditFile(fullPath);
        if (violations.length > 0) {
          results[fullPath] = violations;
        }
      }
    }
  }

  return results;
}

// CLI execution
const targetArg = process.argv[2] || 'engineering-learning';
const resolvedTarget = path.resolve(process.cwd(), targetArg);

console.log(`\n🔍 Scanning target: ${resolvedTarget}\n`);

if (fs.existsSync(resolvedTarget)) {
  const stat = fs.statSync(resolvedTarget);
  if (stat.isFile()) {
    const violations = auditFile(resolvedTarget);
    if (violations.length === 0) {
      console.log(`✅ [100% Compliant] No mixed-language lines detected in ${targetArg}`);
    } else {
      console.log(`⚠️ Found ${violations.length} mixed-language line(s) in ${targetArg}:\n`);
      for (const v of violations) {
        console.log(`  Line ${v.lineNumber}: ${v.line}`);
      }
    }
  } else if (stat.isDirectory()) {
    const allViolations = scanDirectory(resolvedTarget);
    const filesWithIssues = Object.keys(allViolations);

    if (filesWithIssues.length === 0) {
      console.log(`✅ [100% Compliant] All files in ${targetArg} adhere strictly to line purity!`);
    } else {
      console.log(`⚠️ Found violations in ${filesWithIssues.length} file(s):\n`);
      for (const file of filesWithIssues) {
        const relative = path.relative(process.cwd(), file);
        console.log(`📄 ${relative} (${allViolations[file].length} violations):`);
        for (const v of allViolations[file].slice(0, 5)) {
          console.log(`   - L${v.lineNumber}: ${v.line}`);
        }
        if (allViolations[file].length > 5) {
          console.log(`   ... and ${allViolations[file].length - 5} more.`);
        }
        console.log('');
      }
    }
  }
} else {
  console.error(`❌ Target not found: ${resolvedTarget}`);
  process.exit(1);
}
