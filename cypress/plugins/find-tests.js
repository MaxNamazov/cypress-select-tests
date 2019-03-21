const falafel = require('falafel')
const fs = require('fs')
const R = require('ramda')

const isTestBlock = name => node => {
  return (
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === name
  )
}

const isDescribe = isTestBlock('describe')

const isContext = isTestBlock('context')

const isIt = isTestBlock('it')

const isItOnly = node => {
  return (
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object &&
    node.callee.property &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'it' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.property.name === 'only'
  )
}

const isItSkip = node => {
  return (
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object &&
    node.callee.property &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'it' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.property.name === 'skip'
  )
}

const getItsName = node => node.arguments[0].value

/**
 * Given an AST test node, walks up its parent chain
 * to find all "describe" or "context" names
 */
const findSuites = (node, names = []) => {
  if (!node) {
    return
  }

  if (isDescribe(node) || isContext(node)) {
    names.push(getItsName(node))
  }

  return findSuites(node.parent, names)
}

const findTests = source => {
  const foundTestNames = []

  const onNode = node => {
    // console.log(node)

    if (isIt(node)) {
      const names = [getItsName(node)]
      findSuites(node, names)

      // we were searching from inside out, thus need to revert the names
      const testName = names.reverse()
      // console.log('found test', testName)
      foundTestNames.push(testName)
    }

    // TODO: handle it.only and it.skip
    // else if (isItOnly(node)) {
    //   const testName = [getItsName(node)]
    //   console.log('found it.only', testName)
    //   // nothing to do
    // } else if (isItSkip(node)) {
    //   const testName = [getItsName(node)]
    //   console.log('found it.skip', testName)
    //   node.update('it.only' + node.source().substr(7))
    // }
  }

  // ignore source output for now
  falafel(source, onNode)

  return foundTestNames
}

module.exports = {
  findTests
}
