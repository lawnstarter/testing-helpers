import _ from 'lodash';

// RN helpers
export function setMockYCoordinates({ inputsState, orderedInputsArray }) {
    const updatedInputsState = _.cloneDeep(inputsState);
    let yCoordinate = 0;
    _.forEach(orderedInputsArray, (inputSet) => {
        _.forEach(inputSet, (input) => {
            updatedInputsState[input].yCoordinate = yCoordinate;
        });
        yCoordinate += 10;
    });
    return updatedInputsState;
}

export function spyOnActionCreator({ actions, key }) {
    return jest.spyOn(actions, key).mockReturnValue(_.constant(_.noop));
}

export function removeActionCreatorSpy({ actions, key }) {
    if (_.isFunction(_.get(actions, `${key}.mockRestore`))) {
        actions[key].mockRestore();
    }
}

export function createMockGetParamWithTestParamsReference({ testParams }) {
    return (key, fallback) => {
        return _.get(testParams, key, fallback);
    };
}

// Shared helpers
export function findTestIDInWrapper({ wrapper, testID, findAll = false, attribute = null }) {
    // eslint-disable-next-line no-undef, no-param-reassign
    attribute = attribute || _.get(window, 'process.env.VUE_APP_TITLE') ? 'test-id' : 'testID';

    if (findAll) {
        return wrapper.findAll(`[${attribute}="${testID}"]`);
    }
    // eslint-disable-next-line lodash/prefer-lodash-method
    return wrapper.find(`[${attribute}="${testID}"]`);
}

export function flushPromises() {
    return new Promise((resolve) => {
        return setImmediate(resolve);
    });
}
