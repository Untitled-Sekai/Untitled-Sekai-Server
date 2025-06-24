import fs from 'fs-extra';
import { exec } from 'child_process';

fs.emptyDirSync('./dist');

exec('npx tsc --project tsconfig.json', (error, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  
  if (error) {
    console.error('error:', error);
    return;
  }
  
  console.log('compile success!');
});