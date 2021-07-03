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
  tests.map(([name, testFn]) => {
    console.log(`Running ${name}...`)
    try {
      const res = testFn(assert)
      if (res instanceof Promise) {
        res.catch(err =>
          console.error(`Uncaught error in Promise (running ${name}):`, err),
        )
      }
    } catch (err) {
      console.error('Uncaught error:', err)
    }
  })

const paths = process.argv.slice(-1)[0]
gatherTests(paths)
  .then(tests => Promise.all(runTests(tests)))
  .finally(() => console.log('Done!'))
