/**
 * @author linhuiw
 * @desc 利用 Ast 查找对应文件中的中文文案
 */
import * as ts from 'typescript';
import * as vscode from 'vscode';
import * as compiler from '@angular/compiler';
import { DOUBLE_BYTE_REGEX } from './const';
import { trimWhiteSpace } from './parserUtils';
import { removeFileComment } from './astUtils';
import { transerI18n,findVueText } from './babelUtil';
import * as compilerVue from 'vue-template-compiler';
/**
 * 查找 Ts 文件中的中文
 * @param code
 */

function findTextInTs(code: string, fileName: string) {
  const matches = [];
  const activeEditor = vscode.window.activeTextEditor;
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);

  function visit(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral: {
        /** 判断 Ts 中的字符串含有中文 */
        const { text } = node as ts.StringLiteral;
        if (text.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          /** 加一，减一的原因是，去除引号 */
          const startPos = activeEditor.document.positionAt(start + 1);
          const endPos = activeEditor.document.positionAt(end - 1);
          const range = new vscode.Range(startPos, endPos);
          matches.push({
            range,
            text,
            isString: true
          });
        }
        break;
      }
      case ts.SyntaxKind.JsxElement: {
        const { children } = node as ts.JsxElement;

        children.forEach(child => {
          if (child.kind === ts.SyntaxKind.JsxText) {
            const text = child.getText();
            /** 修复注释含有中文的情况，Angular 文件错误的 Ast 情况 */
            const noCommentText = removeFileComment(text, fileName);

            if (noCommentText.match(DOUBLE_BYTE_REGEX)) {
              const start = child.getStart();
              const end = child.getEnd();
              const startPos = activeEditor.document.positionAt(start);
              const endPos = activeEditor.document.positionAt(end);
              const { trimStart, trimEnd } = trimWhiteSpace(code, startPos, endPos);
              const range = new vscode.Range(trimStart, trimEnd);

              matches.push({
                range,
                text: text.trim(),
                isString: false
              });
            }
          }
        });
        break;
      }
      case ts.SyntaxKind.TemplateExpression: {
        const { pos, end } = node;
        let templateContent = code.slice(pos, end);
        templateContent = templateContent.toString().replace(/\$\{[^\}]+\}/, '')
        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          /** 加一，减一的原因是，去除`号 */
          const startPos = activeEditor.document.positionAt(start + 1);
          const endPos = activeEditor.document.positionAt(end - 1);
          const range = new vscode.Range(startPos, endPos);
          matches.push({
            range,
            text: code.slice(start + 1, end - 1),
            isString: true
          });
        }
        break;
      }
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        const { pos, end } = node;
        let templateContent = code.slice(pos, end);
        templateContent = templateContent.toString().replace(/\$\{[^\}]+\}/, '')
        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          /** 加一，减一的原因是，去除`号 */
          const startPos = activeEditor.document.positionAt(start + 1);
          const endPos = activeEditor.document.positionAt(end - 1);
          const range = new vscode.Range(startPos, endPos);
          matches.push({
            range,
            text: code.slice(start + 1, end - 1),
            isString: true
          });
        }
    }

    ts.forEachChild(node, visit);
  }
  ts.forEachChild(ast, visit);

  return matches;
}
function findTextInVueTs(code: string, fileName: string, startNum: number) {
  const matches = [];
  const activeEditor = vscode.window.activeTextEditor;
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);

  function visit(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral: {
        /** 判断 Ts 中的字符串含有中文 */
        const { text } = node as ts.StringLiteral;
        if (text.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          /** 加一，减一的原因是，去除引号 */
          const startPos = activeEditor.document.positionAt(start + 1 + startNum);
          const endPos = activeEditor.document.positionAt(end - 1 + startNum);
          const range = new vscode.Range(startPos, endPos);
          matches.push({
            range,
            text,
            isString: true
          });
        }
        break;
      }
      case ts.SyntaxKind.TemplateExpression: {
        const { pos, end } = node;
        let templateContent = code.slice(pos, end);
        templateContent = templateContent.toString().replace(/\$\{[^\}]+\}/, '')
        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart();
          const end = node.getEnd();
          /** 加一，减一的原因是，去除`号 */
          const startPos = activeEditor.document.positionAt(start + 1 + startNum);
          const endPos = activeEditor.document.positionAt(end - 1 + startNum);
          const range = new vscode.Range(startPos, endPos);
          matches.push({
            range,
            text: code.slice(start + 1, end - 1),
            isString: true
          });
        }
        break;
      }
    }

    ts.forEachChild(node, visit);
  }
  ts.forEachChild(ast, visit);

  return matches;
}
/**
 * 查找 HTML 文件中的中文
 * @param code
 */
function findTextInHtml(code) {
  const matches = [];
  const activeEditor = vscode.window.activeTextEditor;
  const ast = compiler.parseTemplate(code, 'ast.html', {
    preserveWhitespaces: false
  });
  function visit(node) {
    const value = node.value;
    if (value && typeof value === 'string' && value.match(DOUBLE_BYTE_REGEX)) {
      const valueSpan = node.valueSpan || node.sourceSpan;
      let {
        start: { offset: startOffset },
        end: { offset: endOffset }
      } = valueSpan;
      const nodeValue = code.slice(startOffset, endOffset);
      let startPos, endPos;
      let isString = false;
      /** 处理带引号的情况 */
      if (nodeValue.charAt(0) === '"' || nodeValue.charAt(0) === "'") {
        startPos = activeEditor.document.positionAt(startOffset + 1);
        endPos = activeEditor.document.positionAt(endOffset - 1);
        isString = true;
      } else {
        startPos = activeEditor.document.positionAt(startOffset);
        endPos = activeEditor.document.positionAt(endOffset);
      }
      const { trimStart, trimEnd } = trimWhiteSpace(code, startPos, endPos);
      const range = new vscode.Range(trimStart, trimEnd);
      matches.push({
        range,
        text: value,
        isString
      });
    } else if (value && typeof value === 'object' && value.source && value.source.match(DOUBLE_BYTE_REGEX)) {
      /**
       * <span>{{expression}}中文</span> 这种情况的兼容
       */
      const chineseMatches = value.source.match(DOUBLE_BYTE_REGEX);
      chineseMatches.map(match => {
        const valueSpan = node.valueSpan || node.sourceSpan;
        let {
          start: { offset: startOffset },
          end: { offset: endOffset }
        } = valueSpan;
        const nodeValue = code.slice(startOffset, endOffset);
        const start = nodeValue.indexOf(match);
        const end = start + match.length;
        let startPos = activeEditor.document.positionAt(startOffset + start);
        let endPos = activeEditor.document.positionAt(startOffset + end);
        const { trimStart, trimEnd } = trimWhiteSpace(code, startPos, endPos);
        const range = new vscode.Range(trimStart, trimEnd);
        matches.push({
          range,
          text: match[0],
          isString: false
        });
      });
    }

    if (node.children && node.children.length) {
      node.children.forEach(visit);
    }
    if (node.attributes && node.attributes.length) {
      node.attributes.forEach(visit);
    }
  }

  if (ast.nodes && ast.nodes.length) {
    ast.nodes.forEach(visit);
  }
  return matches;
}

/**
 * vue文件查找
 * @param code
 * @param fileName
 * @question $符敏感
 */
function findTextInVue(code, fileName) {
  let rexspace1 = new RegExp(/&ensp;/, 'g')
  let rexspace2 = new RegExp(/&emsp;/, 'g')
  let rexspace3 = new RegExp(/&nbsp;/, 'g')
  code = code.replace(rexspace1,'ccsp&;').replace(rexspace2,'ecsp&;').replace(rexspace3,'ncsp&;')
  let coverRex1 = new RegExp(/ccsp&;/, 'g')
  let coverRex2 = new RegExp(/ecsp&;/, 'g')
  let coverRex3 = new RegExp(/ncsp&;/, 'g')
  const activeTextEditor = vscode.window.activeTextEditor;
  const matches = [];
  var result;
  const { document } = activeTextEditor;
  const vueObejct = compilerVue.compile(code.toString(),{outputSourceRange: true});
  let vueAst = vueObejct.ast
  // 查询模板字符串中文案，替换并翻译
  let expressTemp = findVueText(vueAst)
  expressTemp.forEach(item=>{
    const nodeValue = code.slice(item.start, item.end);
    let startPos = document.positionAt(item.start+nodeValue.indexOf(item.text)+1);
    let endPos = document.positionAt(item.start+nodeValue.indexOf(item.text)+(item.text.length-1));
    const range = new vscode.Range(startPos, endPos);
        matches.push({
          arrf: [item.start, item.end],
          range,
          text: item.text.trimRight(),
          isString: true
        });     
  })
  // 处理 js 文件中文案并翻译
  let outcode = vueObejct.render.toString().replace('with(this)', 'function a()');
  let vueTemp = transerI18n(outcode, 'as.vue', null);
  /**删除所有的html中的头部空格 */
  vueTemp = vueTemp.map(item => {
    return item.trim();
  });
  vueTemp = [...new Set(vueTemp)];
  vueTemp.forEach(item => {
    let items = item.replace(/\{/g,'\\{').replace(/\}/g,'\\}').replace(/\$/g,'\\$').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\+/g,'\\+').replace(/\*/g,'\\*').replace(/\^/g,'\\^')
    let rex = new RegExp(items, 'g');
    while ((result = rex.exec(code))) {
      let res = result;
      let last = rex.lastIndex;
      last = last - (res[0].length - res[0].trimRight().length);
      const range = new vscode.Range(document.positionAt(res.index), document.positionAt(last));
      matches.push({
        arrf: [res.index, last],
        range,
        text: res[0].trimRight().replace(coverRex1,'&ensp;').replace(coverRex2,'&emsp;').replace(coverRex3,'&nbsp;'),
        isString:
          (code.substr(res.index - 1, 1) === '"' && code.substr(last, 1) === '"') ||
          (code.substr(res.index - 1, 1) === "'" && code.substr(last, 1) === "'")
            ? true
            : false
      });
    }
  });
  let matchesTemp = matches;
  let matchesTempResult = matchesTemp.filter((item, index) => {
    let canBe = true;
    matchesTemp.forEach(items => {
      if (
        (item.arrf[0] > items.arrf[0] && item.arrf[1] <= items.arrf[1]) ||
        (item.arrf[0] >= items.arrf[0] && item.arrf[1] < items.arrf[1]) ||
        (item.arrf[0] > items.arrf[0] && item.arrf[1] < items.arrf[1])
      ) {
        canBe = false;
      }
    });
    if (canBe) return item;
  });
  // vue-template-complier 只是针对 Vue 文件中 template 部分进行转换
  // js 部分需要单独进行处理，此处是将源码还原成单文件组件，提取 script 中内容进行处理
  const sfc = compilerVue.parseComponent(code.toString());
  return matchesTempResult.concat(findTextInVueTs(sfc.script.content, fileName, sfc.script.start));
}
/**
 * 递归匹配代码的中文
 * @param code
 */
export function findChineseText(code: string, fileName: string) {
  if (fileName.endsWith('.html')) {
    return findTextInHtml(code);
  }
  if (fileName.endsWith('.vue')) {
    return findTextInVue(code, fileName);
  }
  return findTextInTs(code, fileName);
}
