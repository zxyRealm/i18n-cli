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
  const params = {
    q: text,
    from: 'auto',
    to: 'en',
    appid,
    salt,
    sign,
    ...options
  }
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



function asyncFunc (i) {
  return new Promise((resolve, reject) => {
    const randomTime = (parseInt((Math.random() * 10)) + 5) * 100
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


let list=["a12", "b13", "c13", "d13", "e13"];
const p = function(num){
  return new Promise((resolve, reject) => {
    setTimeout(() => { 	
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
 
const package = require('../package.json')

googleTranslate('中', { tld: 'cn', form: 'zh-CN', to: 'en' }).then(res => {
  // console.log('google translate', res)
}).catch(error => {
  console.error(error)
})


const testList = [[1,2], [1,3], [2,3],[1,2], [2,4], [2,5], [2,4]]

testList.sort((a) => Number(a[0] === a[1]))

