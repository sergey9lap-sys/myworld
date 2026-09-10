import {mkdir,copyFile,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));const output=path.join(root,'dist');
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
for(const file of ['index.html','style.css','app.js','favicon.svg'])await copyFile(path.join(root,file),path.join(output,file));
for(const directory of ['assets','fonts'])await cp(path.join(root,directory),path.join(output,directory),{recursive:true});
console.log('Static site ready in dist/');
