import _ from "lodash";

export function setMockYCoordinates({ inputsState, orderedInputsArray }) {
  const updatedInputsState = _.cloneDeep(inputsState);
  let yCoordinate = 0;
  _.forEach(orderedInputsArray, inputSet => {
    _.forEach(inputSet, input => {
      updatedInputsState[input].yCoordinate = yCoordinate;
    });
    yCoordinate += 10;
  });
  return updatedInputsState;
}

export function findTestIDInWrapper({ wrapper, testID, findAll = false }) {
  if (findAll) {
    return wrapper.findAll(`[testID="${testID}"]`);
  }
  return wrapper.find(`[testID="${testID}"]`);
}

export function flushPromises() {
  return new Promise(resolve => {
    return setImmediate(resolve);
  });
}

export function spyOnActionCreator({ actions, key }) {
  return jest.spyOn(actions, key).mockReturnValue(_.constant(_.noop));
}
