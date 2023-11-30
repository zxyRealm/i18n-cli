const fs = require('fs-extra')
const xlsx = require('node-xlsx').default

// 列宽设置
const sheetOptions = { '!cols': [{ wch: 30 }, { wch: 50 }, { wch: 30 }] }

// 读取 sheet 表中所有 key 值，默认第一列为 key
function readSheetData(filename, index = 0) {
  if (!filename) return []
  const sheets = xlsx.parse(filename)
  const keysList = []
  sheets.forEach(sheet => {
    const { data } = sheet
    data.forEach(row => {
      keysList.push(row[index])
    })
  })
  return keysList
}

// 导出文件 key 值 对比
function compareExcel(originFile: string, targetFile: string) {
  const originData = readSheetData(originFile)
  const targetData = readSheetData(targetFile)
  // 对比后数据结果
  const data = [
    [`${originFile} key`, `${targetFile} key`],
    [`${originData.length}`, `${targetData.length}`]
  ]
  originData.forEach(key => {
    if (!targetData.includes(key)) {
      data.push([key, null])
    }
  })
  targetData.forEach(key => {
    if (!originData.includes(key)) {
      data.push([null, key])
    }
  })
  const buffer = xlsx.build([{ data }], sheetOptions)
  const filePath = `./excel-compare.xlsx`
  fs.outputFileSync(filePath, buffer)
}

export { compareExcel }
