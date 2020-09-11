#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const style = require('chalk')

const info = style.cyan.bold
const success = style.green.bold
const warning = style.yellow.bold
const error = style.red.bold
// const tip = style.gray

let isThorProject = true // 是否是Thor生成的工程

const currentPath = path.resolve('./')
let pathInfo = path.parse(currentPath)

const updateBiz = () => {
  // 更新
  Promise.all([updateService('utils', '所需支持'), updateService('views', '可配置化业务支持')]).then(() => {
    // 全部完成
    console.log(success(`可配置化业务已全部更新完成！`))
  }).catch(err => {
    console.error(error(err))
  })
}

const updateService = (service, serviceName) => new Promise((resolve, reject) => {
  fs.copy(`node_modules/thor-bizpage-update/assets/${service}/`, `src/${service}/`).then(() => {
    console.log(success(`${serviceName}已更新`))
    resolve()
  }).catch((err) => {
    console.error(error(err))
    reject(err)
  })
})

const addFeature = () => {
  // 新添加
  Promise.all([addService('models', '配置文件'), addService('utils', '所需支持'), addService('views', '可配置化业务')]).then(() => {
    // 全部完成
    console.log(success(`可配置化业务已全部添加完成！`))
    console.log(`配置文件路径：${info('src/models/SystemConfig.js')}`)
    console.warn(warning(`请注意：可配置化业务的路由配置需手动配置`))
  }).catch(err => {
    console.error(error(err))
  })
}

const addService = (service, serviceName) => new Promise((resolve, reject) => {
  fs.ensureDir(`src/${service}/`).then(() => {
    // 确保有文件夹
    return fs.copy(`node_modules/thor-bizpage-update/assets/${service}/`, `src/${service}/`)
  }).then(() => {
    // 拷贝成功
    console.log(success(`${serviceName}已添加`))
    resolve()
  }).catch(err => {
    console.error(error(err))
    reject(err)
  })
})

const proceed = () => {
  console.log(`当前工程：${info(pathInfo.name)}  状态：${isThorProject ? info('Thor工程') : warning('非Thor历史工程')}  路径：${info(currentPath)}`)
  if (isThorProject) {
    // thor工程，只更新可配置化业务文件
    console.log(info(`开始更新工程 ${warning(pathInfo.name)} 的可配置化业务`))
    updateBiz()
  } else {
    // 老工程，需要添加配置文件+可配置化业务文件
    console.log(info(`开始为工程 ${warning(pathInfo.name)} 添加可配置化业务支持`))
    addFeature()
  }
}

fs.access('src/models/SystemConfig.js').then(() => {
  // 工程存在配置文件
  isThorProject = true
  proceed()
}).catch(err => {
  // 工程不存在配置文件
  // console.error(err)
  isThorProject = false
  proceed()
})
