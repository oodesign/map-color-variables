var logsEnabled = true;

export const ItemType = {
    shape: 'shape',
    text: 'text',
    layerstyle: 'layerstyle',
    textstyle: 'textstyle'
  }


export function clog(message) {
    if (logsEnabled)
        console.log(message);
}