"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const eventEmitter_1 = __importDefault(require("./eventEmitter"));
require("../types");
const defVendorId = -1;
const defVendorName = 'Default';
let currentVendor = defVendorId;
const Dict = new Map();
const Attr = new Map();
const Vendor = new Map();
const Locations = [path_1.default.normalize(__dirname + '/../dictionary')];
exports.get = (id, vendor = -1) => {
    const altName = id;
    if (typeof id === 'string') {
        id = id
            .replace(/-/g, '')
            .match(/[A-Z][a-z]+/g)
            .join('-');
    }
    if (Attr.has(altName))
        id = altName;
    if (!Attr.has(id)) {
        throw new Error(`${id} is unknown attribute`);
    }
    if (!Dict.has(vendor) || !Dict.get(vendor).has(id)) {
        const attribute = Attr.get(id);
        vendor = attribute.vendor;
        id = attribute.id;
    }
    if (!Dict.has(vendor) || !Dict.get(vendor).has(id)) {
        throw new Error(`Vendor or Attr is unknown for vendor: ${vendor}, attr: ${id}`);
    }
    return Dict.get(vendor).get(id);
};
const add = file => {
    Locations.push(file);
};
const load = (externalDicts = []) => {
    let locations = Locations.concat(externalDicts);
    locations.forEach(file => {
        if (!fs_1.default.existsSync(file)) {
            throw new Error(`Dictionary File Doesn't Exist: ${file}`);
        }
        if (fs_1.default.statSync(file).isDirectory()) {
            const files = fs_1.default.readdirSync(file);
            for (let df = 0; df < files.length; df++) {
                const content = readFile(file + '/' + files[df]);
                importContent(content);
            }
        }
        else {
            const content = readFile(file);
            importContent(content);
        }
    });
};
const readFile = dictionaryFile => {
    eventEmitter_1.default.emit('logger', 'debug', `dictionaryFile reading: ${dictionaryFile}`);
    return fs_1.default
        .readFileSync(dictionaryFile, 'ascii')
        .split(/\r?\n/)
        .map(line => line.replace(/\s*#.*$/, '').trim())
        .filter(line => line.length)
        .map(line => line.split(/\s+/));
};
const importContent = dContent => {
    for (const [key, ...values] of dContent) {
        switch (key) {
            case 'ATTRIBUTE':
                addAttr(currentVendor, ...values);
                break;
            case 'VALUE':
                addAttrValue(currentVendor, ...values);
                break;
            case 'VENDOR':
                addVendor(...values);
                break;
            case 'BEGIN-VENDOR':
                changeVendor(...values);
                break;
            case 'END-VENDOR':
                changeVendor(defVendorName);
                break;
        }
    }
};
const addAttr = (vendor, attr, id, type, ...flags) => {
    id = Number(id);
    vendor = Number(vendor);
    if (!Number.isFinite(id)) {
        throw new Error('Attribute Id must be Integer or Float');
    }
    if (vendor !== defVendorId && !Dict.has(vendor)) {
        throw new Error(`Vendor is unknown for VSA attribute ${vendor}, ${attr}`);
    }
    const AttrEntry = {
        id,
        attr,
        vendor
    };
    const DictEntry = {
        ...AttrEntry,
        type,
        flags: [...flags],
        values: new Map()
    };
    Dict.get(vendor).set(id, DictEntry);
    Attr.set(attr, AttrEntry);
    Attr.set(id, AttrEntry);
    eventEmitter_1.default.emit('logger', 'debug', 'Dictionary Attribute Added', Vendor.get(vendor), id, attr);
};
const addAttrValue = (vendor, attr, value, id) => {
    if (!Dict.has(vendor)) {
        throw new Error(`Vendor is unknown for VSA attribute value ${Vendor.get(vendor)}, ${attr}`);
    }
    if (!Attr.has(attr)) {
        throw new Error(`Unknown Attribute for ${attr}`);
    }
    const attribute = Attr.get(attr);
    if (!Dict.has(attribute.vendor) || !Dict.get(attribute.vendor).has(attribute.id)) {
        throw new Error(`Unknown Attribute Value for ${Vendor.get(vendor)} -> ${attr}`);
    }
    id = Number(id);
    Dict.get(attribute.vendor).get(attribute.id).values.set(id, value);
    Dict.get(attribute.vendor).get(attribute.id).values.set(value, id);
    eventEmitter_1.default.emit('logger', 'debug', `${attr} value added:`, value, id);
};
const addVendor = (name, id) => {
    id = Number(id);
    if (Vendor.has(id)) {
        throw new Error('Dublicated Vendor Id for Dictionary.');
    }
    Vendor.set(id, name);
    Vendor.set(name, id);
    Dict.set(id, new Map());
    eventEmitter_1.default.emit('logger', 'debug', 'Vendor Added:', id, name);
};
const changeVendor = (name) => {
    if (!Vendor.has(name)) {
        throw new Error('Vendor is unknown.');
    }
    currentVendor = Vendor.get(name);
};
addVendor(defVendorName, defVendorId);
exports.default = {
    get: exports.get,
    add,
    load
};
//# sourceMappingURL=dictionary.js.map