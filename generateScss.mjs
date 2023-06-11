import Sizes from 'open-props/src/sizes';
import Colors from 'open-props/src/colors';
import ColorsHsl from 'open-props/src/colors-hsl';
import ColorsHd from 'open-props/src/props.colors-oklch.js';
import OklchHues from 'open-props/src/props.colors-oklch-hues.js';
import GrayOklch from 'open-props/src/props.gray-oklch.js';
import Shadows from 'open-props/src/shadows';
import Aspects from 'open-props/src/aspects';
import Borders from 'open-props/src/borders';
import Fonts from 'open-props/src/fonts';
import Easings from 'open-props/src/easing';
import Gradients from 'open-props/src/gradients';
import Svg from 'open-props/src/svg';
import Zindex from 'open-props/src/zindex';
import MasksEdges from 'open-props/src/masks.edges';
import MasksCornerCuts from 'open-props/src/masks.corner-cuts';
import { CustomMedia as Media } from 'open-props/src/media';
//import Animations from 'open-props/src/animations';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CustomMediaHelper } from './CustomMediaHelper.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const customMediaHelper = new CustomMediaHelper(Media);

const openPropFiles = {
  'media': Media,
  'sizes': Sizes,
  'colors': Colors,
  'colors-hsl': ColorsHsl,
  'colors-hd': ColorsHd,
  'oklch-hues': OklchHues,
  'gray-oklch': GrayOklch,
  'shadows': Shadows,
  'aspects': Aspects,
  'borders': Borders,
  'fonts': Fonts,
  'easings': Easings,
  'gradients': Gradients,
  'svg': Svg,
  'zindex': Zindex,
  'masks.edges': MasksEdges,
  'masks.corner-cuts': MasksCornerCuts,
  //'animations': Animations,
};

const writeSCSSModule = async (moduleName, content) => {
  const outFile = path.join(__dirname, `${moduleName}.scss`);
  await fs.writeFile(outFile, content, { encoding: 'utf-8' });
};

const generateSCSSModule = async (moduleName, importObj) => {
  const lowerModName = moduleName.toLowerCase();
  let generatedScss = '';
  
  // -------
  // Aspects
  // -------
  if (lowerModName === 'aspects') {
    generatedScss = '@use "sass:list";\n';

    Object.entries(importObj).forEach(([key, value]) => {
      key = key.replace('--', '$');
      if (value.includes('/')) {
        value = `list.slash(${value.replace('/', ',')})`;
      }
      generatedScss += `${key}: ${value};\n`;
    });
    
  // -----
  // Media
  // -----
  } else if (lowerModName === 'media') {
    Object.keys(importObj).forEach((queryName) => {
      const processedQuery = customMediaHelper.process(queryName);
      queryName = queryName.replace('--', '$');
      generatedScss += `${queryName}: '${processedQuery}';\n`;
    });
    
  // -------
  // HD Colors
  // -------
  } else if (lowerModName === 'colors-hd') {
    generatedScss = '$color-hue: 0 !default;\n';
    
    Object.entries(importObj).forEach(([key, value]) => {
      key = key.replace('--', '$');
      value = value.replace(/var\(--(.*?)(?:,\s*(.*?))?\)/g, '#{$$$1}');

      generatedScss += `${key}: ${value};\n`;
    });
    
  // -------
  // HD Gray Shades
  // -------
  } else if (lowerModName === 'gray-oklch') {
    generatedScss = '$gray-hue: none !default;\n$gray-chroma: none !default;\n';
    
    Object.entries(importObj).forEach(([key, value]) => {
      key = key.replace('--', '$hd-'); // prevent naming conflict with the grays in colors module
      value = value.replace(/var\(--(.*?)(?:,\s*(.*?))?\)/g, '#{$$$1}');
      
      generatedScss += `${key}: ${value};\n`;
    });
  
  // -------
  // Shadows
  // -------
  } else if (lowerModName === 'shadows') {
    
    let mapKeysValues = '';
    const lightColor = Shadows['--shadow-color'];
    const lightStrength = Shadows['--shadow-strength'];
    const darkColor = Shadows['--shadow-color-@media:dark'];
    const darkStrength = Shadows['--shadow-strength-@media:dark'];
    
    const entries = Object.entries(importObj);
    
    for (let index = 0; index < entries.length; index++) {
      let [key, value] = entries[index];
      
      if (key == '--shadow-color' || key == '--shadow-strength' || key.includes('@')) {
        continue; // skip light and dark for the other loops
      } 

      key = key.replace('--shadow-', '');
      if (key.includes('--inner-shadow-')) {
        key = key.replace('--inner-shadow-', '\'inner-');
        key = key.replace(/$/, '\'');
      }
     
      value = value.replace(/var\(--(.*?)\)/g, '$$--$1');
      value = value.replace(/hsl/g, 'Hsl')
      mapKeysValues += `${key}: (${value})`;
      
      if (index < entries.length - 1) {
        mapKeysValues += ',\n '; // Add comma and new line for all entries except the last one
      }
    };
    
    generatedScss += `@use 'sass:map';
 
 @function shadow($level, $theme: light, $shadow-color: null, $shadow-strength: null) {
   $--shadow-color: $shadow-color or if($theme == dark, ${darkColor}, if($theme == cssvar, var(--shadow-color), ${lightColor}));
   $--shadow-strength: $shadow-strength or if($theme == dark, ${darkStrength}, if($theme == cssvar, var(--shadow-color), ${lightStrength}));
   $shadows-map: (
     ${mapKeysValues}
   );
   
   @return map.get($shadows-map, $level);
 }`;
    
  // --------------------
  // All other Open Props
  // --------------------
  } else {
    Object.entries(importObj).forEach(([key, value]) => {
      if (key.includes('@')) {
        return; // Skip the key-value pair for anything containing @
      }
      key = key.replace('--', '$');
      
      if (typeof value === 'string' && value.includes('var(--')) {
        value = value.replace(/var\(--(.*?)\)/g, '#{$$$1}'); // replace var(--cssvar) with #{$cssvar} when they occur in a value
      }
      
      generatedScss += `${key}: ${value};\n`;
    });
  }

  await writeSCSSModule(moduleName, generatedScss);
};

for (const [moduleName, importObj] of Object.entries(openPropFiles)) {
  generateSCSSModule(moduleName, importObj);
}

// Generate index.scss
let indexScss = '';
for (const moduleName in openPropFiles) {
  indexScss += `@forward '${moduleName}';\n`;
}

indexScss += `@forward 'config';\n`;

const indexOutFile = path.join(__dirname, 'index.scss');
await fs.writeFile(indexOutFile, indexScss, { encoding: 'utf-8' });

