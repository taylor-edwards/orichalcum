import glob from 'glob'

const assert = (() => {
  let i = 0
  return (f, x, y) => {
    console.assert(
      f(y, x),
      `(${i + 1}) Expected ${JSON.stringify(x)}, but got ${JSON.stringify(y)}`,
    )
    i++
  }
})()

const refEquals = (x, y) => x === y

const arrayEquals = (x, y) =>
  Array.isArray(x) &&
  Array.isArray(y) &&
  x.length === y.length &&
  x.reduce((isEqual, nextX, index) => isEqual && equals(nextX, y[index]), true)

const equals = (x, y) => {
  if (refEquals(x, y)) {
    return true
  }
  if (typeof x === 'object' && typeof y === 'object') {
    if (arrayEquals(x, y)) {
      return true
    }
    if (
      arrayEquals(Object.keys(x), Object.keys(y)) &&
      arrayEquals(Object.values(x), Object.values(y))
    ) {
      return true
    }
  }
  return false
}

const gatherTests = paths =>
  new Promise((resolve, reject) => {
    glob(paths, async (err, files) => {
      if (err) {
        reject(err)
      } else {
        const testsByFile = await Promise.all(
          files.map(filePath => import(`./${filePath}`)),
        )
        const tests = testsByFile.reduce(
          (allTests, nextFile) => allTests.concat(Object.entries(nextFile)),
          [],
        )
        resolve(tests)
      }
    })
  })

const runTests = tests =>
  tests.map(async ([name, testFn]) => {
    console.log(`Running ${name}...`)
    try {
      const res = testFn({ assert, equals, refEquals, arrayEquals })
      if (res instanceof Promise) {
        res.catch(err =>
          console.error(`Uncaught error in Promise (running ${name}):`, err),
        )
      }
      return res
    } catch (err) {
      console.error('Uncaught error:', err)
    }
  })

const paths = process.argv.slice(-1)[0]
gatherTests(paths)
  .then(tests => Promise.all(runTests(tests)))
  .finally(() => console.log('Done!'))
