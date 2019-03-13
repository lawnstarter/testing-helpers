export function findTestIDInWrapper({ wrapper, testID, findAll = false }) {
  if (findAll) {
    return wrapper.findAll(`[test-id="${testID}"]`);
  }
  return wrapper.find(`[test-id="${testID}"]`);
}

export function flushPromises() {
  return new Promise(resolve => {
    return setImmediate(resolve);
  });
}
