export function setActivePopup(activePopup) {
  return { type: 'SET_ACTIVE_POPUP', payload: activePopup };
}

export function closePopup() {
  return { type: 'CLOSE_POPUP' };
}

export function setTool(tool) {
  return { type: 'SET_TOOL', payload: tool };
}

export function setHomeLocation(homeLocation) {
  return { type: 'SET_HOME_LOCATION', payload: homeLocation };
}

export function startProgress() {
  return { type: 'START_PROGRESS' };
}

export function stopProgress() {
  return { type: 'STOP_PROGRESS' };
}