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

import * as _ from 'lodash';
const fs = require('fs-extra')
const xlsx = require('node-xlsx').default
import {
  getProjectConfig,
} from './utils';
import { readSheetData } from './excel-same'
import xlsx from 'node-xlsx'
import { Translate } from './translate'



// 列宽设置
const sheetOptions = { '!cols': [{ wch: 30 }, { wch: 50 }, { wch: 30 }] }

function createXlsxFile(filepath, sheetData) {
  const data = [...sheetData]
  const buffer = xlsx.build([{ data }], sheetOptions)
  fs.outputFileSync(filepath, buffer)
}


// 翻译 excel 内中文文案
// 读取excel 内中文
function readExcelInLanguage(filepath) {
  const langs = readSheetData(filepath)
  return langs
}


// 异步循环
async function asyncList(list, asyncFunction, asyncParams) {
  const newList = []
  for (let i = 0; i < list.length; i++) {
    try {
      const res = await asyncFunction(list[i], asyncParams)
      newList.push(res)
    } catch (e) {
      console.error(e)
      newList.push(list[i])
    }
  }
  return newList
}


async function translateFunction(data, config?) {
  const CONFIG = getProjectConfig();
  const translateText = await Translate(data[1], { ...CONFIG.translateOptions, ...config }, 5 * 1000)
  return [data[0], data[1], translateText]
}

async function translateExcelLanguage(filepath, to = 'en', from = 'auto') {
  const langList = readExcelInLanguage(filepath)
  const config = { to, from }
  const translateList = await asyncList(langList, translateFunction, config)
  createXlsxFile(filepath, translateList)
  return translateList
}

export { readExcelInLanguage, translateExcelLanguage };
