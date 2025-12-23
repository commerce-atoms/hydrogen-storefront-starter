import ignores from './config/ignores.js';
import base from './config/base.js';
import react from './config/react.js';
import typescript from './config/typescript.js';
import importOrder from './config/import-order.js';
import boundaries from './config/boundaries.js';
import specialCases from './config/special-cases.js';
import dataTestId from './config/data-testid.js';

/**
 * Main ESLint config
 * Assembles all configuration modules in the correct order
 */
export default [
  ignores,
  ...base,
  ...react,
  ...typescript,
  importOrder,
  ...boundaries,
  ...specialCases,
  dataTestId,
];
