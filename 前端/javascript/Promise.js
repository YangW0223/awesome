class Promise {
  state = 'pending';
  callbacks = [];
  result = null;

  constructor(cb) {
    cb(this.resolve_, this.reject_);
  }


  handle2state = (callback) => {
    if (this.state === 'pending') {
      this.callbacks.push({
        resolve, reject,
        onFulfilled, onRejected
      });
      return;
    }
    let cb = this.state === 'fulfilled' ? callback.onFulfilled : callback.onRejected;
    if (!cb) {
      cb = this.state === 'fulfilled' ? resolve : reject;
      cb(this.value)
      return;
    }

    let result = null;
    try {
      result = cb(this.value);
      cb = this.state === 'fulfilled' ? resolve : reject;
    } catch (error) {
      result = error;
      cb = callback.reject;
    } finally {
      cb(result);
    }
  }

  resolve_ = (value) => {
    if (typeof value === 'function' || typeof value === 'object') {
      const then = value.then;
      if (typeof then === 'function') {
        then.call(value, this.resolve_, this.reject_)
        return;
      }
    }

    this.state = 'fulfilled';
    this.value = value;
    this.callbacks.forEach(cb => handle2state(cb));
  }

  reject_ = (error) => {
    this.state = 'rejected';
    this.value = error;
    this.callbacks.forEach(cb => handle2state(cb));
  }

  then = (onFulfilled, onRejected) => {
    return new this.constructor((resolve, reject) => {
      this.handle2state({
        resolve, reject,
        onFulfilled, onRejected
      });
    });
  }

  catch = (onRejected) => {
    return this.then(null, onRejected);
  }

  finally = (onDone) => {
    if (typeof onDone !== 'function') return this.then();
    const Promise = this.constructor;
    return this.then(
      (value) => Promise.resolve(onDone()).then(() => value),
      (error) => Promise.resolve(onDone()).then(() => { throw error }),
    )
  }

  static resolve(value) {
    if (value instanceof this.constructor) {
      return value;
    } else if (value && typeof value === 'object' && typeof value.then === 'function') {
      return new this.constructor((resolve) => value.then(resolve));
    } else if (value) {
      return new this.constructor((resolve) => resolve(value));
    } else {
      return new this.constructor((resolve) => resolve());
    }
  }

  static reject(value) {
    return new this.constructor((_, reject) => reject(value));
  }

  static all(promises) {
    return new this.constructor((resolve, reject) => {
      const len_promises = promises.length;
      const fulfilled_count = 0;
      const results = Array.from({ length: len_promises });
      promises.forEach((promise, index) => {
        this.constructor.resolve(promise)
          .then(value => {
            fulfilled_count++;
            results[index] = value;
            if (len_promises === fulfilled_count) resolve(results);
          })
          .catch(error => reject(error))
      });
    });
  }

  static race() {
    return new this.constructor((resolve, reject) => {
      promises.forEach((promise, index) => {
        this.constructor.resolve(promise)
          .then(value => resolve(value))
          .catch(error => reject(error))
      });
    });
  }
}