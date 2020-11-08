import BrowserWindow from 'sketch-module-web-view'
import { getWebview } from 'sketch-module-web-view/remote'
import UI from 'sketch/ui'
const sketch = require('sketch');
const Helpers = require("./Helpers");
var document = sketch.getSelectedDocument();

const webviewIdentifier = 'map-color-variables.webview'
const automatedPrefix = "Auto-generated/";

export function MapColors() {
  Helpers.clog("Mapping to color variables");
  mapToColorVariables(false);
}

export function MapColorsAndCreateVariables() {
  Helpers.clog("Mapping to color variables and creating new ones");
  mapToColorVariables(true);
}

export function mapToColorVariables(createMissingVariables) {

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
        if (currentSwatches.has(item.color)) {
          Helpers.clog("Fill/border in layer " + layer.name + " can be mapped to color variable " + currentSwatches.get(item.color).name);
          item.color = currentSwatches.get(item.color).referencingColor;
        }
        else {
          Helpers.clog("Fill/border in layer " + layer.name + " doesn't map to any color variable");
          if (!missingSwatches.has(item.color)) {
            var details = [];
            details.push({
              "layer": layer,
              "item": item,
              "type": Helpers.ItemType.shape
            });
            missingSwatches.set(item.color, details);
          }
          else {
            var details = missingSwatches.get(item.color);
            details.push({
              "layer": layer,
              "item": item,
              "type": Helpers.ItemType.shape
            });
          }
        }
      })
    // Previous actions don't work for Text Layer colors that are colored using TextColor, so let's fix that:
    if (layer.style.textColor) {
      if (currentSwatches.has(layer.style.textColor)) {
        Helpers.clog("Text color in layer " + layer.name + " can be mapped to color variable " + currentSwatches.get(layer.style.textColor).name);
        layer.style.textColor = currentSwatches.get(layer.style.textColor).referencingColor;
      } else {
        Helpers.clog("Text color in layer " + layer.name + " doesn't map to any color variable");
        if (!missingSwatches.has(layer.style.textColor)) {
          var details = [];
          details.push({
            "layer": layer,
            "type": Helpers.ItemType.text
          });
          missingSwatches.set(layer.style.textColor, details);
        }
        else {
          var details = missingSwatches.get(layer.style.textColor);
          details.push({
            "layer": layer,
            "type": Helpers.ItemType.text
          });
        }
      }
    }
  });

  const allLayerStyles = document.sharedLayerStyles
  allLayerStyles.forEach(style => {
    style.style.fills.concat(style.style.borders).forEach(item => {
      if (item.fillType == 'Color') {
        if (currentSwatches.has(item.color)) {
          Helpers.clog("Fill/border in style " + style.name + " can be mapped to color variable " + currentSwatches.get(item.color).name);
          item.color = currentSwatches.get(item.color).referencingColor;
        }
        else {
          Helpers.clog("Fill/border in style " + style.name + " doesn't map to any color variable");
          if (!missingSwatches.has(item.color)) {
            var details = [];
            details.push({
              "style": style,
              "item": item,
              "type": Helpers.ItemType.layerStyle
            });
            missingSwatches.set(item.color, details);
          }
          else {
            var details = missingSwatches.get(item.color);
            details.push({
              "style": style,
              "item": item,
              "type": Helpers.ItemType.layerStyle
            });
          }
        }
      }
    })
  })


  const allTextStyles = document.sharedTextStyles
  allTextStyles.forEach(style => {
    if (currentSwatches.has(style.style.textColor)) {
      Helpers.clog("Color in text style " + style.name + " can be mapped to color variable " + currentSwatches.get(style.style.textColor).name);
      style.style.textColor = currentSwatches.get(style.style.textColor).referencingColor;
    }
    else {
      Helpers.clog("Color in text style " + style.name + " doesn't map to any color variable");
      if (!missingSwatches.has(style.style.textColor)) {
        var details = [];
        details.push({
          "style": style,
          "type": Helpers.ItemType.textStyle
        });
        missingSwatches.set(style.style.textColor, details);
      }
      else {
        var details = missingSwatches.get(style.style.textColor);
        details.push({
          "style": style,
          "type": Helpers.ItemType.textStyle
        });
      }
    }
  })

  if (createMissingVariables) {
    missingSwatches.forEach(function (value, key) {
      Helpers.clog("Adding missing swatch: " + key.toString());
      document.swatches.push(sketch.Swatch.from({
        name: automatedPrefix + key,
        color: key.toString()
      }));

      value.forEach(function (detail) {
        switch (detail.type) {
          case Helpers.ItemType.shape:
            detail.item.color = document.swatches[document.swatches.length - 1].referencingColor;
            break;
          case Helpers.ItemType.text:
            detail.layer.style.textColor = document.swatches[document.swatches.length - 1].referencingColor;
            break;
          case Helpers.ItemType.layerStyle:
            detail.item.color = document.swatches[document.swatches.length - 1].referencingColor;
            break;
          case Helpers.ItemType.textStyle:
            Helpers.clog("Will update text style: "+detail.style.name)
            detail.style.style.textColor = document.swatches[document.swatches.length - 1].referencingColor;
            break;
        }
      });
    });
  }

}

// When the plugin is shutdown by Sketch (for example when the user disable the plugin)
// we need to close the webview if it's open
export function onShutdown() {
  const existingWebview = getWebview(webviewIdentifier)
  if (existingWebview) {
    existingWebview.close()
  }
}
