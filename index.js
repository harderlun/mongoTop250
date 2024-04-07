const Koa = require('koa')
const router = require('koa-router')()
const app = new Koa()
const Top250Model = require('./models/top250')
const cors = require('koa2-cors')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')
const path = require('path')
const { log } = require('console')
const static = require('koa-static')
const fs = require('fs')

router.get('/top250', async (ctx) => {
  var { start, limit } = ctx.query
  if (start == undefined) {
    start = 0
  }
  if (limit == undefined) {
    limit = 5
  }
  var data = await Top250Model.find().skip(Number(start)).limit(Number(limit))
  var total = await Top250Model.find().count()

  ctx.body = {
    code: 200,
    res: data,
    total,
    msg: 'GET /top success',
  }
})

// 实现收藏
router.post('/collect', async (ctx) => {
  var id = ctx.request.body.id
  var res = await Top250Model.updateOne({ _id: id }, { collected: true })
  if (res.nModified) {
    ctx.body = {
      code: 200,
      msg: '收藏成功',
    }
  } else {
    ctx.body = {
      code: 400,
      msg: 'warning 请勿重复收藏',
    }
  }
})
// 取消收藏
router.post('/collect/cancel', async (ctx) => {
  var id = ctx.request.body.id
  var res = await Top250Model.updateOne({ _id: id }, { collected: false })
  if (res.nModified) {
    ctx.body = {
      code: 200,
      msg: '取消收藏',
    }
  } else {
    ctx.body = {
      code: 400,
      msg: 'warning 已经取消收藏，不可重复操作',
    }
  }
})
// 删除
router.post('/delete', async (ctx) => {
  var id = ctx.request.body.id
  var res = await Top250Model.deleteOne({ _id: id })
  if (res.deletedCount) {
    ctx.body = {
      code: 200,
      msg: '删除成功',
    }
  }
})
router.post('/doAdd', async (ctx) => {
  var { title, slogo, evaluate, rating, labels, collected } = ctx.request.body
  const file = ctx.request.files.file
  const basename = path.basename(file.path)
  /* 1.将本地图片存到服务器 */
  // 创建可读流
  const reader = fs.createReadStream(file.path)
  // 获取上传文件扩展名
  let filePath = process.cwd() + `/static/${basename}`
  // 创建可写流
  const upStream = fs.createWriteStream(filePath)
  // 可读流通过管道写入可写流
  reader.pipe(upStream)
  /* 2.将服务器上的图片地址存入数据库 */
  var pic = `${ctx.origin}/${basename}`
  var data = new Top250Model({
    title,
    pic,
    slogo,
    evaluate,
    rating,
    labels,
    collected: Boolean(collected),
  })
  try {
    await data.save()
    ctx.body = {
      code: 200,
      msg: '添加成功',
    }
  } catch (error) {
    ctx.body = {
      code: 500,
      msg: '添加失败',
      error: error.message,
    }
  }
})

app.use(
  koaBody({
    // 支持文件格式
    multipart: true,
    formidable: {
      maxFileSize: 200 * 1024 * 1024,
      // 保留文件扩展名
      keepExtensions: true,
    },
  })
)

app.use(static(`${process.cwd()}/static`))
app.use(bodyParser())
app.use(cors())
app.use(router.routes())
app.listen(8080)
