<template>
  <section class="page-common-biz-edit">
    <div class="cs-content-block">
      <div class="cs-page-title">{{ pageTitle }}</div>

      <el-form :size="page.size || 'small'" :label-width="(editPage.labelWidth || '100') + 'px'" :label-position="editPage.align || 'right'" :inline="false" ref="addEditCommonBizForm">
        <div class="box-wrapper" :class="columnClass" v-show="(!item.displays || item.displays.includes(mode)) && (!item.when || item.when(form, editPage.fields, this))" v-for="(item, index) in editPage.fields" :key="index">
          <el-form-item :class="[item.required && 'is-required']" :label="item.label">
            <!-- input类型 -->
            <el-input v-if="item.type === 'input'" v-model="item.value" :clearable="!item.required" :disabled="mode === 'detail' || (item.edits && !item.edits.includes(mode)) || (item.disabled && Boolean(item.disabled(form, editPage.fields, this)))" placeholder="请输入"></el-input>
            <!-- select类型 -->
            <el-select v-else-if="item.type === 'select'" v-model="item.value" :multiple="item.multiple" :clearable="!item.required" filterable :disabled="mode === 'detail' || (item.edits && !item.edits.includes(mode)) || (item.disabled && Boolean(item.disabled(form, editPage.fields, this)))" placeholder="请选择" style="display: block;">
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
              :disabled="mode === 'detail' || (item.edits && !item.edits.includes(mode)) || (item.disabled && Boolean(item.disabled(form, editPage.fields, this)))"
              placeholder="请选择"
              style="display: block; width: 100%;">
            </el-date-picker>
            <!-- cascader类型 -->
            <el-cascader v-else-if="item.type === 'cascader'"
              v-model="item.value"
              :options="item.options"
              :props="{ checkStrictly: item.nodeSelectable, lazy: Boolean(item.lazyOptions), lazyLoad: item.lazyOptions }"
              :clearable="!item.required"
              :disabled="mode === 'detail' || (item.edits && !item.edits.includes(mode)) || (item.disabled && Boolean(item.disabled(form, editPage.fields, this)))"
              filterable
              placeholder="请选择"
              style="display: block;">
            </el-cascader>
            <!-- TODO 支持其他类型 -->
          </el-form-item>
        </div>
        <el-form-item>
          <el-button type="primary" v-if="['add', 'edit'].includes(mode) && editPage.submit" :disabled="loading" @click="handleSave()">确定</el-button>
          <el-button v-if="['add', 'edit'].includes(mode) && editPage.submit" @click="handleCancel()">取消</el-button>
          <el-button type="primary" v-else @click="handleCancel()">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
  </section>
</template>

<script>
// import eventBus from '@/EventBus'
import { customQuery } from '@/api/common'
import systemConfig from '@/models/SystemConfig'
import system from '@/models/system'

export default {
  data () {
    return {
      loading: false,
      mode: 'detail', // 'detail' - 显示，'add' - 添加，'edit' - 编辑
      id: '',
      page: {
        // bizPageId: '',
        // keyParameter: '',
        // name: '', // 业务名称，必选
        // size: ''
      },
      editPage: {
        fields: []
      },
      $message: this.$message // 因为注册问题，这里手动注册一个用于handler回调
    }
  },
  computed: {
    form () {
      if (this.editPage.fields) {
        let result = {}
        this.editPage.fields.forEach(f => {
          result[f.parameter] = f.value
        })
        return result
      } else {
        return {}
      }
    },
    pageTitle () {
      if (this.mode === 'detail') {
        return `${this.page.name}详情`
      } else if (this.mode === 'add') {
        return `新增${this.page.name}`
      } else if (this.mode === 'edit') {
        return `编辑${this.page.name}`
      } else {
        return ''
      }
    },
    columnClass () {
      switch (this.editPage.columns) {
        case 1:
          return ''
        case 3:
          return 'box-tri'
        case 4:
          return 'box-quarter'
        default:
          return 'box-half'
      }
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
    let { bizPageId, keyParameter = 'id', name, size, editPage } = page
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
    editPage.fields.forEach(item => {
      // if (item.defaultValue) {
      //   item.value = item.defaultValue(this)
      // }
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
    this.editPage = editPage
  },

  mounted () {
    const keyParameter = this.page.keyParameter
    const query = this.$route.query || {}
    if (!query.mode || (query.mode === 'edit' && !query[keyParameter])) {
      this.$message('非法访问，请退出重试')
      return false
    }
    this.mode = query.mode
    this.id = query[keyParameter] || ''
    if (this.mode === 'edit' || this.mode === 'detail') {
      this.getData()
    }
  },

  methods: {
    handleCancel () {
      this.$router.go(-1)
    },
    handleSave () {
      if (this.loading) {
        return
      }
      if (!this.verify()) {
        return
      }
      let params = {}
      this.editPage.fields.forEach(f => {
        // 先塞入所有需要的条件，并处理值
        if (this.editPage.submit.paramsFields) {
          // 按照配置的字段填充
          if (this.editPage.submit.paramsFields.includes(f.parameter)) {
            let value = f.value
            f.trim && typeof (value) === 'string' && (value = value.trim())
            if (f.sendHandler) {
              params[f.parameter] = f.sendHandler(value, this)
            } else {
              params[f.parameter] = value
            }
          }
        } else if (f.parameter !== this.page.keyParameter) {
          // 按照除key之外的全量字段填充
          let value = f.value
          f.trim && typeof (value) === 'string' && (value = value.trim())
          if (f.sendHandler) {
            params[f.parameter] = f.sendHandler(value, this)
          } else {
            params[f.parameter] = value
          }
        }
      })
      if (this.mode === 'edit') {
        // 编辑
        params[this.page.keyParameter] = this.id
      }
      this.loading = true
      customQuery(this.editPage.submit[`${this.mode}Target`], params).then(data => {
        // 成功
        this.loading = false
        if (data && data[system.codeParam] === system.okCode) {
          this.$message({
            message: `${this.mode === 'edit' ? '编辑' : '添加'}信息成功`,
            type: 'success'
          })
          this.$router.go(-1)
        } else {
          this.$message({
            message: `${data && data[system.msgParam]} [${data && data[system.codeParam]}]`,
            type: 'error'
          })
        }
      }).catch(err => {
        console.warn(err)
        this.loading = false
        this.$message({
          message: `请求失败！请稍后重试 (${err})`,
          type: 'error'
        })
      })
    },
    verify () {
      let result = true
      for (let i = 0; i < this.editPage.fields.length; i++) {
        const item = this.editPage.fields[i]
        let value = item.trim && typeof (item.value) === 'string' ? item.value.trim() : item.value
        if (item.required && !value) {
          this.$message({
            message: `请输入${item.label}`,
            type: 'warning'
          })
          result = false
          break
        }
        if (item.validate) {
          result = item.validate(value, this)
          break
        }
      }
      return result
    },
    getData () {
      if (this.loading) {
        return
      }
      let params = {}
      params[this.page.keyParameter] = this.id
      this.loading = true
      customQuery(this.editPage.detailTarget, params).then(data => {
        this.loading = false
        if (data && data[system.codeParam] === system.okCode) {
          // 成功
          const detail = data.data || {}
          // 按照字段填充值
          this.editPage.fields.forEach(item => {
            let value = detail[item.parameter] || ''
            if (item.fetchHandler) {
              item.value = item.fetchHandler(value, this)
            } else {
              item.value = value
            }
          })
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

<style scoped lang="scss">
.box-wrapper {
  padding: 0 6px;
}
// .box-complete {
//   width: 100%;
// }
.box-half {
  display: inline-block;
  width: 49.5%;
}
.box-tri {
  display: inline-block;
  width: 33.3%
}
.box-quarter {
  display: inline-block;
  width: 24.5%;
}
</style>
