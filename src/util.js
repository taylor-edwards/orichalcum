export const compose =
  (...fns) =>
  (...x) => {
    let y = fns.slice(-1)[0](...x)
    let i = fns.length - 1
    while (i > 0) {
      y = fns[--i](y)
    }
    return y
  }

export const curry = fn => {
  const handler = (...inputs) => {
    if (inputs.length >= fn.length) {
      return fn(...inputs)
    }
    return (...moreInputs) => handler(...inputs, ...moreInputs)
  }
  return handler
}

export const noop = () => {}

export const andThen = (fn, catchFn) => p => p.then(fn, catchFn)

export const apply = curry((fn, args) => fn(...args))

export const unapply =
  fn =>
  (...args) =>
    fn(args)

export const converge = (resolver, fns) => x =>
  compose(
    apply(resolver),
    reduce((args, fn) => [...args, fn(x)], []),
  )(fns)

export const slice = (start, end) => x =>
  Array.prototype.slice.call(x, start, end)

export const head = x => slice(0, 1)(x)[0]

export const tail = x => slice(-1)(x)[0]

export const map = curry((f, x) => Array.prototype.map.call(x, y => f(y)))

export const filter = curry((f, x) => Array.prototype.filter.call(x, y => f(y)))

export const reduce = (reducer, initialState) => x =>
  Array.prototype.reduce.call(x, reducer, initialState)

export const find = curry((pred, x) => Array.prototype.find.call(x, pred))

export const findIndex = curry((pred, x) =>
  Array.prototype.findIndex.call(x, pred),
)

export const concat = a => b => Array.prototype.concat.call(a, b)

export const join = separator => x => Array.prototype.join.call(x, separator)

export const replace = (matcher, replacer) => x =>
  String.prototype.replace.call(x, matcher, replacer)

export const has = curry((key, x) =>
  Object.prototype.hasOwnProperty.call(x, key),
)

export const prop = curry((key, x) => x[key])

export const entries = x => Object.entries(x)

export const fromEntries = x => Object.fromEntries(x)

export const keys = x => Object.prototype.keys.call(x)

export const omit = curry((key, obj) =>
  compose(
    fromEntries,
    filter(([k]) => k !== key),
    entries,
  )(obj),
)

export const modify = curry((initial, changes) =>
  compose(
    filteredChanges => Object.assign({}, initial, filteredChanges),
    fromEntries,
    filter(([key, value]) => typeof value !== 'undefined'),
    entries,
  )(changes),
)

export const applySpec =
  spec =>
  (...args) =>
    compose(
      fromEntries,
      map(([key, fn]) => [key, fn(...args)]),
      entries,
    )(spec)

export const is = curry((x, y) => x === y)

export const equals = curry((x, y) =>
  cond([
    [is, T],
    [(a, b) => typeof a !== typeof b, F],
    [
      (a, b) =>
        typeof a === 'object' &&
        reduce(
          (isEqual, [k, v]) => isEqual && equals(b[k], v),
          true,
        )(entries(a)),
      T,
    ],
    [T, F],
  ])(x, y),
)

export const always = x => () => x

export const identity = x => x

export const ifElse = curry((pred, thenFn, elseFn, x) =>
  pred(x) ? thenFn(x) : elseFn(x),
)

export const unless = curry((pred, fn, x) => (pred(x) ? x : fn(x)))

export const when = curry((pred, fn, x) => (pred(x) ? fn(x) : x))

export const T = () => true

export const F = () => false

export const cond =
  decisionMap =>
  (...inputs) => {
    const result = find(([pred]) => pred(...inputs), decisionMap)
    if (Array.isArray(result)) {
      return result[1](...inputs)
    }
  }

export const zip = (a, b) => {
  const len = Math.min(a.length, b.length)
  const c = []
  for (let i = 0; i < len; i++) {
    c.push([a[i], b[i]])
  }
  return c
}

export const range = (min, max) => {
  const arr = []
  const delta = min > max ? -1 : 1
  let i = min
  while (i !== max) {
    arr.push(i)
    i += delta
  }
  return arr
}

export const rand = (min, max) => Math.floor(Math.random() * (max - min) + min)

export const shuffle = list => {
  const newList = []
  while (list.length > 0) {
    const i = rand(0, list.length)
    newList.push(list[i])
    list = list.slice(0, i).concat(list.slice(i + 1))
  }
  return newList
}

export const log = x => console.log(x) ?? x
