/**
 * @author doubledream
 * @desc 获取语言文件
 */

import * as globby from 'globby';
import * as fs from 'fs';
import * as path from 'path';
import { getProjectConfig, flatten } from '../utils';
import { readFile } from './file'
const CONFIG = getProjectConfig();
const LANG_DIR = path.resolve(CONFIG.kiwiDir, CONFIG.srcLang);

const I18N_GLOB = `${LANG_DIR}/**/*.{ts,js}`;

/**
 * 获取对应文件的语言
 */
function getLangData(fileName) {
  if (fs.existsSync(fileName)) {
    return getLangJson(fileName);
  } else {
    return {};
  }
}

/**
 * 获取文件 Json
 */
function getLangJson(fileName) {
  let fileContent = readFile(fileName);
  const langList = fileContent.match(/export\s*default\s*({[\s\S]+);?$/)
  if (!langList) return {}
  let obj = langList[1];
  obj = obj.replace(/\s*;\s*$/, '');
  let jsObj = {};
  try {
    jsObj = eval('(' + obj + ')');
  } catch (err) {
    console.error(err);
  }
  return jsObj;
}

function expandObject(obj) {
  const newObj = {}
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      newObj[key] = obj[key]
    } else {
      expandObject(obj[key])
    }
  })
  return newObj
}

function getI18N() {
  const paths = globby.sync(I18N_GLOB);
  const langObj = paths.reduce((prev, curr) => {
    const filename = curr
      .split('/')
      .pop()
      .replace(/\.(tsx?|vue|js)$/, '');
    
    if (filename.replace(/\.(tsx?|vue|js)/, '') === 'index') {
      return prev;
    }

    const fileContent = expandObject(getLangData(curr));
    let jsObj = fileContent;

    if (Object.keys(jsObj).length === 0) {
      console.log(`\`${curr}\` 解析失败，该文件包含的文案无法自动补全`);
    }

    return {
      ...prev,
      ...jsObj
    };
  }, {});
  return langObj;
}

/**
 * 获取全部语言, 展平
 */
function getSuggestLangObj() {
  const langObj = getI18N();
  const finalLangObj = flatten(langObj);
  return finalLangObj;
}

export { getSuggestLangObj, getLangData };
