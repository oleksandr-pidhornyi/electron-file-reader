import path from 'path';

const worker = new Worker(path.resolve(__dirname, 'worker.js'));
