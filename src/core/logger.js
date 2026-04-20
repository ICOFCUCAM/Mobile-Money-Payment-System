'use strict';

function ts() {
  return new Date().toISOString();
}

function fmt(level, args) {
  return `[${ts()}] [${level}] ${args
    .map((a) => (a instanceof Error ? `${a.message}\n${a.stack}` : typeof a === 'object' ? JSON.stringify(a) : a))
    .join(' ')}`;
}

module.exports = {
  info: (...args) => console.log(fmt('INFO', args)),
  warn: (...args) => console.warn(fmt('WARN', args)),
  error: (...args) => console.error(fmt('ERROR', args)),
  debug: (...args) => {
    if (process.env.DEBUG) console.log(fmt('DEBUG', args));
  }
};
