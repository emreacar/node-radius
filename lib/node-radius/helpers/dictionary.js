import fs from 'fs'
import path from 'path'

const Dict = new Map()
const Vendor = new Map()
const debugMsg = require('debug')('debug')

const Locations = [
  path.normalize(__dirname + "/../dictionary")
]

function get(id) {
  return Dict.get(id)
}

function add(file) {
  Locations.push(file)
}

function load() {
  Locations.forEach(function(file) {
    if (!fs.existsSync(file)) {
      throw new Error("Dictionary File Doesn't Exist: " + file);
    }

    if (fs.statSync(file).isDirectory()) {
      const files = fs.readdirSync(file)

      for (let df = 0; df < files.length; df++) {
        const content = readFile(file + "/" + files[df])
        importContent(content)
      }
    } else {
      const content = readFile(file)
      importContent(content)
    }
  })
}

function readFile(dictionaryFile) {
  debugMsg('dictionaryFile Reading', dictionaryFile)

  return fs.readFileSync(dictionaryFile, 'ascii')
    .split(/\r?\n/)
    .map(line => line.replace(/\s*#.*$/, '').trim())
    .filter(line => line.length)
    .map(line => line.split(/\s+/))
}

function importContent(dContent) {
  let vendor = -1
  debugMsg('dictionaryImporting')
  for(let [key, ...values] of dContent ) {
    switch (key) {
      case 'ATTRIBUTE':
        addAttr(vendor, ...values)
        break
      case 'VENDOR':
        addVendor(...values)
        break
    }
  }
}

function addAttr(vendor, attr, id, type, ...params) {
  id = Number(id)

  if(!Number.isInteger(id)) {
    throw new Error('Attribute Id must be Integer')
  }

  Dict.set(id, [attr, type, [...params]])
  Dict.set(attr, [attr, type, [...params]])

  debugMsg('dictionaryEntry Added', id, attr)
}

function addVendor(name, id, ...params) {}


export default { get, add, load }