import {
  always,
  andThen,
  compose,
  curry,
  entries,
  equals,
  identity,
  is,
  join,
  map,
  noop,
} from './util.js'
import { assert, test } from '../test-util.js'

test('compose', () => {
  assert(is, 'foo', compose(identity)('foo'))
  assert(is, 'foo', compose(identity, identity)('foo'))
  assert(is, 'bar', compose(identity, always('bar'), identity)('foo'))
  const printObject = compose(
    join('\n'),
    map(([key, value]) => `${key} is ${value}`),
    entries,
  )
  assert(is, 'a is 1\nb is 2\nc is 3', printObject({ a: 1, b: 2, c: 3 }))
  assert(is, '0 is a\n1 is b\n2 is c', printObject(['a', 'b', 'c']))
})

test('curry', () => {
  const formABC = curry((a, b, c) => `${a}${b}${c}`)
  const target = 'abc'
  assert(is, target, formABC('a', 'b', 'c'))
  assert(is, target, formABC('a')('b')('c'))
  assert(is, target, formABC('a', 'b')('c'))
  assert(is, target, formABC('a')('b', 'c'))
  assert(is, target, formABC()()()('a', 'b', 'c'))
})

test('andThen', async () => {
  const foo = await andThen(
    identity,
    noop,
  )(new Promise((resolve, reject) => resolve('foo')))
  assert(is, 'foo', foo)
  const bar = await andThen(
    noop,
    always('bar'),
  )(new Promise((resolve, reject) => reject(new Error('ignored'))))
  assert(is, 'bar', bar)
})

test('equals', () => {
  // support primitives
  assert(equals, 1, 1)
  assert(equals, 3.141, 3.141)
  assert(equals, 'a simple string', 'a simple string')
  assert(is, false, equals(1, -1))
  assert(is, false, equals('alarming', 'pandas'))
  // support objects by reference and by value
  const targetObj = { a: 'a', b: 'b' }
  assert(equals, targetObj, targetObj)
  assert(equals, targetObj, { a: 'a', b: 'b' })
  const targetArr = ['a', 1, false]
  assert(equals, targetArr, targetArr)
  assert(equals, targetArr, ['a', 1, false])
  // support nested objects
  const targetNested = {
    a: 'a',
    b: { b1: true, b2: 'hello', b3: ['x', 'y', 3] },
    c: 2.2,
  }
  assert(equals, targetNested, {
    a: 'a',
    b: { b1: true, b2: 'hello', b3: ['x', 'y', 3] },
    c: 2.2,
  })
  assert(
    is,
    false,
    equals(targetNested, {
      a: 'a',
      b: { b1: true, b2: 'hello', b3: ['x', 'y', 3] },
    }),
  )
  // support function equality solely by reference.
  // this is mainly to mirror the behavior of is()
  const targetFn = () => {}
  assert(equals, targetFn, targetFn)
  assert(
    is,
    false,
    equals(targetFn, () => {}),
  )
})
