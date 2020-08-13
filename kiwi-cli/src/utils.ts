/**
 * @author linhuiw
 * @desc 工具方法
 */
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs';
import { PROJECT_CONFIG, KIWI_CONFIG_FILE } from './const';
import translate, { parseMultiple } from 'google-translate-open-api'
import * as ts from 'typescript'
const dirs = require('node-dir')

function lookForFiles(dir: string, fileName: string): string {
  const files = fs.readdirSync(dir);

  for (let file of files) {
    const currName = path.join(dir, file);
    const info = fs.statSync(currName);
    if (info.isDirectory()) {
      if (file === '.git' || file === 'node_modules') {
        continue;
      }
      const result = lookForFiles(currName, fileName);
      if (result) {
        return result;
      }
    } else if (info.isFile() && file === fileName) {
      return currName;
    }
  }
}

function readFile (filename: string) {
  return fs.readFileSync(filename, { encoding: 'utf8' })
}

/**
 * 获得项目配置信息
 */
function getProjectConfig() {
  const rootDir = path.resolve(process.cwd(), `./`);
  const configFile = lookForFiles(rootDir, KIWI_CONFIG_FILE);
  let obj = PROJECT_CONFIG.defaultConfig;

  if (configFile && fs.existsSync(configFile)) {
    obj = _.merge(obj, JSON.parse(fs.readFileSync(configFile, 'utf8')));
  }
  return obj;
}

/**
 * 获取语言资源的根目录
 */
function getKiwiDir() {
  const config = getProjectConfig();

  if (config) {
    return config.kiwiDir;
  }
}

/**
 * 获取对应语言的目录位置
 * @param lang
 */
function getLangDir(lang) {
  const langsDir = getKiwiDir();
  return path.resolve(langsDir, lang);
}

/**
 * 深度优先遍历对象中的所有 string 属性，即文案
 */
function traverse(obj, cb) {
  function traverseInner(obj, cb, path) {
    _.forEach(obj, (val, key) => {
      if (typeof val === 'string') {
        cb(val, [...path, key].join('_'));
      } else if (typeof val === 'object' && val !== null) {
        traverseInner(val, cb, [...path, key]);
      }
    });
  }

  traverseInner(obj, cb, []);
}

/**
 * 获取所有文案
 */
function getAllMessages(lang: string, filter = (message: string, key: string) => true) {
  const srcLangDir = getLangDir(lang);
  // try {
  let files = dirs.files(srcLangDir, {
    sync: true,
    match: /\.(js|ts)$/
  })
  return getAllData(files, filter)
}

/**
 * 重试方法
 * @param asyncOperation
 * @param times
 */
function retry(asyncOperation, times = 1) {
  let runTimes = 1;
  const handleReject = e => {
    if (runTimes++ < times) {
      return asyncOperation().catch(handleReject);
    } else {
      throw e;
    }
  };
  return asyncOperation().catch(handleReject);
}

/**
 * 设置超时
 * @param promise
 * @param ms
 */
function withTimeout(promise, ms) {
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(`Promise timed out after ${ms} ms.`);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * 使用google翻译
 */
function translateText(text, toLang) {
  const CONFIG = getProjectConfig();
  const options = CONFIG.translateOptions || {};
  const googleTranslate = translate;

  return withTimeout(
    new Promise((resolve, reject) => {
      googleTranslate(text,
        {
          ...options,
          to: PROJECT_CONFIG.langMap[toLang]
        }).then(res => {
          let translatedText = res.data[0]
          if (Array.isArray(text)) {
            translatedText = parseMultiple(translatedText)
          }
          resolve(translatedText)
        }).catch(error => {
          console.error('translate error', error)
          reject(error)
        }
      );
    }),
    5000
  );
}

function findMatchKey(langObj, text) {
  for (const key in langObj) {
    if (langObj[key] === text) {
      return key;
    }
  }

  return null;
}

function findMatchValue(langObj, key) {
  return langObj[key];
}

/**
 * 将对象拍平
 * @param obj 原始对象
 * @param prefix
 */
function flatten(obj, prefix = '') {
  var propName = prefix ? prefix + '_' : '',
    ret = {};

  for (var attr in obj) {
    if (_.isArray(obj[attr])) {
      var len = obj[attr].length;
      ret[attr] = obj[attr].join(',');
    } else if (typeof obj[attr] === 'object') {
      _.extend(ret, flatten(obj[attr], propName + attr));
    } else {
      ret[propName + attr] = obj[attr];
    }
  }
  return ret;
}

// 指定内容替换成占位符
// 目的是去除已经匹配到的中文 
function replaceOccupyStr(str: string, regexp: RegExp, replacement?: string) {
  return str && str.replace(regexp, (...arg) => {
    return arg[0].split('').map(() => replacement || 'A').join('')
  })
}

// 将文件读取后转换问 js 对象
function transformToObject(filename: string, filter?: Function): object {
  const code = readFile(filename)
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
  const keysObject = {}
  function visit(node: ts.Node) {
    switch (node && node.kind) {
      case ts.SyntaxKind.PropertyAssignment: {
      /** 判断 Ts 中的字符串含有中文 */
        const {
          name,
          initializer
        }: { name; initializer } = node as ts.PropertyAssignment;
        if (filter(initializer.text, name.text)) {
          keysObject[name.text] = initializer.text
        }
        
        break;
      }
    }

    ts.forEachChild(node, visit);
  }
  ts.forEachChild(ast, visit);
  return keysObject 
}

function getAllData (files: Array<string>, filter = (...arg) => true) {
  if (!files) return {}
  return files.reduce((prev, curr) => {
    const dataObj = transformToObject(curr, filter)
    return {
      ...prev,
      ...dataObj
    }
  }, {})
}

export {
  getKiwiDir,
  getLangDir,
  traverse,
  retry,
  withTimeout,
  getAllMessages,
  getProjectConfig,
  translateText,
  findMatchKey,
  findMatchValue,
  flatten,
  lookForFiles,
  replaceOccupyStr,
  transformToObject,
  getAllData
};
