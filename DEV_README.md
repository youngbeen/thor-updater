
### 添加可配置化

* `template/pc/src/EventBus.js` - 有则不处理，无则复制
* `template/pc/src/models/SystemConfig.js` - 有则不处理，无则复制
* `template/pc/src/components/PopoverTooltip.vue` - 有则不处理，无则复制
* `template/pc/src/components/SensitiveInfo.vue` - 覆盖
* `template/pc/src/components/EmbedCommonBizEdit.vue` - 覆盖
* `template/pc/src/utils/CommonBizUtil.js` - 覆盖
* `template/pc/src/views/CommonBizList.vue` - 覆盖
* `template/pc/src/views/CommonBizEdit.vue` - 覆盖

### 更新可配置化

* `template/pc/src/utils/CommonBizUtil.js` - 覆盖
* `template/pc/src/components/SensitiveInfo.vue` - 覆盖
* `template/pc/src/components/EmbedCommonBizEdit.vue` - 覆盖
* `template/pc/src/views/CommonBizList.vue` - 覆盖
* `template/pc/src/views/CommonBizEdit.vue` - 覆盖
* `template/pc/src/models/bizconfig/Dlanguages.js` - 覆盖
* `template/pc/src/models/bizconfig/Dmenus.js` - 覆盖
* `template/pc/src/models/bizconfig/Droles.js` - 覆盖
* `template/pc/src/models/bizconfig/Dsso.js` - 覆盖
* `template/pc/src/models/bizconfig/DsysLogs.js` - 覆盖
* `template/pc/src/models/bizconfig/Dusers.js` - 覆盖
* `template/pc/src/models/bizconfig/Dorg.js` - 覆盖

### 更新框架

* `template/pc/vue.config.js` - 无则复制，有则合并
* `template/pc/babel.config.js` - 覆盖
* `template/pc/_eslintignore` - 覆盖
* `template/pc/_eslintrc.js` - 覆盖
* `template/pc/src/main.js` - 无则复制，有则合并
* `template/pc/src/api/base.js` - 无则复制，有则合并
* `template/pc/src/api/org.js` - 无则复制，有则合并
* `template/pc/src/api/user.js` - 无则复制，有则合并
* `template/pc/src/models/system.js` - 无则复制，有则合并
* `template/pc/src/models/build.js` - 无则复制，有则合并
* `template/pc/src/models/i18n/zh-cn.js` - 有则不处理，无则复制
* `template/pc/src/models/i18n/en.js` - 有则不处理，无则复制
* `template/pc/src/directives/resizeTableColumn.js` - 覆盖
* `template/pc/src/utils/CommonUtil.js` - 覆盖
* `template/pc/src/utils/i18nUtil.js` - 覆盖
* `template/pc/src/ctrls/SystemCtrl.js` - 无则复制，有则合并
* `template/pc/src/components/HeadBar.vue` - 无则复制，有则合并
* `template/pc/src/components/PopoverTooltip.vue` - 覆盖
* `template/pc/src/components/LogoutPop.vue` - 覆盖
* `template/pc/src/components/CommonWrapper.vue` - 覆盖
* `template/pc/src/components/PageTab.vue` - 覆盖
* `template/pc/src/views/Login.vue` - 无则复制，有则合并
* `template/pc/src/views/SSOLanding.vue` - 覆盖
* `template/pc/src/views/ChangePin.vue` - 覆盖
* `template/pc/src/views/role/AddEdit.vue` - 覆盖
* `template/pc/src/views/org/AddEdit.vue` - 覆盖
* `template/pc/src/views/user/AddEdit.vue` - 覆盖
