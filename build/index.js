"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setMockYCoordinates = setMockYCoordinates;
exports.spyOnActionCreator = spyOnActionCreator;
exports.removeActionCreatorSpy = removeActionCreatorSpy;
exports.createMockGetParamWithTestParamsReference = createMockGetParamWithTestParamsReference;
exports.findTestIDInWrapper = findTestIDInWrapper;
exports.flushPromises = flushPromises;

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// RN helpers
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

function spyOnActionCreator(_ref2) {
  var actions = _ref2.actions,
      key = _ref2.key;
  return jest.spyOn(actions, key).mockReturnValue(_lodash["default"].constant(_lodash["default"].noop));
}

function removeActionCreatorSpy(_ref3) {
  var actions = _ref3.actions,
      key = _ref3.key;

  if (_lodash["default"].isFunction(_lodash["default"].get(actions, "".concat(key, ".mockRestore")))) {
    actions[key].mockRestore();
  }
}

function createMockGetParamWithTestParamsReference(_ref4) {
  var testParams = _ref4.testParams;
  return function (key, fallback) {
    return _lodash["default"].get(testParams, key, fallback);
  };
} // Shared helpers


function findTestIDInWrapper(_ref5) {
  var wrapper = _ref5.wrapper,
      testID = _ref5.testID,
      _ref5$findAll = _ref5.findAll,
      findAll = _ref5$findAll === void 0 ? false : _ref5$findAll,
      _ref5$attribute = _ref5.attribute,
      attribute = _ref5$attribute === void 0 ? null : _ref5$attribute;
  // eslint-disable-next-line no-undef, no-param-reassign
  attribute = attribute || _lodash["default"].get(window, 'process.env.VUE_APP_TITLE') ? 'test-id' : 'testID';

  if (findAll) {
    return wrapper.findAll("[".concat(attribute, "=\"").concat(testID, "\"]"));
  } // eslint-disable-next-line lodash/prefer-lodash-method


  return wrapper.find("[".concat(attribute, "=\"").concat(testID, "\"]"));
}

function flushPromises() {
  return new Promise(function (resolve) {
    return setImmediate(resolve);
  });
}