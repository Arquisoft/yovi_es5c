const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const port = process.env.PORT || 8000

const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3000';

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('combined'))

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 })
app.use(limiter)

// Health
app.get('/health', (req, res) => res.json({ ok: true, service: 'gateway' }))

// Direct endpoint proxy example for legacy routes
app.post('/createuser', createProxyMiddleware({
  target: userServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/createuser': '/createuser' },
  onProxyReq: (proxyReq, req) => {
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body)
      proxyReq.setHeader('Content-Type', 'application/json')
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
      proxyReq.write(bodyData)
    }
  }
}))


app.listen(port, () => console.log(`Gateway listening on ${port}`))
