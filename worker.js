const {
    Worker,
    isMainThread,
    parentPort
} = require('worker_threads');

console.log('isMainThread:', isMainThread); // false

parentPort.on('message', (msg) => {
    console.log("Thread Message: %o", msg);
    setTimeout(() => {
        parentPort.postMessage('message from worker');
    }, 2000);
});
