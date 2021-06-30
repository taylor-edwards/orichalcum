export const test = (name, fn) => {
  console.log(`Running tests for ${name}...`)
  try {
    const res = fn()
    if (res instanceof Promise) {
      res.then(() => {}, err =>
        console.error(`Uncaught error in promise (testing ${name}):`, err),
      )
    }
  } catch (err) {
    console.error('Uncaught error:', err)
  }
}

export const assert = (() => {
  let i = 0
  return (f, x, y) => {
    console.assert(
      f(y, x),
      `(${i + 1}) Expected ${JSON.stringify(x)}, but got ${JSON.stringify(y)}`,
    )
    i++
  }
})()
