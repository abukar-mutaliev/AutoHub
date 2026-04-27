let ioInstance = null;

export function setSocketIo(instance) {
  ioInstance = instance;
}

export function getIo() {
  return ioInstance;
}
