module.exports = function(max, timeSpan, debug = false) {
  return {
    max,
    timeSpan,
    triggeredInTimeSpan: 0,
    // todo make sure callbacks are called in order of arrival
    queue(callback) {
      return new Promise(async resolve => {
        if (debug && this.triggeredInTimeSpan >= max)
          console.log('waiting for slot')
        while (this.triggeredInTimeSpan >= max) await sleep(100)

        this.triggeredInTimeSpan++
        debug &&
          console.log(
            'used slot:',
            this.triggeredInTimeSpan,
            '/',
            this.max,
            'per',
            Math.round(this.timeSpan / 1000),
            'seconds',
          )
        setTimeout(() => {
          this.triggeredInTimeSpan--
          debug &&
            console.log(
              'slot freed,',
              this.max - this.triggeredInTimeSpan,
              'left',
            )
        }, timeSpan)

        const data = await callback()

        resolve(data)
      })
    },
  }
}

const sleep = milliseconds => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
