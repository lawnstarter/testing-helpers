"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setMockYCoordinates = setMockYCoordinates;
exports.findTestIDInWrapper = findTestIDInWrapper;
exports.flushPromises = flushPromises;
exports.spyOnActionCreator = spyOnActionCreator;

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function setMockYCoordinates(_ref) {
  var inputsState = _ref.inputsState,
      orderedInputsArray = _ref.orderedInputsArray;

  var updatedInputsState = _lodash["default"].cloneDeep(inputsState);

  var yCoordinate = 0;

  _lodash["default"].forEach(orderedInputsArray, function (inputSet) {
    _lodash["default"].forEach(inputSet, function (input) {
      updatedInputsState[input].yCoordinate = yCoordinate;
    });

    yCoordinate += 10;
  });

  return updatedInputsState;
}

function findTestIDInWrapper(_ref2) {
  var wrapper = _ref2.wrapper,
      testID = _ref2.testID,
      _ref2$findAll = _ref2.findAll,
      findAll = _ref2$findAll === void 0 ? false : _ref2$findAll;

  if (findAll) {
    return wrapper.findAll("[testID=\"".concat(testID, "\"]"));
  }

  return wrapper.find("[testID=\"".concat(testID, "\"]"));
}

function flushPromises() {
  return new Promise(function (resolve) {
    return setImmediate(resolve);
  });
}

function spyOnActionCreator(_ref3) {
  var actions = _ref3.actions,
      key = _ref3.key;
  return jest.spyOn(actions, key).mockReturnValue(_lodash["default"].constant(_lodash["default"].noop));
}