/*
 * @Author: zaqvil
 * @Date: 2021-01-14 16:08:28
 * @FilePath: \projects\prerenderer\es6\server.js
 * @LastEditTime: 2021-01-19 14:12:31
 * @LastEditors: zaqvil
 */
const express = require('express')
const proxy = require('http-proxy-middleware')
const path = require('path')

class Server {
  constructor (Prerenderer) {
    this._prerenderer = Prerenderer
    this._options = Prerenderer.getOptions()
    this._expressServer = express()
    this._nativeServer = null
  }

  initialize () {
    const server = this._expressServer

    if (this._options.server && this._options.server.before) {
      this._options.server.before(server)
    }

    this._prerenderer.modifyServer(this, 'pre-static')

    // 允许访问静态资源
    server.get('*', express.static(this._options.staticDir, {
      dotfiles: 'allow'
    }))

    this._prerenderer.modifyServer(this, 'post-static')

    this._prerenderer.modifyServer(this, 'pre-fallback')

    // 设置代理
    if (this._options.server && this._options.server.proxy) {
      for (let proxyPath of Object.keys(this._options.server.proxy)) {
        server.use(proxyPath, proxy(this._options.server.proxy[proxyPath]))
      }
    }

    server.get('*', (req, res) => {
      res.sendFile(this._options.indexPath ? this._options.indexPath : path.join(this._options.staticDir, 'index.html'))
    })

    this._prerenderer.modifyServer(this, 'post-fallback')

    return new Promise((resolve, reject) => {
      this._nativeServer = server.listen(this._options.server.port, () => {
        resolve()
      })
    })
  }

  destroy () {
    this._nativeServer.close()
  }
}

module.exports = Server
