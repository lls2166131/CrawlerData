"use strict"

// request 用于下载网页
// cheerio 用于解析网页数据
const request = require('request')
const cheerio = require('cheerio')

// 定义一个类来保存回答的信息
// 定义 3 个要保存的数据
// 分别是  作者 内容 链接
function Answer() {
    this.author = ''
    this.content = ''
    this.link = ''
    this.numberOfComments = 0
}

const log = function() {
    console.log.apply(console, arguments)
}

// 从一个回答 div 里面读取回答信息
const answerFromDiv = function(div) {
    const a = new Answer()
    // 使用 cheerio.load 函数来返回一个可以查询的特殊对象
    // 使用这个 options 才能使用 html() 函数来获取带回车的文本信息
    const options = {
        decodeEntities: false,
    }
    const e = cheerio.load(div, options)
    // .text() 获取文本信息
    a.author = e('.author-link-line > .author-link').text()
    // 如果用 text() 则会获取不到回车
    // 所以这里用的是html()
    a.content = e('.zm-editable-content').html()
    //
    a.link = 'https://zhihu.com' + e('.answer-date-link').attr('href')
    a.numberOfComments = e('.toggle-comment').text()
    // log('***  ', a.content)
    return a
}

//请求到html内容
const answersFromBody = function(body) {
    // cheerio.load 用字符串作为参数返回一个可以查询的特殊对象
    const options = {
        decodeEntities: false,
    }
    const e = cheerio.load(body, options)
    // 查询对象的查询语法和 DOM API 中的 querySelector 一样
    const divs = e('.zm-item-answer')

    const answers = []
    for(let i = 0; i < divs.length; i++) {
        let element = divs[i]
        // 获取 div 的元素并且用 movieFromDiv 解析
        // 加入 movies 数组中
        const div = e(element).html()
        const m = answerFromDiv(div)
        answers.push(m)
    }
    return answers
}


const writeToFile = function(path, data) {
    const fs = require('fs')
    fs.writeFile(path, data, function(error){
        if (error != null) {
            log('--- 写入成功', path)
        } else {
            log('*** 写入失败', path)
        }
    })
}


const cachedUrl = function(options, callback) {
    const fs = require('fs')
    // 先生成对应的文件
    const path = options.url.split('/').join('-').split(':').join('-')
    // 先尝试去硬盘中读取这个 url 对应的文件
    fs.readFile(path, function(err, data){
        if (err != null) {
            // 读取这个文件失败
            // 读不到的话说明是第一次请求，那么就使用 request
            request(options, function(error, response, body) {
                // 下载好了之后，保存到本地文件
                writeToFile(path, body)
                callback(error, response, body)
            })
        } else {
            log('读取到缓存的页面', path)
            // 读取到，直接读取硬盘上的文件
            const response = {
                statusCode: 200,
            }
            callback(null, response, data)
        }
    })
}


const __main = function() {
    // 主函数
    // 知乎答案
    const url = 'https://www.zhihu.com/question/31515263'
    // request 从一个 url 下载数据并调用回调函数
    // 根据 伪装登录爬虫设置图例 替换 cookie 和 useragent 中的内容
    // useragent 已经替换好
    const cookie =
    const useragent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
    const headers = {
        'Cookie': cookie,
        'User-Agent': useragent,
    }

    const options = {
        url: url,
        headers: headers,
    }
    cachedUrl(options, function(error, response, body){
        // 回调函数的三个参数分别是  错误, 响应, 响应数据
        // 检查请求是否成功, statusCode 200 是成功的代码
        if (error === null && response.statusCode == 200) {
            const answers = answersFromBody(body)

            // 引入自己写的模块文件
            // ./ 表示当前目录
            const utils = require('./utils')
            const path = 'zhihu.answers.txt'
            utils.saveJSON(path, answers)
        } else {
            log('*** ERROR 请求失败 ', error)
        }
    })
    // request(options, function(error, response, body) {
    //     // 回调函数的三个参数分别是  错误, 响应, 响应数据
    //     // 检查请求是否成功, statusCode 200 是成功的代码
    //     if (error === null && response.statusCode == 200) {
    //         const answers = answersFromBody(body)
    //
    //         // 引入自己写的模块文件
    //         // ./ 表示当前目录
    //         const utils = require('./utils')
    //         const path = 'zhihu.answers.txt'
    //         utils.saveJSON(path, answers)
    //     } else {
    //         log('*** ERROR 请求失败 ', error)
    //     }
    // })
}

__main()
