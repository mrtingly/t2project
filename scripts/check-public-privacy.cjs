#!/usr/bin/env node
/**
 * Public surface privacy gate for T2PROJECT V3.
 * Scans ONLY files published as public documentation / frontend.
 * Private program calculations belong in access-controlled backend data.
 */
const fs = require('node:fs');
const path = require('node:path');
const roots = ['frontend', 'docs'];
const files = ['README.md'];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(p);
    else if(/\.(?:html|js|md|json|css)$/i.test(entry.name)) files.push(p);
  }
}
roots.forEach(walk);
const checks = [
  {label:'embedded credential',pattern:/\b(?:password|passwd|secret|api[_-]?key)\s*[:=]\s*['"][^'"]{4,}['"]/i},
  {label:'13-digit ID value',pattern:/(?:^|[^0-9])[0-9]{13}(?:[^0-9]|$)/},
  {label:'internal program figures',pattern:/(?:program\s+contribution|claimed\s+monetary\s+outcome|admin\s+expense|ผลตอบแทน(?:ต่อสิทธิ์|ที่คาด)|สูตรคำนวณโปร)\s*[:=]?\s*(?:THB\s*)?[0-9][0-9,.]*/i}
];
let failures=0;
for(const file of files) {
  const contents=fs.readFileSync(file,'utf8');
  for(const {label,pattern} of checks) if(pattern.test(contents)) {
    console.error('Privacy gate failed: '+label+' in '+file);failures++;
  }
}
if(failures) process.exit(1);
console.log('Privacy gate passed for '+files.length+' public files');
