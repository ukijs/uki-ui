import { string } from 'rollup-plugin-string';
import less from 'rollup-plugin-less';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';
import execute from 'rollup-plugin-execute';
import pkg from './package.json';

// Derive some of the configuration from package.json
const peerDependencies = Object.keys(pkg.peerDependencies);
const allExternals = peerDependencies.concat(
  Object.keys(pkg.dependencies || {})).concat(
  Object.keys(pkg.devDependencies || {}));
const commonPlugins = [
  string({
    include: ['**/*.css', '**/*.html', '**/*.text.svg']
  }),
  less({
    include: ['**/*.less'],
    output: false,
    insert: false
  }),
  json(),
  image({
    include: ['**/*.gif', '**/*.png', '**/*.img.svg']
  }),
  execute('ls -d examples/*/ | xargs -n 1 cp -v dist/uki-ui.esm.js && ls -d examples/*/ | xargs -n 1 cp -v node_modules/uki/dist/uki.esm.js')
];

// Basic build formats, without minification
export default [
  // ES Module
  {
    input: 'src/module.js',
    output: {
      file: pkg.module,
      format: 'es'
    },
    external: allExternals,
    plugins: commonPlugins
  }
];
