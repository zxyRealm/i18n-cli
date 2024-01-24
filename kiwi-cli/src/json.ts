import { findTextInTs } from './extract/findChineseText';
import { getProjectConfig, getProjectVersion, readSheetData, prettierFile, getFileFormat } from './utils'
import { getSpecifiedFiles, readFile, writeFile } from './extract/file';
import { createXlsxFile } from './export'
import * as _ from 'lodash';
import * as fs from 'fs'
import { tsvFormatRows } from 'd3-dsv';
const chalk = require('chalk')
const log = console.log;

// 导出中文 excel
function exportTextsExcel(allTexts) {
  // 构建 excel 数据结构
  const sheetData = []
  const keyMap = {}
  let total = 0
  allTexts.length && allTexts.forEach((file) => {
    total += file?.texts?.length || 0
    file.texts && file.texts.forEach((texts) => {
      if (!keyMap[texts.text]) {
        sheetData.push([null, texts.text])
        keyMap[texts.text] = 1
      } else {
        keyMap[texts.text]++
      }
    })
  })
  const content = tsvFormatRows(sheetData)
  if (sheetData.length > 1) {
    createXlsxFile(`export-json_${getProjectVersion() || ''}`, sheetData)
    fs.writeFileSync(`export-json.txt`, content);
    log(chalk.green(`excel 导出成功, 总计 ${total} 条，去重后${sheetData.length} 条`))
  } else {
    log(chalk.yellow(`未检测到中文文本`))
  }
}

// 根据中文 json 文件，生成指定语言的其他语言文件
function updateOtherLangFile(allTexts, dir: string, excelFilePath: string, lang: string): void {
  // 读取语言 excel 生成 以中文为 key 的 map 对象
  const sheetData = readSheetData(excelFilePath);

  const dirList = dir.split('/')
  const newDir = dirList.slice(0, dirList.length - 1).join('/')

  const prePath = dir.replace(/(.*)\/$/, '$1')
  allTexts.forEach((file) => {
    // 更新语言文件的文件名
    const newFileName = `${newDir}/${lang}${file.path.replace(prePath, '')}`
    let code = JSON.parse(file.code)

    updateWithTranslation(code, sheetData)

    writeFile(newFileName, prettierFile(JSON.stringify(code), getFileFormat(newFileName)))
  })
}


// 处理字符串
function processString(str, dictionary) {
  // 使用正则表达式匹配所有的中文字符
  let reg = /'([^']*)'/g;
  if (dictionary[str]) return dictionary[str]
  // 找到所有的中文字符串并使用词典替换
  const stringList = str?.match(reg)?.map(v => v.slice(1, -1)) || []

  stringList.forEach(v => {
    dictionary?.[v] ? str = str.replace(v, dictionary[v]) : null
  })

  return str;
}

// 更新函数
function updateWithTranslation(obj, dictionary) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = processString(obj[key], dictionary)
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      updateWithTranslation(obj[key], dictionary);
    }
  }
}


// 扫描 json 文件中的中文文案
function ExtractJsonInText(dir: string, excelFilePath?: string, lang?: string) {
  const CONFIG = getProjectConfig();
  const files = getSpecifiedFiles(dir, CONFIG.include);
  const filterFiles = files.filter(file => {
    return file.endsWith('.json');
  });
  // 目录下所有中文文案
  const allTexts = filterFiles.reduce((pre, file) => {
    const code = readFile(file);
    const texts = findTextInTs(code, file, true);
    // 调整文案顺序，保证从后面的文案往前替换，避免位置更新导致替换出错
    const sortTexts = _.sortBy(texts, obj => -obj.range.start);

    if (texts.length > 0) {
      log(chalk.green(`${file} 发现中文文案 ${texts.length} 条`));
    }
    return texts.length > 0 ? pre.concat({ file, texts: sortTexts }) : pre;
  }, []);

  const allFiles = filterFiles.reduce((pre, file) => {
    const code = readFile(file)
    return [...pre, {
      path: file,
      code
    }]
  }, [])

  console.log('json file dir', dir)

  if (!allTexts.length) {
    return log(chalk.yellow(`未发现中文文案`))
  }
  // 将中文导出到 excel
  !excelFilePath && exportTextsExcel(allTexts)
  // 扁平化后的数组列表
  if (excelFilePath && fs.existsSync(excelFilePath) && CONFIG.distLangs.includes(lang)) {
    updateOtherLangFile(allFiles, dir, excelFilePath, lang)
  }

  if (excelFilePath && !fs.existsSync(excelFilePath)) {
    log(chalk.red(`${excelFilePath} 文件不存在`))
  }

  if (excelFilePath && fs.existsSync(excelFilePath)) {
    if (!lang) {
      log(chalk.red(`语言类型不存在`))
    } else if (!CONFIG.distLangs.includes(lang)) {
      log(chalk.red(`不存在的语言类型 ${lang}`))
    }
  }
}

export default ExtractJsonInText;