const asyncHandler = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
    // fn là 1 hàm async nên trả về 1 promise
    // => ta có thể dùng then() hoặc catch()
    // do then() là theo xử lý đúng nên dùng catch() để chuyển lỗi
  }
}

module.exports = {
  asyncHandler,
}
