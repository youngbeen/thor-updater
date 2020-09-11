export default {
  // 初始value类型
  getTypeValue (item) {
    if ((item.type === 'select' && item.multiple) || item.type === 'cascader') {
      return []
    } else if (item.type === 'switch') {
      return item.options[1].value
    } else {
      return ''
    }
  },
  digData (data, fields = []) {
    if (fields.length) {
      // 有剩余参数，继续深入
      if (Object.keys(data).includes(fields[0])) {
        // 存在该字段
        return this.digData(data[fields[0]], fields.slice(1))
      } else {
        // 不存在的字段
        return undefined
      }
    } else {
      // 无参数，返回
      return data
    }
  },
  createTree (node, list, key, pid = 'parentId') {
    list.forEach(ob => {
      if (ob[pid] === node[key]) {
        ob = this.createTree(ob, list, key, pid)
        node.children.push(ob)
      }
    })
    return node
  },
  fixApiTarget (rawUrl = '', data = {}) {
    // NOTE 目前设定动态的参数以{}包裹
    let matches = rawUrl.match(/({[^{}]+})/g)
    if (matches && matches.length) {
      // 存在动态参数，将其替换为对应的数据
      const keys = data ? Object.keys(data) : []
      matches.forEach(m => {
        const paramName = m.substring(1, m.length - 1).replace(/\s/g, '')
        const replaceValue = keys.includes(paramName) ? data[paramName] : ''
        rawUrl = rawUrl.replace(m, replaceValue)
      })
      return rawUrl
    } else {
      // 无动态参数
      return rawUrl
    }
  }
}
