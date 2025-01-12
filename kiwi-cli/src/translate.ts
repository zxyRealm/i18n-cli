import * as md5 from 'js-md5'
import * as qs from 'qs'
const request = require('request')
// import { getRandomStr, encodeUtf8 } from './utils'
// Thanks libretranslate.com free translate service
// api address: https://libretranslate.com/docs/

interface LdResultType {
  srcLangs: string[];
  srclangs_confidences: number[];
  extended_srclangs: string[]
}
interface SentencesType {
  trans: string;
  orig: string;
  backend: number;
}
export interface TranslateResponseType {
  sentences: SentencesType[];
  src: string;
  confidence: number;
  spell: object;
  ld_result: LdResultType;
}

export interface Options {
  q?: string;
  to?: string;
  from?: string;
  secretKey: string;
  appid: string;
  [key: string]: any;
}

// 获取随机盐值
function getRandomStr(length: number = 4): string {
  let result = Math.floor(Math.random() * 90 + 10).toString()
  for (let i = 0; i < length - 2; i++) {
    let ranNum = Math.ceil(Math.random() * 25)
    result += String.fromCharCode(65 + ranNum).toString()
  }
  return result
}

// 添加队列处理类
class TranslationQueue {
  private queue: Array<{
    text: string;
    options: Options;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  private isProcessing = false;
  private delay: number;

  constructor(delay: number = 1000) {
    this.delay = delay;
  }

  async add(text: string, options: Options): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ text, options, resolve, reject });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { text, options, resolve, reject } = this.queue.shift()!;

    try {
      const { appid, secretKey } = options;
      const salt = getRandomStr(8);
      const signStr = appid + text + salt + secretKey;
      const sign = md5(signStr);
      const params = {
        q: text,
        engine: 'libre',
        from: 'auto',
        to: 'en',
        appid,
        salt,
        sign,
        ...options
      };

      request({
        url: `http://api.fanyi.baidu.com/api/trans/vip/translate?${qs.stringify(params)}`,
        method: 'get',
        headers: {
          'Content-Type': 'application/json'
        }
      }, async (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          try {
            const result = JSON.parse(body);
            if (result.error_code) {
              reject(result);
            } else {
              resolve(result.trans_result[0].dst);
            }
          } catch (error) {
            reject(error);
            console.error(error);
          }
        }

        // 处理延时后继续处理队列
        await new Promise(resolve => setTimeout(resolve, this.delay));
        this.processQueue();
      });
    } catch (error) {
      reject(error);
      this.processQueue();
    }
  }
}

// 创建翻译队列实例
const translationQueue = new TranslationQueue();

// 修改后的 Translate 函数
export function Translate(text: string, options?: Options, delay: number = 1000) {
  return translationQueue.add(text, options || { appid: '', secretKey: '' });
}
