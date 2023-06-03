import Sizes from 'open-props/src/sizes';
import Colors from 'open-props/src/colors';
import ColorsHsl from 'open-props/src/colors-hsl';
import ColorsHd from 'open-props/src/props.colors-oklch.js';
import OklchHues from 'open-props/src/props.colors-oklch-hues.js';
import { StaticShadows as Shadows } from 'open-props/src/shadows';
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
  let generatedScss = '';
  
  // -------
  // Aspects
  // -------
  if (moduleName.toLowerCase() === 'aspects') {
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
  } else if (moduleName.toLowerCase() === 'media') {
    Object.keys(importObj).forEach((queryName) => {
      const processedQuery = customMediaHelper.process(queryName);
      queryName = queryName.replace('--', '$');
      generatedScss += `${queryName}: '${processedQuery}';\n`;
    });
  
  // -------
  // Shadows
  // -------
  } else if (moduleName.toLowerCase() === 'shadows') {
    
    generatedScss += `$shadow-color: 220 3% 15% !default;\n$shadow-strength: 1% !default;\n`;
    let mapKeyValue = '';
    const entries = Object.entries(importObj);
    
    for (let index = 0; index < entries.length; index++) {
      let [key, value] = entries[index];
    
      if (key.includes('@')) {
        continue; // Skip the key-value pair for anything containing @
      }
      key = key.replace('--shadow-', '');
      key = key.replace('--inner-shadow-', '\'inner-');
      value = value.replace(/var\(--(.*?)\)/g, '$$$1');
      value = value.replace(/hsl/g, 'Hsl')
      mapKeyValue += `${key}: (${value})`;
      
      if (index < entries.length - 1) {
        mapKeyValue += ',\n '; // Add comma  and new linefor all entries except the last one
      }
    };
    
    generatedScss += `$shadows-map: (\n${mapKeyValue}\n)`;
  
  // --------------------
  // All other Open Props
  // --------------------
  } else {
    Object.entries(importObj).forEach(([key, value]) => {
      if (key.includes('@')) {
        return; // Skip the key-value pair for anything containing @
      }
      key = key.replace('--', '$');
      
     
      // Exclude colors-hd for time being
      if (typeof value === 'string' && value.includes('var(--')) {
        if (moduleName !== 'colors-hd') {
          value = value.replace(/var\(--(.*?)\)/g, '#{$$$1}'); // replace var(--cssvar) with #{$cssvar} when they occur in a value
        }
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

indexScss += `@forward 'config/config';\n`;

const indexOutFile = path.join(__dirname, 'index.scss');
await fs.writeFile(indexOutFile, indexScss, { encoding: 'utf-8' });

