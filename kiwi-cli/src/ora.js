const ora = require('ora')


function processSpinner (text, callback) {
  const defaultText = `${text || 'On extracting'} ...`
  const spinner = ora({
    text: defaultText,
    color: 'green',
    // total: 100,
    interval: 50,
    prefixText: (...args) => {
      return ' !!!!! 哈哈哈哈哈'
    }
  }).start()
  let times = 0
  const timer = setInterval(() => {
    times++
    spinner.text = `${defaultText} It take ${times}s`
  }, 1000);
  
  if (callback) {
    callback(spinner, timer)
  }
}


// process test demo
processSpinner('scanner', (spin, timer) => {
  setTimeout(() => {
    spin.info('哈哈哈哈哈哈哈哈哈哈😄')
    clearInterval(timer)
    spin.succeed(`It is over!!!, It took ${timer}s`)
    spin.stop()
    spin.clear()
  }, 5000)
})