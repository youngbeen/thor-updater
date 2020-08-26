<template>
  <section class="page-common-biz">
    <div class="cs-content-block">
      <div class="cs-page-title" v-if="page.name">{{ page.name }}列表</div>
      <!-- 筛选栏 -->
      <div class="box-filters" v-if="listPage.filters.length || listPage.filterActions.length">
        <el-form :inline="true" :size="page.size || 'small'">
          <el-form-item v-for="item in listPage.filters" :key="item.parameter" :label="item.label">
            <!-- input类型 -->
            <el-input v-if="item.type === 'input'" v-model="item.value" clearable placeholder="请输入"></el-input>
            <!-- select类型 -->
            <el-select v-else-if="item.type === 'select'" v-model="item.value" :multiple="item.multiple" filterable clearable placeholder="请选择">
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
              clearable
              placeholder="请选择">
            </el-date-picker>
            <!-- cascader类型 -->
            <el-cascader v-else-if="item.type === 'cascader'"
              v-model="item.value"
              :options="item.options"
              :props="{ checkStrictly: item.nodeSelectable, lazy: Boolean(item.lazyOptions), lazyLoad: item.lazyOptions }"
              filterable
              clearable
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
              清空
            </el-button>
          </el-form-item>
          <el-form-item v-show="!action.permissionKey || user.permissions.includes(action.permissionKey)"
            v-for="(action, index) in listPage.filterActions" :key="index">
            <el-button :type="action.style" @click="handleAction(action)">
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
          style="width: 100%">
          <el-table-column
            v-if="listPage.hasIndex === undefined || listPage.hasIndex"
            type="index"
            label="序号"
            width="50">
          </el-table-column>
          <el-table-column
            v-for="item in listPage.tableFields"
            :key="item.parameter"
            :prop="item.parameter"
            :label="item.label"
            :align="item.align || 'left'"
            :show-overflow-tooltip="true">
            <template slot-scope="scope">
              {{ item.handler ? item.handler(scope.row[item.parameter], scope.row, this) : scope.row[item.parameter] }}
            </template>
          </el-table-column>
          <el-table-column
            fixed="right"
            label="操作"
            v-if="listPage.tableActions.length"
            :width="listPage.tableActionWidth">
            <template slot-scope="scope">
              <span v-for="(action, index) in listPage.tableActions" :key="index">
                <el-button v-if="(!action.permissionKey || user.permissions.includes(action.permissionKey)) && (!action.when || action.when(scope.row, this))"
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
        tableActions: []
      },
      user,
      $message: this.$message // 因为注册问题，这里手动注册一个用于handler回调
    }
  },

  created () {
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
    if (query.bizPageId.indexOf('S') > -1) {
      // 本地业务
      page = systemConfig.bizPages.find(p => p.bizPageId === query.bizPageId)
    } else if (query.bizPageId.indexOf('D') > -1) {
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
    })
    this.listPage = listPage
  },

  mounted () {
    if (this.listPage.listTarget) {
      this.getList()
    }
  },

  methods: {
    search () {
      this.filter.pageNo = 1
      this.getList()
    },
    reset () {
      this.listPage.filters.forEach(item => {
        item.value = this.getTypeValue(item)
      })
    },
    handlePageChange () {
      this.getList()
    },
    handleSizeChange () {
      this.filter.pageNo = 1
      this.getList()
    },
    handleAction (action) {
      if (!action) {
        return
      }
      let params = {
        bizPageId: this.page.bizPageId
      }
      if (action.attachParams) {
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
        let query = {}
        if (action.target.query) {
          query = Object.assign({}, action.target.query, params)
        } else {
          query = params
        }
        this.$router.push(Object.assign({}, action.target, {
          query
        }))
      } else if (action.type === 'api') {
        this.loading = true
        customQuery(action.target, params).then(data => {
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
            params[item.parameter] = item.handler(row[item.parameter], this)
          }
        })
      } else {
        // 全量参数
        params = Object.assign({}, params, row)
      }
      if (action.type === 'router') {
        let query = {}
        if (action.target.query) {
          query = Object.assign({}, action.target.query, params)
        } else {
          query = params
        }
        this.$router.push(Object.assign({}, action.target, {
          query
        }))
      } else if (action.type === 'api') {
        this.loading = true
        customQuery(action.target, params).then(data => {
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
    getList () {
      if (this.loading) {
        return
      }
      let params = {
        pageNo: this.filter.pageNo,
        pageSize: this.filter.pageSize
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
      customQuery(this.listPage.listTarget, params).then(data => {
        this.loading = false
        if (data && data[system.codeParam] === system.okCode) {
          // 成功
          const detail = data.data || {}
          this.list = detail.list || []
          this.total = parseInt(detail.total) || 0
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
    // 初始value类型
    getTypeValue (item) {
      if ((item.type === 'select' && item.multiple) || item.type === 'cascader') {
        return []
      } else {
        return ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
