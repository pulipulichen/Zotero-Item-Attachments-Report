/* global Vue, httpVueLoader */

//httpVueLoader.register(Vue, './components/device-notification-bar.vue');

var appComponents = {
  //'template': httpVueLoader('./components/template.vue'),
  'app-header': httpVueLoader('./components/app-header/app-header.vue'),
  'attachments-reporter': httpVueLoader('./components/attachments-reporter/attachments-reporter.vue')
}