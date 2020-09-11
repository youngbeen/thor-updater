<template>
  <section class="bed-popover-tooltip" :style="{ left: position.x - 6 + 'px', top: position.y - 6 + 'px' }">
    <el-popover
      placement="top"
      width="200"
      trigger="manual"
      v-model="isPopShow">
      <p>{{ popMsg }}</p>
      <div style="text-align: right; margin-top: 4px;">
        <el-button size="mini" type="text" @click="isPopShow = false">取消</el-button>
        <el-button :type="confirmType" size="mini" @click="handleConfirm()">确定</el-button>
      </div>
      <div class="dot" id="popover-trigger" slot="reference">&nbsp;</div>
    </el-popover>
  </section>
</template>

<script>
import eventBus from '@/EventBus'

export default {
  // props: {
  //   callback: {
  //     type: Function,
  //     required: false,
  //     default: () => {}
  //   }
  // },
  data () {
    return {
      isPopShow: false,
      popMsg: '',
      position: {
        x: 0,
        y: 0
      },
      confirmType: 'primary',
      callback: () => {}
    }
  },

  mounted () {
    eventBus.$on('notifyShowPopover', params => {
      if (this.isPopShow) {
        // 已开启其他popover
        this.isPopShow = false
      }
      setTimeout(() => {
        if (params?.popMsg) {
          // console.log(params)
          this.position.x = params.x || 0
          this.position.y = params.y || 0
          this.popMsg = params.popMsg
          this.confirmType = params?.confirmType || 'primary'
          this.isPopShow = true
          this.callback = params.callback || function () {}
        } else {
          console.warn('缺失关键参数，无法调起popover组件')
        }
      }, 100)
    })
  },

  beforeDestroy () {
    eventBus.$off('notifyShowPopover')
  },

  methods: {
    handleConfirm () {
      this.callback()
      this.isPopShow = false
    }
  }
}
</script>

<style lang="scss" scoped>
.bed-popover-tooltip {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 99;
  pointer-events: none;
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: red;
    opacity: 0;
  }
}
</style>
