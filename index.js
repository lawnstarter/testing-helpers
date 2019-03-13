"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findTestIDInWrapper = findTestIDInWrapper;
exports.flushPromises = flushPromises;

function findTestIDInWrapper(_ref) {
  var wrapper = _ref.wrapper,
    testID = _ref.testID,
    _ref$findAll = _ref.findAll,
    findAll = _ref$findAll === void 0 ? false : _ref$findAll;

  if (findAll) {
    return wrapper.findAll('[test-id="'.concat(testID, '"]'));
  }

  return wrapper.find('[test-id="'.concat(testID, '"]'));
}

function flushPromises() {
  return new Promise(function(resolve) {
    return setImmediate(resolve);
  });
}
