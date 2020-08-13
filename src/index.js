#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')

let isThorProject = true // 是否是Thor生成的工程

const currentPath = path.resolve('./')
let pathInfo = path.parse(currentPath)

const updateBizPage = () => {
  fs.copy('node_modules/thor-bizpage-update/assets/views/', 'src/views/').then(() => {
    console.log('可配置化业务支持文件已更新')
  }).catch((err) => {
    console.error(err)
  })
}

const addFeature = () => {
  Promise.all([addConfig(), addBizPage()]).then(() => {
    // 全部完成
    console.log(`可配置化业务已全部添加完成！`)
    console.log(`配置文件路径：src/models/SystemConfig.js`)
    console.warn(`请注意：可配置化业务的路由配置需手动配置`)
  }).catch(err => {
    console.error(err)
  })
}

const addConfig = () => new Promise((resolve, reject) => {
  fs.ensureDir('src/models/').then(() => {
    // 确保有models文件夹
    return fs.copy('node_modules/thor-bizpage-update/assets/models/', 'src/models/')
  }).then(() => {
    // 拷贝成功
    console.log('配置文件已添加')
    resolve()
  }).catch(err => {
    console.error(err)
    reject(err)
  })
})

const addBizPage = () => new Promise((resolve, reject) => {
  fs.ensureDir('src/views/').then(() => {
    // 确保有views文件夹
    return fs.copy('node_modules/thor-bizpage-update/assets/views/', 'src/views/')
  }).then(() => {
    // 拷贝成功
    console.log('可配置化业务已添加')
    resolve()
  }).catch(err => {
    console.error(err)
    reject(err)
  })
})

fs.exists('src/models/SystemConfig.js').then((exist) => {
  // 判断工程是否存在配置文件
  isThorProject = exist
  console.log(`当前工程：${pathInfo.name}  状态：${isThorProject ? 'Thor工程' : '非Thor历史工程'}  路径：${currentPath}`)
  if (isThorProject) {
    // thor工程，只更新可配置化业务文件
    console.log(`开始更新工程 ${pathInfo.name} 的可配置化业务`)
    updateBizPage()
  } else {
    // 老工程，需要添加配置文件+可配置化业务文件
    console.log(`开始为工程 ${pathInfo.name} 添加可配置化业务支持`)
    addFeature()
  }
}).catch(err => {
  console.error(err)
})
