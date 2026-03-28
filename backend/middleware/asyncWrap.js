module.exports = function asyncWrap(fn) {
  return function wrappedAsyncHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
