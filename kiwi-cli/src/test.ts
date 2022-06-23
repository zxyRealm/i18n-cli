function delay() {
  return new Promise(resolve => setTimeout(() => resolve(true), 500))
}


async function processArray (array) {
  const start = Date.now()
  for (const item of array) {
      await delay()
  }
}

processArray([1,2,3,4,5])
