import * as fs from 'fs';
import * as path from 'path';

const foldersToClean = [
    'repository/cover',
    'repository/bgm',
    'repository/background',
    'repository/level',
    'repository/chart',
    'repository/preview',
];

try {
    foldersToClean.forEach(folderPath => {
        const fullPath = path.join(process.cwd(), folderPath);

        if (fs.existsSync(fullPath)) {
            const ignoreFilePath = path.join(fullPath, '.delete_ignore');
            let filesToIgnore = [];
            
            if (fs.existsSync(ignoreFilePath)) {
                filesToIgnore = fs.readFileSync(ignoreFilePath, 'utf8')
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));
                console.log(`[*]Found .delete_ignore in ${folderPath}, protecting ${filesToIgnore.length} files`);
            }

            fs.readdirSync(fullPath).forEach(file => {
                if (file === '.delete_ignore') {
                    return;
                }
                
                if (filesToIgnore.includes(file)) {
                    console.log(`[*]Skipping protected file: ${file} in ${folderPath}`);
                    return;
                }

                const curPath = path.join(fullPath, file);
                fs.unlinkSync(curPath);
            });
            console.log(`[*]Delete ${folderPath}`);
        } else {
            console.log(`[!]Not Found ${folderPath}`);
        }
    });

    console.log('All done!');
} catch (error) {
    console.error('error', error);
    process.exit(1);
}