let cont = 1
module.exports = (req, res, next) => {
  const { body } = req

  if ( req.headers.authorization !== 'token 123456') {
    res.status(401).jsonp({
      detail: "Invalid token"
    })
  } else {
    const results = { ...body, id: cont }
    res.status(201).jsonp({
      results: results
    })
  }
}
