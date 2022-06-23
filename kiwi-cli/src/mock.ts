/**
 * @author linhuiw
 * @desc 翻译方法
 * @TODO: index 文件需要添加 mock
 */
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs'
  }
});

import * as path from 'path';
// import * as fs from 'fs';
import * as _ from 'lodash';
const fs = require('fs-extra')
const xlsx = require('node-xlsx').default
import {
  getProjectConfig,
} from './utils';
const CONFIG = getProjectConfig();
import { readSheetData } from './excel-same'
import xlsx from 'node-xlsx'
import { Translate } from './translate'

/**
 * 获取中文文案
 */
// function getSourceText() {
//   const srcLangDir = getLangDir(CONFIG.srcLang);
//   const srcFile = path.resolve(srcLangDir, 'index.ts');
//   const { default: texts } = require(srcFile);

//   return texts;
// }
// /**
//  * 获取对应语言文案
//  * @param dstLang
//  */
// function getDistText(dstLang) {
//   const distLangDir = getLangDir(dstLang);
//   const distFile = path.resolve(distLangDir, 'index.ts');
//   let distTexts = {};
//   if (fs.existsSync(distFile)) {
//     distTexts = require(distFile).default;
//   }

//   return distTexts;
// }
// /**
//  * Mock 对应语言
//  * @param dstLang
//  */
// async function mockCurrentLang(dstLang) {
//   const texts = getSourceText();
//   const distTexts = getDistText(dstLang);
//   const untranslatedTexts = {};
//   const mocks = {};
//   /** 遍历文案 */
//   traverse(texts, (text, path) => {
//     const distText = _.get(distTexts, path);
//     if (text === distText) {
//       untranslatedTexts[path] = text;
//     }
//   });
//   /** 调用 Google 翻译 */
//   const translateAllTexts = Object.keys(untranslatedTexts).map(key => {
//     return translateText(untranslatedTexts[key], dstLang).then(translatedText => [key, translatedText]);
//   });
//   /** 获取 Mocks 文案 */
//   // TODO: translatedText 方法待优化
//   await Promise.all(translateAllTexts).then(res => {
//     res.forEach(([key, translatedText]) => {
//       // mocks[key] = translatedText;
//     });
//     return mocks;
//   });
//   return writeMockFile(dstLang, mocks);
// }
// /**
//  * 写入 Mock 文件
//  * @param dstLang
//  * @param mocks
//  */
// function writeMockFile(dstLang, mocks) {
//   const fileContent = 'export default ' + JSON.stringify(mocks, null, 2);
//   const filePath = path.resolve(getLangDir(dstLang), 'mock.ts');
//   return new Promise((resolve, reject) => {
//     fs.writeFile(filePath, fileContent, err => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(true);
//       }
//     });
//   });
// }
// /**
//  * Mock 语言的未翻译的文案
//  * @param lang
//  */
// async function mockLangs(lang?: string) {
//   const CONFIG = getProjectConfig();
//   const langs = lang ? [lang] : CONFIG.distLangs;
//   const mockPromise = langs.map(lang => {
//     return mockCurrentLang(lang);
//   });
//   return Promise.all(mockPromise);
// }

// 列宽设置
const sheetOptions = { '!cols': [{ wch: 30 }, { wch: 50 }, { wch: 30 }] }

function createXlsxFile (filepath, sheetData) {
  const data = [...sheetData]
  const buffer = xlsx.build([{ data }], sheetOptions)
  fs.outputFileSync(filepath, buffer)
}


// 翻译 excel 内中文文案
// 读取excel 内中文
function readExcelInLanguage (filepath) {
  const langs = readSheetData(filepath)
  return langs
}


// 异步循环
async function asyncList (list, asyncFunction, asyncParams)  {
  const newList = []
  for (let i = 0; i < list.length; i++) {
    try {
      const res = await asyncFunction(list[i], asyncParams)
      newList.push(res)
    } catch(e) {
      console.error(e)
      newList.push(list[i])
    }
  }
  return newList
}


async function translateFunction (data, config?) {
  const CONFIG = getProjectConfig();
  const translateText = await Translate(data[1], { ...CONFIG.translateOptions, ...config }, 5 * 1000)
  return [data[0], data[1], translateText]
}

async function translateExcelLanguage (filepath, to = 'en', from = 'auto') {
  const langList = readExcelInLanguage(filepath)
  const config = { to, from }
  const translateList = await asyncList(langList, translateFunction, config)
  createXlsxFile(filepath, translateList)
  return translateList
}

export { readExcelInLanguage, translateExcelLanguage };
