import fs from 'fs'
import path from 'path'
import { debug } from './logger'
import { ICommon } from '../types'

const defVendorId:number = -1
const defVendorName:string = 'Default'

let currentVendor:number = defVendorId

const Dict = new Map()
const Attr = new Map()
const Vendor = new Map()
const Locations = [path.normalize(__dirname + '/../dictionary')]

export const get = (id: number|string, vendor: number = -1 ) => {
  if (!Attr.has(id)) {
    throw new Error(`${id} is unknown attribute`)
  }

  if (!Dict.has(vendor) || !Dict.get(vendor).has(id)) {
    const attribute = Attr.get(id)
    vendor = attribute.vendor
    id = attribute.id
  }

  if (!Dict.has(vendor) || !Dict.get(vendor).has(id)) {
    throw new Error(`Vendor or Attr is unknown for vendor: ${vendor}, attr: ${id}`)
  }

  return Dict.get(vendor).get(id)
}

const add = file => {
  Locations.push(file)
}

const load = (externalDicts = []) => {
  let locations = Locations.concat(externalDicts)
  locations.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Dictionary File Doesn't Exist: ${file}`)
    }

    if (fs.statSync(file).isDirectory()) {
      const files = fs.readdirSync(file)

      for (let df = 0; df < files.length; df++) {
        const content = readFile(file + '/' + files[df])
        importContent(content)
      }
    } else {
      const content = readFile(file)
      importContent(content)
    }
  })
}

const readFile = dictionaryFile => {
  debug('dictionaryFile reading:' + dictionaryFile)

  return fs
    .readFileSync(dictionaryFile, 'ascii')
    .split(/\r?\n/)
    .map(line => line.replace(/\s*#.*$/, '').trim())
    .filter(line => line.length)
    .map(line => line.split(/\s+/))
}

const importContent = dContent => {
  for (const [key, ...values] of dContent) {
    switch (key) {
      case 'ATTRIBUTE':
        addAttr(currentVendor, ...values)
        break

      case 'VALUE':
        addAttrValue(currentVendor, ...values)
        break

      case 'VENDOR':
        addVendor(...values)
        break

      case 'BEGIN-VENDOR':
        changeVendor(...values)
        break

      case 'END-VENDOR':
        changeVendor(defVendorName)
        break
    }
  }
}

const addAttr: ICommon.SpreadableFn = (vendor, attr, id, type, ...flags) => {
  id = Number(id)
  vendor = Number(vendor)

  if (!Number.isFinite(id)) {
    throw new Error('Attribute Id must be Integer or Float')
  }

  if (vendor !== defVendorId && !Dict.has(vendor)) {
    throw new Error(`Vendor is unknown for VSA attribute ${vendor}, ${attr}`)
  }

  const Entry = {
    id,
    name: attr,
    type,
    flags: [...flags],
    values: new Map()
  }

  Dict.get(vendor).set(id, Entry)
  Attr.set(attr, {id, attr, vendor})
  Attr.set(id, {id, attr, vendor})

  debug('Dictionary Attribute Added', Vendor.get(vendor), id, attr)
}

const addAttrValue: ICommon.SpreadableFn = (vendor, attr, value, id) => {
  if (!Dict.has(vendor)) {
    throw new Error(`Vendor is unknown for VSA attribute value ${Vendor.get(vendor)}, ${attr}`)
  }

  if (!Attr.has(attr)) {
    throw new Error(`Unknown Attribute for ${attr}`)
  }

  const attribute = Attr.get(attr)

  if (!Dict.has(attribute.vendor) || !Dict.get(attribute.vendor).has(attribute.id)) {
    throw new Error(`Unknown Attribute Value for ${Vendor.get(vendor)} -> ${attr}`)
  }

  Dict.get(attribute.vendor).get(attribute.id).values.set(id, value)
  Dict.get(attribute.vendor).get(attribute.id).values.set(value, id)
  debug(`${attr} value added:`, value, id)
}

const addVendor: ICommon.SpreadableFn = (name: String, id: Number) => {
  id = Number(id)

  if (Vendor.has(id)) {
    throw new Error('Dublicated Vendor Id for Dictionary.')
  }

  Vendor.set(id, name)
  Vendor.set(name, id)
  Dict.set(id, new Map())
  debug('Added Vendor', id, name)
}

const changeVendor: ICommon.SpreadableFn = (name: String) => {
  if(!Vendor.has(name)) {
    throw new Error('Vendor is unknown.')
  }

  currentVendor = Vendor.get(name)
}

// Create a map for default vendor
addVendor(defVendorName, defVendorId)

export default {
  get,
  add,
  load,
}
