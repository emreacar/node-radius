import fs from 'fs';
import path from 'path';
import { debug, info } from './logger';

const Dict = new Map();
// const Vendor = new Map();

const Locations = [path.normalize(__dirname + '/../dictionary')];

export const get = id => {
  return Dict.get(id);
};

const add = file => {
  Locations.push(file);
};

const load = () => {
  Locations.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Dictionary File Doesn't Exist: ${file}`);
    }

    if (fs.statSync(file).isDirectory()) {
      const files = fs.readdirSync(file);

      for (let df = 0; df < files.length; df++) {
        const content = readFile(file + '/' + files[df]);
        importContent(content);
      }
    } else {
      const content = readFile(file);
      importContent(content);
    }
  });
};

const readFile = dictionaryFile => {
  debug('dictionaryFile reading:' + dictionaryFile);

  return fs
    .readFileSync(dictionaryFile, 'ascii')
    .split(/\r?\n/)
    .map(line => line.replace(/\s*#.*$/, '').trim())
    .filter(line => line.length)
    .map(line => line.split(/\s+/));
};

const importContent = dContent => {
  let vendor = -1;

  for (let [key, ...values] of dContent) {
    switch (key) {
      case 'ATTRIBUTE':
        return addAttr(vendor, ...values);

      case 'VENDOR':
        return addVendor(...values);
    }
  }
};

const addAttr: SpreadableFn = (vendor, attr, id, type, ...params) => {
  id = Number(id);

  if (!Number.isInteger(id)) {
    throw new Error('Attribute Id must be Integer');
  }

  Dict.set(id, [attr, type, [...params]]);
  Dict.set(attr, [attr, type, [...params], id]);

  info('Dictionary Entry Added', id, attr);
};

const addVendor: SpreadableFn = (name, id, ...params) => {};

export default {
  get,
  add,
  load,
};
