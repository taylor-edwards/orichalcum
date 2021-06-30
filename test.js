import glob from 'glob'

const paths = process.argv.slice(-1)[0]

glob(paths, async (err, files) => {
  if (err) {
    return console.error(err)
  }
  await Promise.all(files.map(filePath => import(`./${filePath}`)))
  console.log('Done!')
})
