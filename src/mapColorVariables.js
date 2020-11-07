import BrowserWindow from 'sketch-module-web-view'
import { getWebview } from 'sketch-module-web-view/remote'
import UI from 'sketch/ui'
const sketch = require('sketch');
const Helpers = require("./Helpers");
var document = sketch.getSelectedDocument();

const webviewIdentifier = 'map-color-variables.webview'

export default function () {

  const currentSwatches = new Map();
  const missingSwatches = new Map();

  document.swatches.forEach(function (swatch) {
    currentSwatches.set(swatch.color, swatch);
  });

  const allLayers = sketch.find('*') // TODO: optimise this query: ShapePath, SymbolMaster, Text, SymbolInstance
  allLayers.forEach(layer => {
    layer.style.fills
      .concat(layer.style.borders)
      .filter(item => item.fillType == 'Color')
      .forEach(item => {
        if (canMapColor(layer, "Fill/Border", currentSwatches, missingSwatches, item.color)) {
          item.color = currentSwatches.get(item.color).referencingColor;
        }
      })
    // Previous actions don't work for Text Layer colors that are colored using TextColor, so let's fix that:
    if (layer.style.textColor) {
      if (canMapColor(layer, "Text color", currentSwatches, missingSwatches, layer.style.textColor)) {
        layer.style.textColor = currentSwatches.get(layer.style.textColor).referencingColor;
      }
    }
  });

  Helpers.clog("Not referenced variables:")
  missingSwatches.forEach(function (key, value) {
    Helpers.clog(key + " - " + value);
  });

}

function canMapColor(layer, description, currentSwatches, missingSwatches, color) {
  var canMapColor = false;

  if (currentSwatches.has(color)) {
    Helpers.clog(description + " in layer " + layer.name + " can be mapped to color variable " + currentSwatches.get(color).name);
    canMapColor = true;
  }
  else {
    Helpers.clog(description + " in layer " + layer.name + " doesn't map to any color variable");
    if (!missingSwatches.has(color)) missingSwatches.set(color, color);
  }

  return canMapColor;
}

// When the plugin is shutdown by Sketch (for example when the user disable the plugin)
// we need to close the webview if it's open
export function onShutdown() {
  const existingWebview = getWebview(webviewIdentifier)
  if (existingWebview) {
    existingWebview.close()
  }
}
