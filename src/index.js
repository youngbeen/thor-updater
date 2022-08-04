#!/usr/bin/env node

const axios = require('axios')
const diff = require('diff')
const fs = require('fs-extra')
const path = require('path')
const { prompt } = require('enquirer')
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
let operator = '' // 当前操作人

const currentPath = path.resolve('./')
let pathInfo = path.parse(currentPath)

const proceed = () => {
  console.log(`当前工程：${info(pathInfo.name)}  状态：${isThorProject ? info('Thor工程') : warning('其他工程')}  路径：${info(currentPath)}`)
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
  console.log('检查可配置化服务版本...')
  fs.access('.thorconfig.json').then(() => {
    checkVersion()
  }).catch(() => {
    let content = JSON.stringify({
      projectName: '',
      projectType: '',
      author: '',
      bizpageVersion: '0.0.0',
      fmVersion: '0.0.0'
    })
    fs.writeFileSync('.thorconfig.json', content, {
      encoding: 'utf-8'
    })
    checkVersion()
  })
}

const proceedAdd = () => {
  let content = JSON.stringify({
    projectName: '',
    projectType: '',
    author: '',
    bizpageVersion: '0.0.0',
    fmVersion: '0.0.0'
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
    if (data && data.status === 200) {
      // console.log(info('获得远程应答'))
      const result = data.data
      remoteVersion = result.version
      if (remoteVersion !== localVersion) {
        // 有新版本
        addNew ? handleAdd({ remoteVersion }) : handleUpdate({ localVersion, remoteVersion })
      } else {
        // 同版本
        console.log(`当前可配置化服务版本已是最新 (${info(localVersion)})`)
        isThorProject && tryUpdateFm()
      }
    }
  }).catch(err => {
    console.log(error(err))
  })
}

const handleAdd = ({ remoteVersion }) => {
  console.log(`最新版本 ${info(remoteVersion)}`)
  console.log(`开始为工程 ${info(pathInfo.name)} 更新可配置化业务`)
  Promise.all([
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/EventBus.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/models/SystemConfig.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/components/PopoverTooltip.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/components/EmbedCommonBizEdit.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/utils/CommonBizUtil.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/CommonBizList.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/CommonBizEdit.vue')
  ]).then(datas => {
    if (datas.some(item => !item || item.status !== 200)) {
      throw new Error('获取远程文件内容发生错误！')
    }
    let [eventBusData, systemConfigData, popoverTooltipVueData, embedCommonBizEditVueData, utilData, listVueData, editVueData] = datas
    eventBusData = eventBusData.data
    systemConfigData = systemConfigData.data
    popoverTooltipVueData = popoverTooltipVueData.data
    embedCommonBizEditVueData = embedCommonBizEditVueData.data
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
    fs.ensureDir('src/models/bizconfig/')
    try {
      fs.accessSync('src/components/PopoverTooltip.vue')
    } catch (err) {
      fs.outputFileSync('src/components/PopoverTooltip.vue', popoverTooltipVueData)
    }
    fs.outputFileSync('src/components/EmbedCommonBizEdit.vue', embedCommonBizEditVueData)
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
    console.log(`详情链接 ${info('http://10.11.118.52:8085/his-docs/guide/frontend/存量工程添加可配置化公共业务服务须知.html')}`)
  }).catch(err => {
    console.log(error(err))
  })
}

const handleUpdate = ({ localVersion, remoteVersion }) => {
  console.log(`检测到新版本 ${warning(localVersion)} => ${info(remoteVersion)}`)
  console.log(`开始为工程 ${info(pathInfo.name)} 更新可配置化业务`)
  Promise.all([
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/utils/CommonBizUtil.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/components/EmbedCommonBizEdit.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/CommonBizList.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/CommonBizEdit.vue')
  ]).then(datas => {
    if (datas.some(item => !item || item.status !== 200)) {
      throw new Error('获取远程文件内容发生错误！')
    }
    let [utilData, embedEditCompData, listVueData, editVueData] = datas
    utilData = utilData.data
    embedEditCompData = embedEditCompData.data
    listVueData = listVueData.data
    editVueData = editVueData.data
    fs.ensureDir('src/models/bizconfig/')
    fs.outputFileSync('src/utils/CommonBizUtil.js', utilData)
    fs.outputFileSync('src/components/EmbedCommonBizEdit.vue', embedEditCompData)
    fs.outputFileSync('src/views/CommonBizList.vue', listVueData)
    fs.outputFileSync('src/views/CommonBizEdit.vue', editVueData)
    // 更新本地版本号
    let thorConfigContent = JSON.parse(readFileContent('.thorconfig.json'))
    thorConfigContent.bizpageVersion = remoteVersion
    fs.outputFileSync('.thorconfig.json', JSON.stringify(thorConfigContent))
    console.log(success(`可配置化服务已更新完成！`))
    isThorProject && tryUpdateFm()
  }).catch(err => {
    console.log(error(err))
  })
}

const tryUpdateFm = () => {
  prompt([
    {
      type: 'confirm',
      name: 'updateFm',
      message: '是否检查并更新Thor框架？'
    }
  ]).then(res => {
    if (res && res.updateFm) {
      checkFmVersion()
    } else {
      logProjectInfo()
    }
  })
}

const checkFmVersion = () => {
  console.log('检查框架版本...')
  let localVersion = JSON.parse(readFileContent('.thorconfig.json')).fmVersion || '0.0.0'
  let remoteVersion
  axios.get(remoteThorRepoBaseUrl + 'package.json').then(data => {
    if (data && data.status === 200) {
      // console.log(info('获得远程应答'))
      const result = data.data
      remoteVersion = result.fmVersion
      if (remoteVersion !== localVersion) {
        // 有新版本
        handleUpdateFm({
          localVersion,
          remoteVersion
        })
      } else {
        // 同版本
        console.log(`当前框架版本已是最新 (${info(localVersion)})`)
        logProjectInfo()
      }
    }
  }).catch(err => {
    console.log(error(err))
    logProjectInfo()
  })
}

const handleUpdateFm = ({ localVersion, remoteVersion }) => {
  console.log(`检测到新版本 ${warning(localVersion)} => ${info(remoteVersion)}`)
  console.log(`开始为工程 ${info(pathInfo.name)} 更新框架`)
  Promise.all([
    axios.get(remoteThorRepoBaseUrl + 'template/pc/vue.config.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/babel.config.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/_eslintignore'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/main.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/api/base.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/models/system.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/models/build.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/models/i18n/zh-cn.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/models/i18n/en.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/directives/resizeTableColumn.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/utils/CommonUtil.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/utils/i18nUtil.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/ctrls/SystemCtrl.js'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/components/HeadBar.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/components/PopoverTooltip.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/components/LogoutPop.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/components/CommonWrapper.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/components/PageTab.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/Login.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/SSOLanding.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/ChangePin.vue'),
    axios.get(remoteThorRepoBaseUrl + 'template/pc/src/views/role/AddEdit.vue')
  ]).then(datas => {
    if (datas.some(item => !item || item.status !== 200)) {
      throw new Error('获取远程文件内容发生错误！')
    }
    let [vueConfigData, babelConfigData, eslintignoreData, mainjsData, apiBaseData, systemData, buildData, zhCnLang, enLang, resizeTableColumnDirective, commonUtilData, i18nUtilData, systemCtrlData, headbarComp, popoverTooltipComp, logoutPopComp, commonWrapperComp, pageTabComp, loginVue, ssoLandingVue, changePinVue, editRoleVue] = datas
    vueConfigData = vueConfigData.data
    babelConfigData = babelConfigData.data
    eslintignoreData = eslintignoreData.data
    mainjsData = mainjsData.data
    apiBaseData = apiBaseData.data
    systemData = systemData.data
    buildData = buildData.data
    zhCnLang = zhCnLang.data
    enLang = enLang.data
    resizeTableColumnDirective = resizeTableColumnDirective.data
    commonUtilData = commonUtilData.data
    i18nUtilData = i18nUtilData.data
    systemCtrlData = systemCtrlData.data
    headbarComp = headbarComp.data
    popoverTooltipComp = popoverTooltipComp.data
    logoutPopComp = logoutPopComp.data
    commonWrapperComp = commonWrapperComp.data
    pageTabComp = pageTabComp.data
    loginVue = loginVue.data
    ssoLandingVue = ssoLandingVue.data
    changePinVue = changePinVue.data
    editRoleVue = editRoleVue.data
    // 直接覆盖原始文件
    fs.outputFileSync('babel.config.js', babelConfigData)
    fs.outputFileSync('.eslintignore', eslintignoreData)
    fs.outputFileSync('src/directives/resizeTableColumn.js', resizeTableColumnDirective)
    fs.outputFileSync('src/utils/CommonUtil.js', commonUtilData)
    fs.outputFileSync('src/utils/i18nUtil.js', i18nUtilData)
    fs.outputFileSync('src/components/PopoverTooltip.vue', popoverTooltipComp)
    fs.outputFileSync('src/components/LogoutPop.vue', logoutPopComp)
    fs.outputFileSync('src/components/CommonWrapper.vue', commonWrapperComp)
    fs.outputFileSync('src/components/PageTab.vue', pageTabComp)
    fs.outputFileSync('src/views/SSOLanding.vue', ssoLandingVue)
    fs.outputFileSync('src/views/ChangePin.vue', changePinVue)
    fs.outputFileSync('src/views/role/AddEdit.vue', editRoleVue)
    // 没有则复制，有则合并更新
    mergeOrNew('vue.config.js', vueConfigData)
    mergeOrNew('src/main.js', mainjsData)
    mergeOrNew('src/api/base.js', apiBaseData)
    mergeOrNew('src/models/system.js', systemData)
    mergeOrNew('src/models/build.js', buildData)
    mergeOrNew('src/ctrls/SystemCtrl.js', systemCtrlData)
    mergeOrNew('src/components/HeadBar.vue', headbarComp)
    mergeOrNew('src/views/Login.vue', loginVue)
    // 没有则复制，有则不处理
    makeSureFile('src/models/i18n/zh-cn.js', zhCnLang)
    makeSureFile('src/models/i18n/en.js', enLang)
    // 更新本地版本号
    let thorConfigContent = JSON.parse(readFileContent('.thorconfig.json'))
    thorConfigContent.fmVersion = remoteVersion
    fs.outputFileSync('.thorconfig.json', JSON.stringify(thorConfigContent))
    console.log(success(`框架已更新完成！`))
    logProjectInfo()
  }).catch(err => {
    console.log(error(err))
    logProjectInfo()
  })
}

const logProjectInfo = async () => {
  const thorConfigContent = JSON.parse(readFileContent('.thorconfig.json'))
  let projectInfo = {
    projectName: thorConfigContent.projectName || '',
    projectType: thorConfigContent.projectType || '',
    frameworkVersion: thorConfigContent.fmVersion || '',
    configBizVersion: thorConfigContent.bizpageVersion || '',
    operator,
    operationType: 'upgrade'
  }
  projectInfo.extraInfo = JSON.stringify(projectInfo)
  await axios.request({
    url: 'http://172.30.251.53:8888/fast/statistics', // 正式信息保存接口
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    data: projectInfo,
    timeout: 1000 * 10
  })
}

const mergeOrNew = (path, newData) => {
  fs.access(path).then(() => {
    let result = walkMerge(path, newData)
    if (result.count) {
      console.log(`${info(path)} 中有 ${warning(result.count)} 处合并冲突，搜索关键字“${info('==START==')}”和“${info('==END==')}”来定位冲突`)
    }
    fs.outputFileSync(path, result.value)
  }).catch(() => {
    fs.outputFileSync(path, newData)
  })
}

const makeSureFile = (path, data) => {
  fs.access(path).then(() => {}).catch(() => {
    fs.outputFileSync(path, data)
  })
}

const walkMerge = (originalFilePath, newContent) => {
  let oriContent = readFileContent(originalFilePath)
  oriContent = oriContent.replace(new RegExp('\\r\\n', 'g'), '\n')
  const diffs = diff.diffLines(oriContent, newContent)
  let merged = ''
  let count = 0
  diffs.forEach((d) => {
    if (d.removed) {
      count++
      merged += `// ==START== TODO ${count} 你编辑过的内容\n${d.value}// ==END== 你编辑过的内容\n`
    } else {
      merged += d.value
    }
  })
  return {
    count,
    value: merged
  }
}

prompt([
  {
    type: 'confirm',
    name: 'proceed',
    message: '建议在使用更新插件前，先提交代码。是否继续执行更新操作？'
  }
]).then(res => {
  if (res && res.proceed) {
    prompt([
      {
        type: 'input',
        name: 'operator',
        message: '输入您的OA账号或者姓名',
        validate: input => !!input
      }
    ]).then(res => {
      if (res && res.operator) {
        operator = res.operator
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
      }
    })
  }
})
