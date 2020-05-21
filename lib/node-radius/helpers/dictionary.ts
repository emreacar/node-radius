import fs from 'fs'
import path from 'path'
import { debug, error } from './logger'
import { ICommon } from '../types'

const defVendorId:number = -1
const defVendorName:string = 'Default'

let currentVendor:Number = defVendorId

const Dict = new Map()
const Attr = new Map()
const Vendor = new Map()
const Locations = [path.normalize(__dirname + '/../dictionary')]

export const get = (id: number, vendor: number = -1 ) => {
  return Dict.get(vendor).get(id)
}

export const getId = (type: string, vendor: number = -1):number => {
  if (!Dict.has(vendor)) {
    error(`Vendor is unknown for id: ${vendor}`)
    return 0
  }

  if (!Attr.has(type)) {
    error(`${type} is Unknown Attribute`)
    return 0
  }

  return Attr.get(type)
}


const add = file => {
  Locations.push(file)
}

const load = () => {
  Locations.forEach(file => {
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

  if (!Number.isInteger(id)) {
    throw new Error('Attribute Id must be Integer')
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
  Attr.set(attr, id)
  debug('Dictionary Attribute Added', Vendor.get(vendor), id, attr)
}

const addAttrValue: ICommon.SpreadableFn = (vendor, attr, value, id) => {
  if (!Dict.has(vendor)) {
    throw new Error(`Vendor is unknown for VSA attribute value ${Vendor.get(vendor)}, ${attr}`)
  }

  const attrId = Attr.get(attr)

  if (!Dict.get(vendor).has(attrId)) {
    throw new Error(`Attribute is unknown for value ${Vendor.get(vendor)}, ${attr}`)
  }

  Dict.get(vendor).get(attrId).values.set(id, value)
  Dict.get(vendor).get(attrId).values.set(value, id)
  debug(`${attr} value added:`, value, id)
}

const addVendor: ICommon.SpreadableFn = (name: String, id: Number) => {
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
  getId,
  add,
  load,
}
