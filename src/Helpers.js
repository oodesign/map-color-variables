var logsEnabled = false;

export const ItemType = {
    shape: 'shape',
    text: 'text',
    layerStyle: 'layerstyle',
    textStyle: 'textstyle'
  }


export function clog(message) {
    if (logsEnabled)
        console.log(message);
}