<template>
  <section class="page-common-biz">
    <div class="cs-content-block">
      <div class="cs-page-title" v-if="page.name">{{ page.name }}列表</div>
      <!-- 筛选栏 -->
      <div class="box-filters"
        v-if="listPage.filters.length || listPage.filterActions.length || listPage.batchActions.length">
        <el-form
          :inline="true"
          :size="page.size || 'small'">
          <el-form-item
            :class="[item.required && 'is-required']"
            v-for="item in listPage.filters"
            :key="item.parameter"
            :label="item.label">
            <!-- input类型 -->
            <el-input v-if="item.type === 'input'"
              v-model="item.value"
              :clearable="!item.required"
              placeholder="请输入"></el-input>
            <!-- select类型 -->
            <el-select v-else-if="item.type === 'select'"
              v-model="item.value"
              :multiple="item.multiple"
              filterable
              :clearable="!item.required"
              placeholder="请选择">
              <el-option
                v-for="o in item.options"
                :key="o.value"
                :label="o.label"
                :value="o.value"
                :disabled="o.disabled">
              </el-option>
            </el-select>
            <!-- date类型 -->
            <el-date-picker
              v-else-if="item.type === 'date'"
              v-model="item.value"
              type="date"
              value-format="yyyy-MM-dd"
              :clearable="!item.required"
              placeholder="请选择">
            </el-date-picker>
            <!-- cascader类型 -->
            <el-cascader v-else-if="item.type === 'cascader'"
              v-model="item.value"
              :options="item.options"
              :props="{ checkStrictly: item.nodeSelectable, lazy: Boolean(item.lazyOptions), lazyLoad: item.lazyOptions }"
              filterable
              :clearable="!item.required"
              placeholder="请选择">
            </el-cascader>
            <!-- TODO 支持其他种类 -->
          </el-form-item>
          <el-form-item v-if="listPage.filters.length && (listPage.hasSearch === undefined || listPage.hasSearch)">
            <el-button type="primary" @click="search()">
              <font-awesome-icon :icon="['fas', 'search']" />&nbsp;查询
            </el-button>
          </el-form-item>
          <el-form-item v-if="listPage.filters.length && (listPage.hasSearch === undefined || listPage.hasSearch)">
            <el-button type="default" @click="reset()">
              重置
            </el-button>
          </el-form-item>
          <!-- 筛选栏操作 -->
          <el-form-item v-show="hasPermission(action.permissionKey)"
            v-for="(action, index) in listPage.filterActions" :key="'fa-' + index">
            <el-button :type="action.style" @click="handleAction(action)">
              {{ action.label }}
            </el-button>
          </el-form-item>
          <!-- 表格批量操作 -->
          <el-form-item v-show="hasPermission(action.permissionKey) && (!action.when || action.when(selections, this))"
            v-for="(action, index) in listPage.batchActions" :key="'ba-' + index">
            <el-button
              :type="action.style || 'primary'"
              :disabled="action.disabled && action.disabled(selections, this)"
              @click="handleBatchAction($event, action)">
              {{ action.label }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 列表栏 -->
      <div class="box-list" v-if="page.name">
        <el-table
          :data="list"
          v-loading="loading"
          :row-key="listPage.isTreeTable ? page.keyParameter : null"
          :default-expand-all="listPage.treeExpendMode === 'all'"
          :expand-row-keys="defaultExpands"
          @selection-change="handleSelectionChange"
          style="width: 100%">
          <el-table-column
            type="selection"
            v-if="listPage.batchActions.length"
            width="55"
            :key="Math.random()">
          </el-table-column>
          <el-table-column
            v-if="listPage.hasIndex === undefined || listPage.hasIndex"
            type="index"
            label="序号"
            width="50"
            :key="Math.random()">
          </el-table-column>
          <el-table-column
            v-for="item in listPage.tableFields"
            :key="item.parameter"
            :prop="item.parameter"
            :label="item.label"
            :align="item.align || 'left'"
            :width="item.width || ''"
            :show-overflow-tooltip="true">
            <template slot-scope="scope">
              <span v-if="!item.type || item.type === 'text'">
                {{ item.handler ? item.handler(scope.row[item.parameter], scope.row, this) : scope.row[item.parameter] }}
              </span>
              <el-image v-else-if="item.type === 'image' && scope.row[item.parameter]"
                style="width: 26px; height: 26px"
                :src="scope.row[item.parameter]"
                :preview-src-list="[scope.row[item.parameter]]"
                fit="contain">
              </el-image>
              <span v-else-if="item.type === 'tag'">
                <el-tag type="success" size="mini" hit v-if="item.successStatus && item.successStatus.includes(scope.row[item.parameter])">{{ item.handler ? item.handler(scope.row[item.parameter], scope.row, this) : scope.row[item.parameter] }}</el-tag>
                <el-tag type="danger" size="mini" hit v-else-if="item.failStatus && item.failStatus.includes(scope.row[item.parameter])">{{ item.handler ? item.handler(scope.row[item.parameter], scope.row, this) : scope.row[item.parameter] }}</el-tag>
                <el-tag type="info" size="mini" hit v-else>{{ item.handler ? item.handler(scope.row[item.parameter], scope.row, this) : scope.row[item.parameter] }}</el-tag>
              </span>
            </template>
          </el-table-column>
          <el-table-column
            fixed="right"
            label="操作"
            v-if="listPage.tableActions.length"
            :min-width="listPage.tableActionWidth || listPage.tableActions.length * 80">
            <template slot-scope="scope">
              <span v-for="(action, index) in listPage.tableActions" :key="'ta-' + index">
                <el-button v-if="hasPermission(action.permissionKey) && (!action.when || action.when(scope.row, this))"
                  :type="action.style || 'primary'"
                  :size="listPage.tableActionSize || 'mini'"
                  @click="handleTableAction($event, action, scope.row)"
                  style="margin-right: 6px;">{{ action.label }}</el-button>
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页栏 -->
      <div class="box-footer" v-if="listPage.pager" style="margin-top: 12px;" :style="{ textAlign: listPage.pager.align || 'left' }">
        <el-pagination
          class="box-pager"
          :layout="listPage.pager.pagerLayout"
          background
          :current-page.sync="filter.pageNo"
          :total="total"
          :page-sizes="[10, 20, 50]"
          :page-size.sync="filter.pageSize"
          @size-change="handleSizeChange()"
          @current-change="handlePageChange()">
        </el-pagination>
      </div>
    </div>
  </section>
</template>

<script>
import eventBus from '@/EventBus'
import { customQuery } from '@/api/common'
import systemConfig from '@/models/SystemConfig'
import system from '@/models/system'
import user from '@/models/user'

export default {
  data () {
    return {
      loading: false,
      filter: {
        pageNo: 1,
        pageSize: 10
      },
      selections: [],
      total: 0,
      list: [],
      page: {
        // bizPageId: '',
        // keyParameter: '',
        // name: '', // 业务名称，必选
        // size: ''
      },
      listPage: {
        filters: [],
        filterActions: [],
        tableFields: [],
        tableActions: [],
        batchActions: []
      },
      defaultExpands: null,
      user,
      $message: this.$message, // 因为注册问题，这里手动注册用于handler回调
      $alert: this.$alert,
      $confirm: this.$confirm,
      $prompt: this.$prompt,
      $notify: this.$notify
    }
  },
  computed: {
    form () {
      if (this.listPage.filters) {
        let result = {}
        this.listPage.filters.forEach(f => {
          result[f.parameter] = f.value
        })
        return result
      } else {
        return {}
      }
    }
  },
  watch: {
    '$route' (to, from) {
      this.initData()
      if (this.listPage.listTarget) {
        this.getList()
      }
    }
  },

  created () {
    this.initData()
  },

  mounted () {
    if (this.listPage.listTarget) {
      this.getList()
    }
  },

  methods: {
    initData () {
      this.filter = {
        pageNo: 1,
        pageSize: 10
      }
      this.total = 0
      this.selections = []
      this.list = []
      this.defaultExpands = null
      const _this = this
      const query = this.$route.query || {}
      if (!query.bizPageId) {
        this.$message({
          message: '非法访问，请退出重试',
          type: 'error'
        })
        return false
      }
      let page = null
      if (query.bizPageId[0].toUpperCase() === 'S') {
        // 本地业务
        page = systemConfig.bizPages.find(p => p.bizPageId === query.bizPageId)
      } else if (query.bizPageId[0].toUpperCase() === 'D') {
        // 远程业务
        page = systemConfig.remotePages.find(p => p.bizPageId === query.bizPageId)
      }
      if (!page) {
        this.$message({
          message: '不存在的业务，请确认业务id并退出重试',
          type: 'error'
        })
        return false
      }
      let { bizPageId, keyParameter = 'id', name, size, listPage } = page
      this.page = {
        bizPageId,
        keyParameter,
        name,
        size
      }
      // 处理初始值
      listPage.filters = listPage.filters || []
      listPage.filterActions = listPage.filterActions || []
      listPage.tableFields = listPage.tableFields || []
      listPage.tableActions = listPage.tableActions || []
      listPage.batchActions = listPage.batchActions || []
      async function queryOptions (item) {
        item.options = await item.defaultOptions(this)
        // NOTE 因为数据层级太深的原因，异步获取后手动update确保视图更新
        _this.$forceUpdate()
      }
      listPage.filters.forEach(item => {
        if (item.defaultValue) {
          item.value = item.defaultValue(this)
        }
        if (item.defaultOptions) {
          if (item.async) {
            // 异步获取默认数据
            queryOptions(item)
          } else {
            // 正常获取
            item.options = item.defaultOptions(this)
          }
        }
        if (item.value === undefined) {
          // 补充未完善的value
          item.value = this.getTypeValue(item)
        }
        if (item.parameter !== 'bizPageId' && query[item.parameter]) {
          // query参数中存在带入参数
          item.value = query[item.parameter]
        }
      })
      this.listPage = listPage
    },
    search () {
      this.filter.pageNo = 1
      this.getList()
    },
    reset () {
      this.listPage.filters.forEach(item => {
        if (item.defaultValue) {
          item.value = item.defaultValue(this)
        } else {
          item.value = this.getTypeValue(item)
        }
      })
    },
    handleSelectionChange (selections) {
      this.selections = selections
    },
    handlePageChange () {
      this.getList()
    },
    handleSizeChange () {
      this.filter.pageNo = 1
      this.getList()
    },
    handleBatchAction (e, action) {
      if (action.confirm) {
        // 需要确认弹框
        eventBus.$emit('notifyShowPopover', {
          x: e.clientX || 0,
          y: e.clientY || 0,
          popMsg: action.confirm.confirmMsg(this.selections, this),
          confirmType: action.confirm.confirmType || 'primary',
          callback: () => {
            this.proceedBatchAction(action, this.selections)
          }
        })
      } else {
        // 无需弹框确认
        this.proceedBatchAction(action, this.selections)
      }
    },
    proceedBatchAction (action, rows) {
      if (!action || !action.data || !action.target) {
        return
      }
      let params = action.data(rows, this)
      if (action.type === 'router') {
        // NOTE 暂不支持
        // this.$router.push(Object.assign({}, action.target, {
        //   query: action.target.query || {},
        //   params
        // }))
      } else {
        // api调用方式
        this.loading = true
        let option = {
          method: action.apiParams?.method || 'post'
        }
        let finalTarget = this.fixApiTarget(action.target, params)
        customQuery(finalTarget, params, option).then(data => {
          this.loading = false
          if (data && data[system.codeParam] === system.okCode) {
            // 成功
            if (action.successCallback) {
              action.successCallback(data, this)
            }
          } else {
            // 业务码错误
            this.$message({
              message: `${data && data[system.msgParam]}[${data && data[system.codeParam]}]`,
              type: 'error'
            })
          }
        }).catch(error => {
          // 失败
          console.error(error)
          this.loading = false
          this.$message({
            message: `请求失败，请稍后重试(${error})`,
            type: 'error'
          })
        })
      }
    },
    handleAction (action) {
      if (!action) {
        return
      }
      let params = {
        bizPageId: this.page.bizPageId
      }
      if (action.attachParams === undefined || action.attachParams) {
        this.listPage.filters.forEach(item => {
          let value = item.value
          item.trim && typeof (value) === 'string' && (value = value.trim()) // 左右去空
          if (item.handler) {
            params[item.parameter] = item.handler(value, this)
          } else {
            params[item.parameter] = value
          }
        })
      }
      if (action.type === 'router') {
        let routerObj = {
          query: {},
          params: {}
        }
        if (action.useQuery) {
          // 使用query方式传递参数
          routerObj.query = params
        } else {
          // 使用params方式传递参数
          routerObj.params = params
        }
        this.$router.push(Object.assign({}, action.target, {
          query: Object.assign({}, action.target.query, routerObj.query),
          params: Object.assign({}, action.target.params, routerObj.params)
        }))
      } else if (action.type === 'api') {
        if (!this.verify()) {
          return
        }
        this.loading = true
        let option = {
          method: action.apiParams?.method || 'post'
        }
        let finalTarget = this.fixApiTarget(action.target, params)
        customQuery(finalTarget, params, option).then(data => {
          this.loading = false
          if (data && data[system.codeParam] === system.okCode) {
            // 成功
            if (action.successCallback) {
              action.successCallback(data, this)
            }
          } else {
            // 业务码错误
            this.$message({
              message: `${data && data[system.msgParam]}[${data && data[system.codeParam]}]`,
              type: 'error'
            })
          }
        }).catch(error => {
          // 失败
          console.error(error)
          this.loading = false
          this.$message({
            message: `请求失败，请稍后重试(${error})`,
            type: 'error'
          })
        })
      }
    },
    handleTableAction (e, action, row) {
      if (action.confirm) {
        // 需要确认弹框
        eventBus.$emit('notifyShowPopover', {
          x: e.clientX || 0,
          y: e.clientY || 0,
          popMsg: action.confirm.confirmMsg(row, this),
          confirmType: action.confirm.confirmType || 'primary',
          callback: () => {
            this.proceedTableAction(action, row)
          }
        })
      } else {
        // 无需弹框确认
        this.proceedTableAction(action, row)
      }
    },
    proceedTableAction (action, row) {
      if (!action || !row) {
        return
      }
      let params = {
        bizPageId: this.page.bizPageId
      }
      if (action.paramsFields?.length) {
        // 指定参数
        action.paramsFields.forEach(item => {
          if (typeof (item) === 'string') {
            // 直接指定的是字段名
            params[item] = row[item]
          } else {
            // 对象类型的配置
            params[item.as || item.parameter] = item.handler(row[item.parameter], this)
          }
        })
      } else {
        // 全量参数
        params = Object.assign({}, params, row)
      }
      if (action.type === 'router') {
        let routerObj = {
          query: {},
          params: {}
        }
        if (action.useQuery) {
          // 使用query方式传递参数
          routerObj.query = params
        } else {
          // 使用params方式传递参数
          routerObj.params = params
        }
        this.$router.push(Object.assign({}, action.target, {
          query: Object.assign({}, action.target.query, routerObj.query),
          params: Object.assign({}, action.target.params, routerObj.params)
        }))
      } else if (action.type === 'api') {
        this.loading = true
        let option = {
          method: action.apiParams?.method || 'post'
        }
        let finalTarget = this.fixApiTarget(action.target, params)
        customQuery(finalTarget, params, option).then(data => {
          this.loading = false
          if (data && data[system.codeParam] === system.okCode) {
            // 成功
            if (action.successCallback) {
              action.successCallback(data, this)
            }
          } else {
            // 业务码错误
            this.$message({
              message: `${data && data[system.msgParam]}[${data && data[system.codeParam]}]`,
              type: 'error'
            })
          }
        }).catch(error => {
          // 失败
          console.error(error)
          this.loading = false
          this.$message({
            message: `请求失败，请稍后重试(${error})`,
            type: 'error'
          })
        })
      }
    },
    verify () {
      let result = true
      for (let i = 0; i < this.listPage.filters.length; i++) {
        const item = this.listPage.filters[i]
        let value = item.trim && typeof (item.value) === 'string' ? item.value.trim() : item.value
        if (item.required && !value) {
          this.$message({
            message: `请完善${item.label}`,
            type: 'warning'
          })
          result = false
          break
        }
        if (item.validate) {
          let validateResult = item.validate(value, this.form, this)
          if (validateResult) {
            // 校验通过
          } else {
            // 校验不通过
            result = false
            break
          }
        }
      }
      return result
    },
    getList () {
      if (this.loading) {
        return
      }
      if (!this.verify()) {
        return
      }
      let params = {
        pageNo: this.filter.pageNo,
        pageSize: this.listPage.isTreeTable ? 0 : this.filter.pageSize
      }
      this.listPage.filters.forEach(item => {
        let value = item.value
        item.trim && typeof (value) === 'string' && (value = value.trim()) // 左右去空
        if (item.handler) {
          params[item.parameter] = item.handler(value, this)
        } else {
          params[item.parameter] = value
        }
      })
      this.loading = true
      let option = {
        method: this.listPage.listApiParams?.method || 'post'
      }
      customQuery(this.listPage.listTarget, params, option).then(data => {
        this.loading = false
        if (data && data[system.codeParam] === system.okCode) {
          // 成功
          const raw = data.data || {}
          const detail = this.digData(raw, system.dataWrapper) || {}
          let list = detail.list || []
          if (this.listPage.isTreeTable) {
            list.forEach(item => {
              item.children = []
            })
            let rootNode = {
              children: []
            }
            rootNode[this.page.keyParameter] = 0
            let originalList = this.createTree(rootNode, list)
            this.list = originalList.children || []
            if (['all', 'no'].includes(this.listPage.treeExpendMode)) {
              this.defaultExpands = []
            } else {
              this.defaultExpands = this.list.map(item => item[this.page.keyParameter].toString())
            }
          } else {
            this.list = list
          }
          this.total = parseInt(detail[system.totalParam]) || 0
        } else {
          // 业务码错误
          this.$message({
            message: `${data && data[system.msgParam]}[${data && data[system.codeParam]}]`,
            type: 'error'
          })
        }
      }).catch(error => {
        // 失败
        console.error(error)
        this.loading = false
        this.$message({
          message: `请求失败，请稍后重试(${error})`,
          type: 'error'
        })
      })
    },
    // 判断是否拥有权限
    hasPermission (key) {
      let result = true
      if (key) {
        if (Array.isArray(key)) {
          // 多权限或
          result = key.some(k => user.permissions.includes(k))
        } else {
          // 单权限
          result = user.permissions.includes(key)
        }
      }
      return result
    },
    // 初始value类型
    getTypeValue (item) {
      if ((item.type === 'select' && item.multiple) || item.type === 'cascader') {
        return []
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
    createTree (node, list) {
      list.forEach(ob => {
        if (ob.parentId === node[this.page.keyParameter]) {
          ob = this.createTree(ob, list)
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
}
</script>

<style lang="scss" scoped>
</style>
