let io = null;

export const setIo = (socketIo) => {
  io = socketIo;
};

export const emitReminder = (payload) => {
  try {
    if (io) {
      io.emit('reminder', payload);
      console.log('Emitted reminder event', payload);
    }
  } catch (err) {
    console.error('Notifier emit error', err);
  }
};
