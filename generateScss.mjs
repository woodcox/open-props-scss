import Sizes from 'open-props/src/sizes';
import Colors from 'open-props/src/colors';
import ColorsHsl from 'open-props/src/colors-hsl';
import ColorsHd from 'open-props/src/props.colors-oklch.js';
import OklchHues from 'open-props/src/props.colors-oklch-hues.js';
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
  
//=========================
// Aspects
//=========================

  if (moduleName.toLowerCase() === 'aspects') {
    generatedScss = '@use "sass:list";\n';

    Object.entries(importObj).forEach(([key, value]) => {
      key = key.replace('--', '$');
      if (value.includes('/')) {
        value = `list.slash(${value.replace('/', ',')})`;
      }
      generatedScss += `${key}: ${value};\n`;
    });
    
  //=========================
  // Media
  //=========================
  } else if (moduleName.toLowerCase() === 'media') {
    Object.keys(importObj).forEach((queryName) => {
      const processedQuery = customMediaHelper.process(queryName);
      queryName = queryName.replace('--', '$');
      generatedScss += `${queryName}: '${processedQuery}';\n`;
    });
  
  //=========================
  // Shadows
  //=========================
  } else if (moduleName.toLowerCase() === 'shadows') {
    let darkMediaStr = '';
    let cssSassVarStr = '';
    
    Object.entries(importObj).forEach(([key, value]) => {
      if (key.includes('-@media:dark')) {
        const mediaKey = key.replace(/--([^@]*)-@media:dark/, '--$1');
        darkMediaStr += `${mediaKey}: ${value};`;
      } else {
        key = key.replace('--', '$');
        generatedScss += `${key}: ${value};\n`;
        
        // Extract CSS variable names
        const cssVarNames = value.match(/var\(--(.*?)\)/g)?.map((match) => match.match(/var\(--(.*?)\)/)[1]);
        
        if (cssVarNames && cssVarNames.length > 0) {
          // Remove duplicates and empty string from cssVarNames 
          const uniqueCssVarStr = [...new Set(cssVarNames)];
          
          // Create CSS: Sass key-value pairs and split using || as a delimiter
          cssSassVarStr += uniqueCssVarStr
            .map(varName => `--${varName}: #{$${varName}}||`)
            .join('')
            .split('||');
        }
      }
    });

    // Remove duplicates of all the CSS: sass key value pairs
    const uniqueCssSass = [...new Set(cssSassVarStr.split(','))].join(',').replace(/,/g, ';');
    
    generatedScss += `:where(html) { ${uniqueCssSass} }\n`;
    generatedScss += `{ :where(html) { ${darkMediaStr} }`;
  
  //=========================
  // All other Open Props
  //=========================
  } else {
    Object.entries(importObj).forEach(([key, value]) => {
      if (key.includes('@')) {
        return; // Skip the key-value pair for anything containing @
      }
      key = key.replace('--', '$');
      
      //==================
      // Exclude colors-hd
      //==================
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

