const qs = require('qs')
const _ =  require('lodash');
const request = require('request')
const md5 = require('js-md5');
const translate = require('translate')
const googleTranslate = require('@vitalets/google-translate-api')
// const baiduTranslate = require('baidu-translate-api')

function baiduTranslate (text, options = {}) {
  const { appid = '20210105000663752', secretKey = 'W1uUbJOMvFevPj0OcjG1' } = options
  const salt = getRandomStr(8)
  const signStr = appid + text + salt + secretKey
  const sign = md5(signStr)
  console.log('sign', sign, signStr)
  const params = {
    q: text,
    from: 'auto',
    to: 'en',
    appid,
    salt,
    sign,
    ...options
  }
  console.log('params', params)
  return new Promise((resolve, reject) => {
    request({
      url: `http://api.fanyi.baidu.com/api/trans/vip/translate?${qs.stringify(params)}`,
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    }, function(error, response, body) {
        if (error) return reject(error)
        resolve(body)
    })
  })
}


function getRandomStr (length = 4) {
  let result = Math.floor(Math.random() * 90 + 10).toString()
  for (let i = 0; i < length - 2; i++) {
    let ranNum = Math.ceil(Math.random() * 25)
    result += String.fromCharCode(65 + ranNum).toString()
  }
  return result
}

// baiduTranslate('中国').then(res => {
//   console.log('baidu translate', res)
// }).catch(error => {
//   console.error('error', error)
// })

function asyncFunc (i) {
  return new Promise((resolve, reject) => {
    const randomTime = (parseInt((Math.random() * 10)) + 5) * 100
    console.log('random time', randomTime)
    setTimeout(() => {
      randomTime <= 1400 ? resolve((i * 2) + 'async') : reject()
    }, randomTime)
  })
}

const List = [1, 2, 3, 4]
function getAllAsyncResults (list, func) {
  return new Promise((resolve, reject) => {
    let isError = false
    let results = []
    list.reduce(async (pre, curr, index) => {
      if (isError) return null
      try {
        let val = await pre
        if (val !== null) results.push(val)
        if (index === list.length - 1) {
          val = await func(curr)
          results.push(val)
          resolve(results)
        }
        return func(curr)
      } catch (e) {
        isError = true
        reject(e)
        return null
      }
    }, null)
  })
}

// getAllAsyncResults(List).then(res => {
//   console.log('all result', res)
// }).catch(e => {
//   console.error(e)
// })

let list=["a12", "b13", "c13", "d13", "e13"];
const p = function(num){
  return new Promise((resolve, reject) => {
    setTimeout(() => { 	
      console.log(">>>>>"+num);
      resolve("ok"+num);
  	}, 1000)
 	})
};
 
const g = function(){
  return new Promise((resolve, reject) => {
  const results = []
  list.reduce(async(pre,cur,index)=>{
    const data = await pre; //异步
    if (data !== null) results.push(data)
    if(index==list.length-1){ //最后一个项目
      await p(cur);
      resolve(results)
    } else return p(cur);
  },null);
});
}
 
// g().then((e)=>{
// 	console.log(e);
// });
// console.log('all result ', asyncAllResult)

// translate('中共', {
//   engine: 'libre',
//   from: 'zh',
//   to: 'en'
// }).then((val) => {
//   console.log('translate text', val)
// }
const package = require('../package.json')

// console.log('package.json', typeof package, package.dependencies)
// console.log('google translate', translate.getAllLanguage())
googleTranslate('中', { tld: 'cn', form: 'zh-CN', to: 'en' }).then(res => {
  console.log('google translate', res)
}).catch(error => {
  console.error(error)
})
