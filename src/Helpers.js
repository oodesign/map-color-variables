var logsEnabled = true;


export function clog(message) {
    if (logsEnabled)
        console.log(message);
}