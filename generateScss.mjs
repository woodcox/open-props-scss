import Sizes from 'open-props/src/sizes';
import Colors from 'open-props/src/colors';
import ColorsHsl from 'open-props/src/colors-hsl';
import OklchColors from 'open-props/src/props.colors-oklch.js';
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
import Animations from 'open-props/src/animations';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CustomMediaHelper } from './CustomMediaHelper.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const customMediaHelper = new CustomMediaHelper(Media);

const OklchColorsAndHues = {
 'oklch-colors': OklchColors,
 'oklch-hues': OklchHues,
};

const openPropFiles = {
  'media': Media,
  'sizes': Sizes,
  'colors': Colors,
  'colors-hsl': ColorsHsl,
  'colors-oklch': OklchColorsAndHues,
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
  'animations': Animations,
};

const writeSCSSModule = async (moduleName, content) => {
  const outFile = path.join(__dirname, `${moduleName}.scss`);
  await fs.writeFile(outFile, content, { encoding: 'utf-8' });
};

// md codeblock
const writeMDCodeBlock = async (moduleName, content) => {
  const outFile = path.join(__dirname, `${moduleName}.md`);
  const codeBlock = '```scss\n' + content + '\n```';
  await fs.writeFile(outFile, codeBlock, { encoding: 'utf-8' });
};

const generateSCSSModule = async (moduleName, importObj) => {
  let generatedScss = '';
  
  // aspects.scss
  if (moduleName.toLowerCase() === 'aspects') {
    generatedScss = '@use "sass:list";\n';

    Object.entries(importObj).forEach(([key, value]) => {
      key = key.replace('--', '$');
      if (value.includes('/')) {
        value = `list.slash(${value.replace('/', ',')})`;
      }
      generatedScss += `${key}: ${value} !default;\n`;
    });
    
  // media.scss
  } else if (moduleName.toLowerCase() === 'media') {
    Object.keys(importObj).forEach((queryName) => {
      const processedQuery = customMediaHelper.process(queryName);
      queryName = queryName.replace('--', '$');
      generatedScss += `${queryName}: '${processedQuery}' !default;\n`;
    });
    
  // colors-oklch.scss
  } else if (moduleName.toLowerCase() === 'colors-oklch') {
    const { 'oklch-colors': oklchcolors, 'oklch-hues': oklchHues } = importObj;
    let hueArray = [];
    generatedScss += `$color-hue: null;\n`;

    Object.entries(oklchHues).forEach(([key, value]) => {
      const hue = parseInt(value, 10); // Convert value to an integer
      if (!isNaN(hue)) {
        const colorName = key.replace('--hue-', ''); // Extract the color name from the key
        hueArray += `${colorName}: ${hue}\n`;
        console.log(hueArray);
      }
    });
   
    Object.entries(oklchcolors).forEach(([key, value]) => {
      key = key.replace('--', '$');
      value = value.replace(/var\(--(.*?)(?:,\s*(.*?))?\)/g, '#{$$$1}');

      generatedScss += `${key}: ${value};\n`;
    });

    
   //   key = key.replace('--', '$');
   //   if (typeof value === 'string' && value.includes('var(--')) {
   //     value = value.replace(/var\(--(.*?)\)/g, '#{$$$1}'); // replace var(--cssvar) with #{$cssvar} when they occur in a value
   //   }

   //   generatedScss += `${key}: ${value} !default;\n`;
    
    
  // gray-oklch.scss
  } else if (moduleName.toLowerCase() === 'gray-oklch') {
    generatedScss = '$gray-hue: none !default;\n$gray-chroma: none !default;\n';
    
    Object.entries(importObj).forEach(([key, value]) => {
      key = key.replace('--', '$hd-'); // prevent naming conflict with the grays in colors module
      value = value.replace(/var\(--(.*?)(?:,\s*(.*?))?\)/g, '#{$$$1}');
      
      generatedScss += `${key}: ${value} !default;\n`;
    });

  // animations.scss
  } else if (moduleName.toLowerCase() === 'animations') {
    generatedScss = "@use 'easings' as _e;\n@use 'media' as _mq;\n@use 'sass:string';\n\n$animation-id: string.unique-id();\n";
    
    const fadeInBloom = Animations['--animation-fade-in-bloom'];
    const fadeInBloomDark = fadeInBloom.replace(/(\w+)\s+(\S+)/, '$1-dark-#{$animation-id} $2').replace(/var\(--(.*?)\)/g, '#{_e.$$$1}');
    const fadeOutBloom = Animations['--animation-fade-out-bloom'];
    const fadeOutBloomDark = fadeOutBloom.replace(/(\w+)\s+(\S+)/, '$1-dark-#{$animation-id} $2').replace(/var\(--(.*?)\)/g, '#{_e.$$$1}');
    const keyframeFIB = Animations['--animation-fade-in-bloom-@'].replace(/@keyframes\s+(\S+)/, '@keyframes $1-#{$animation-id}');
    const keyframeFIBDark = Animations['--animation-fade-in-bloom-@media:dark'].replace(/@keyframes\s+(\S+)/, '@keyframes $1-dark-#{$animation-id}');
    const keyframeFOB = Animations['--animation-fade-out-bloom-@'].replace(/@keyframes\s+(\S+)/, '@keyframes $1-#{$animation-id}');
    const keyframeFOBDark = Animations['--animation-fade-out-bloom-@media:dark'].replace(/@keyframes\s+(\S+)/, '@keyframes $1-dark-#{$animation-id}');
    let animationsStr = '';
    let keyframesStr = '';
    
    Object.entries(importObj).forEach(([key, value]) => {
      if (value.includes('@keyframes') && !value.includes('fade-in-bloom') && !value.includes('fade-out-bloom')) {
        key = key.replace(/--|animation-|-@/g, '');
        value = value.replace(/@keyframes\s+(\S+)/, '@keyframes $1-#{$animation-id}');
        keyframesStr += `@mixin ${key}{${value}}\n`; // create @keyframes sass mixins
      } else if (!key.includes('-@')) {
        key = key.replace('--', '$');
        value = value.replace(/(\w+)\s+(\S+)/, '$1-#{$animation-id} $2');
        const sassVar = value.replace(/var\(--(.*?)\)/g, '#{_e.$$$1}'); // Replace var(--cssvar) with e.$cssvar when they occurs in a value
        animationsStr += `${key}: ${sassVar} !default;\n`
      }
    });
    
    generatedScss += `${animationsStr}$animation-fade-in-bloom-dark: ${fadeInBloomDark} !default;\n$animation-fade-out-bloom-dark: ${fadeInBloomDark} !default;\n\n${keyframesStr}
@mixin fade-in-bloom($theme: light) {
  @if ($theme == dark) {
    ${keyframeFIBDark}
  } @else {
    ${keyframeFIB}
  }
}

@mixin fade-out-bloom($theme: light) {
  @if ($theme == dark) {
    ${keyframeFOBDark}
  } @else {
    ${keyframeFOB}
  }
}`;
  
  // shadows.scss
  } else if (moduleName.toLowerCase() === 'shadows') {
    
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
  $--shadow-color: $shadow-color or if($theme == dark, ${darkColor}, ${lightColor});
  $--shadow-strength: $shadow-strength or if($theme == dark, ${darkStrength}, ${lightStrength});
  $shadows-map: (
    ${mapKeysValues}
  );

  @return map.get($shadows-map, $level);
}`;
    
  // All other open props
  } else {
    Object.entries(importObj).forEach(([key, value]) => {
      if (key.includes('@')) {
        return; // Skip the key-value pair for anything containing @
      }
      key = key.replace('--', '$');
      
      if (typeof value === 'string' && value.includes('var(--')) {
        value = value.replace(/var\(--(.*?)\)/g, '#{$$$1}'); // replace var(--cssvar) with #{$cssvar} when they occur in a value
      }
      
      generatedScss += `${key}: ${value} !default;\n`;
    });
  }

  // write scss & md files
  await writeSCSSModule(moduleName, generatedScss);
  await writeMDCodeBlock(moduleName, generatedScss);
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

