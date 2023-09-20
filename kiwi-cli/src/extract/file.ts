/**
 * @author doubledream
 * @desc 文件处理方法
 */

import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as slash from 'slash2';
/*
 * 获取文件夹下符合要求的所有文件
 * @function getSpecifiedFiles
 * @param  {string} dir 路径
 * @param {ignoreDirectory} 忽略文件夹 {ignoreFile} 忽略的文件
 */
// declare 
function getSpecifiedFiles(dir, includeOption?, excludeOption?): string[] {
  const files = readFiles(dir)
  return files
    .map(f => slash(f))
    .filter(file => {
      // 处理文件过滤规则
      const validateRule = (rule, str) => {
        // 当 rule 为 string 并且不是一个文件时，将其转换为一个正则表达式
        const isFile = rule.split && rule.split('/')[rule.split('/').length - 1].includes('.')
        const reg = typeof rule === 'string' && new RegExp(`${rule.replace(/\/$/, '')}${!isFile ? '(?=\/)' : ''}`)
        const stringRule = typeof rule === 'string' && reg.test(str)
        const regRule = rule.test && rule.test(str)
        return stringRule || regRule
      }
      // 包含文件或目录
      const include = () => {
        let isValidate = false
        if (Array.isArray(includeOption)) {
          includeOption.forEach(item => {
            const valid = validateRule(item, file)
            if (valid) isValidate = true
          })
        } else if (typeof includeOption === 'string') {
          const valid = validateRule(includeOption, file)
          if (valid) isValidate = true
        }
        return isValidate
      }
      // 要忽略的文件或目录
      const exclude = () => {
        let isIgnore = false
        if (Array.isArray(excludeOption)) {
          excludeOption.forEach(item => {
            const valid = validateRule(item, file)
            if (valid) isIgnore = true
          })
        } else if (typeof excludeOption === 'string') {
          const valid = validateRule(excludeOption, file)
          if (valid) isIgnore = true
        }
        return isIgnore
      }
      return include() && !exclude()
    })
}

function readFiles(dir, match?) {
  const fileList = []
  const readFile = (directory) => {
    try {
      const files = fs.readdirSync(directory);
      files.forEach((item) => {
        var fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          readFile(path.join(directory, item));  //递归读取文件
        } else if ((match && match.test && match.test(fullPath)) || !match) {
          fileList.push(fullPath)
        }
      });
    } catch (error) {
      console.error(error)
    }
  }
  readFile(dir)
  return fileList
}

// 获取符合过滤条件的所有文件
// function 

/*
 * 读取文件
 * @param fileName
 */
function readFile(fileName) {
  if (fs.existsSync(fileName)) {
    return fs.readFileSync(fileName, {
      encoding: 'utf8'
    });
  }
}

/**
 * 写入文件
 * @param filePath 文件路径
 */
function writeFile(filePath, file) {
  if (file) {
    fs.outputFileSync(filePath, file);
  }
}

export { getSpecifiedFiles, readFile, readFiles, writeFile };
