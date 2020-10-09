#!/usr/bin/env node

const axios = require('axios')
const fs = require('fs-extra')
const path = require('path')
const style = require('chalk')
const { readFileContent } = require('./fileUtil.js')
// const { resolve } = require('path')

const info = style.cyan.bold
const success = style.green.bold
const warning = style.yellow.bold
const error = style.red.bold
// const tip = style.gray

const remoteThorRepoBaseUrl = 'http://172.16.3.100:8901/angle-fe/thor/-/raw/master/'

let isThorProject = true // 是否是Thor生成的工程

const currentPath = path.resolve('./')
let pathInfo = path.parse(currentPath)

// const updateBiz = () => {
//   // 更新
//   Promise.all([updateService('utils', '所需支持'), updateService('views', '可配置化业务支持')]).then(() => {
//     // 全部完成
//     console.log(success(`可配置化业务已全部更新完成！`))
//   }).catch(err => {
//     console.error(error(err))
//   })
// }

// const updateService = (service, serviceName) => new Promise((resolve, reject) => {
//   fs.copy(`node_modules/thor-bizpage-update/assets/${service}/`, `src/${service}/`).then(() => {
//     console.log(success(`${serviceName}已更新`))
//     resolve()
//   }).catch((err) => {
//     console.error(error(err))
//     reject(err)
//   })
// })

// const addFeature = () => {
//   // 新添加
//   Promise.all([addService('models/', '配置文件'), addService('utils/', '所需utils支持'), addService('components/', '所需组件', { overwrite: false }), addService('EventBus.js', '事件主线', { overwrite: false }), addService('views/', '可配置化业务')]).then(() => {
//     // 全部完成
//     console.log(success(`可配置化业务服务已全部添加完成！`))
//     console.log(`配置文件路径：${info('src/models/SystemConfig.js')}`)
//     console.warn(warning(`请注意：由于存量工程背景情况不一，你需要自行配置一些其他内容`))
//     console.log(`详情参考链接 ${info('http://172.16.3.100:8901/angle-fe/thor/-/blob/master/docs/%E5%AD%98%E9%87%8F%E5%B7%A5%E7%A8%8B%E6%B7%BB%E5%8A%A0%E5%8F%AF%E9%85%8D%E7%BD%AE%E5%8C%96%E5%85%AC%E5%85%B1%E4%B8%9A%E5%8A%A1%E6%9C%8D%E5%8A%A1%E9%A1%BB%E7%9F%A5.md')}`)
//   }).catch(err => {
//     console.error(error(err))
//   })
// }

// const addService = (service, serviceName, options = {}) => new Promise((resolve, reject) => {
//   if (service[service.length - 1] === '/') {
//     // 文件夹添加
//     fs.ensureDir(`src/${service}`).then(() => {
//       // 确保有文件夹
//       return fs.copy(`node_modules/thor-bizpage-update/assets/${service}`, `src/${service}`, options)
//     }).then(() => {
//       // 拷贝成功
//       console.log(success(`${serviceName}已添加`))
//       resolve()
//     }).catch(err => {
//       console.error(error(err))
//       reject(err)
//     })
//   } else {
//     // 文件添加
//     fs.ensureFile(`src/${service}`).then(() => {
//       // 确保有路径及文件
//       return fs.copy(`node_modules/thor-bizpage-update/assets/${service}`, `src/${service}`)
//     }).then(() => {
//       // 拷贝成功
//       console.log(success(`${serviceName}已添加`))
//       resolve()
//     }).catch(err => {
//       console.error(error(err))
//       reject(err)
//     })
//   }
// })

const proceed = () => {
  console.log(`当前工程：${info(pathInfo.name)}  状态：${isThorProject ? info('Thor工程') : warning('非Thor历史工程')}  路径：${info(currentPath)}`)
  if (isThorProject) {
    // thor工程，只更新可配置化业务文件
    proceedUpdate()
  } else {
    // 老工程，需要添加配置文件+可配置化业务文件
    console.log(`开始为工程 ${info(pathInfo.name)} 添加可配置化业务支持`)
    proceedAdd()
  }
}

const proceedUpdate = () => {
  // 检查版本号
  console.log('检查版本...')
  fs.access('.thorconfig.json').then(() => {
    checkVersion()
  }).catch(() => {
    let content = JSON.stringify({
      bizpageVersion: '0.0.0'
    })
    fs.writeFileSync('.thorconfig.json', content, {
      encoding: 'utf-8'
    })
    checkVersion()
  })
}

const proceedAdd = () => {
  let content = JSON.stringify({
    bizpageVersion: '0.0.0'
  })
  fs.writeFileSync('.thorconfig.json', content, {
    encoding: 'utf-8'
  })
  checkVersion(true)
}

const checkVersion = (addNew = false) => {
  let localVersion = JSON.parse(readFileContent('.thorconfig.json')).bizpageVersion
  let remoteVersion
  axios.get(remoteThorRepoBaseUrl + 'package.json').then(data => {
    // console.log(data.data)
    if (data && data.status === 200) {
      // console.log(info('获得远程应答'))
      // console.log(data.data)
      const result = data.data
      remoteVersion = result.version
      if (remoteVersion !== localVersion) {
        // 有新版本
        addNew ? handleAdd({ remoteVersion }) : handleUpdate({ localVersion, remoteVersion })
      } else {
        // 同版本
        console.log(`当前版本已最新 (${info(localVersion)})`)
      }
    }
  }).catch(err => {
    console.log(error(err))
  })
}

const handleAdd = ({ remoteVersion }) => {
  console.log(`最新版本 ${info(remoteVersion)}`)
  console.log(`开始更新工程 ${info(pathInfo.name)} 的可配置化业务`)
  Promise.all([axios.get(remoteThorRepoBaseUrl + 'template/pc/src/EventBus.js'), axios.get(remoteThorRepoBaseUrl + 'template/pc/src/models/SystemConfig.js'), axios.get(remoteThorRepoBaseUrl + 'template/pc/src/components/PopoverTooltip.vue'), axios.get(remoteThorRepoBaseUrl + 'template/pc/src/utils/CommonBizUtil.js'), axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/CommonBizList.vue'), axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/CommonBizEdit.vue')]).then(datas => {
    if (datas.some(item => !item || item.status !== 200)) {
      throw new Error('获取远程文件内容发生错误！')
    }
    let [eventBusData, systemConfigData, popoverTooltipVueData, utilData, listVueData, editVueData] = datas
    eventBusData = eventBusData.data
    systemConfigData = systemConfigData.data
    popoverTooltipVueData = popoverTooltipVueData.data
    utilData = utilData.data
    listVueData = listVueData.data
    editVueData = editVueData.data
    try {
      fs.accessSync('src/EventBus.js')
    } catch (err) {
      fs.outputFileSync('src/EventBus.js', eventBusData)
    }
    try {
      fs.accessSync('src/models/SystemConfig.js')
    } catch (err) {
      fs.outputFileSync('src/models/SystemConfig.js', systemConfigData)
    }
    try {
      fs.accessSync('src/components/PopoverTooltip.vue')
    } catch (err) {
      fs.outputFileSync('src/components/PopoverTooltip.vue', popoverTooltipVueData)
    }
    fs.outputFileSync('src/utils/CommonBizUtil.js', utilData)
    fs.outputFileSync('src/views/CommonBizList.vue', listVueData)
    fs.outputFileSync('src/views/CommonBizEdit.vue', editVueData)
    // 更新本地版本号
    let thorConfigContent = JSON.parse(readFileContent('.thorconfig.json'))
    thorConfigContent.bizpageVersion = remoteVersion
    fs.outputFileSync('.thorconfig.json', JSON.stringify(thorConfigContent))
    console.log(success(`可配置化业务服务已全部添加完成！`))
    console.log(`配置文件路径：${info('src/models/SystemConfig.js')}`)
    console.warn(warning(`请注意：由于存量工程背景情况不一，你需要自行配置一些其他内容`))
    console.log(`详情参考链接 ${info('http://172.16.3.100:8901/angle-fe/thor/-/blob/master/docs/%E5%AD%98%E9%87%8F%E5%B7%A5%E7%A8%8B%E6%B7%BB%E5%8A%A0%E5%8F%AF%E9%85%8D%E7%BD%AE%E5%8C%96%E5%85%AC%E5%85%B1%E4%B8%9A%E5%8A%A1%E6%9C%8D%E5%8A%A1%E9%A1%BB%E7%9F%A5.md')}`)
  }).catch(err => {
    console.log(error(err))
  })
}

const handleUpdate = ({ localVersion, remoteVersion }) => {
  console.log(`检测到新版本 ${warning(localVersion)} => ${info(remoteVersion)}`)
  console.log(`开始更新工程 ${info(pathInfo.name)} 的可配置化业务`)
  Promise.all([axios.get(remoteThorRepoBaseUrl + 'template/pc/src/utils/CommonBizUtil.js'), axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/CommonBizList.vue'), axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/CommonBizEdit.vue')]).then(datas => {
    if (datas.some(item => !item || item.status !== 200)) {
      throw new Error('获取远程文件内容发生错误！')
    }
    let [utilData, listVueData, editVueData] = datas
    utilData = utilData.data
    listVueData = listVueData.data
    editVueData = editVueData.data
    fs.outputFileSync('src/utils/CommonBizUtil.js', utilData)
    fs.outputFileSync('src/views/CommonBizList.vue', listVueData)
    fs.outputFileSync('src/views/CommonBizEdit.vue', editVueData)
    // 更新本地版本号
    let thorConfigContent = JSON.parse(readFileContent('.thorconfig.json'))
    thorConfigContent.bizpageVersion = remoteVersion
    fs.outputFileSync('.thorconfig.json', JSON.stringify(thorConfigContent))
    console.log(success(`可配置化业务已全部更新完成！`))
  }).catch(err => {
    console.log(error(err))
  })
}

fs.access('src/models/SystemConfig.js').then(() => {
  // 工程存在配置文件
  isThorProject = true
  proceed()
}).catch(() => {
  // 工程不存在配置文件
  // console.error(err)
  isThorProject = false
  proceed()
})
