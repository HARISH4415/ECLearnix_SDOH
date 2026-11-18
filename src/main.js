// Polyfill Uint8Array.prototype.toHex for browser environments
if (typeof Uint8Array !== 'undefined' && !Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function () {
    return Array.from(this).map(function(b) { return b.toString(16).padStart(2, '0') }).join('')
  }
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './styles/base.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
