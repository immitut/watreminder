const DRINK = '_d',
  CYCLE = '_c',
  REMIND = '_r',
  OK = 'OK',
  NEXT = 'next'

const _1min = 60e3

const getDrinkInfo = _getDrinkInfo()
const { cycle, remind } = _getInitConfig()

window.onload = init

function init() {
  $('drinkBtn').addEventListener('mousemove', (ev) => {
    const { target, offsetX, offsetY } = ev
    target.style.setProperty('--x', offsetX + 'px')
    target.style.setProperty('--y', offsetY + 'px')
  })

  // serviceWorker.register
  if (navigator.serviceWorker !== null) {
    navigator.serviceWorker
      .register('/watreminder/sw.js')
      .then(handleRegistration)
  }
}

function handleRegistration(registration) {
  Notification.requestPermission().then((result) => {
    if (result !== 'granted')
      return console.log('permission:', Notification.permission)
    showNotif()
  })

  $('drinkBtn').onclick = () => {
    updateDrink()
    showNotif()
  }
  let timer = setInterval(showNotif, remind * _1min, 'remind')

  navigator.serviceWorker.addEventListener('message', (e) => {
    switch (e.data) {
      case OK:
        updateDrink()
      case NEXT:
      default:
        setTimeout(() => {
          showNotif('cycle')
          timer = setInterval(showNotif, remind * _1min, 'remind')
        }, cycle * _1min)
        if (!timer) return
        clearInterval(timer)
        timer = null
    }
  })

  function showNotif(type) {
    const [title, body] = createNotif()
    const config = {
      body,
      tag: 'reminder',
      renotify: true,
    }
    if (type)
      config.actions = [
        {
          action: OK,
          title: '吨吨吨',
        },
        {
          action: NEXT,
          title: '并不渴',
        },
      ]
    registration.showNotification(title, config)
  }
}

const updateDrink = () => {
  const [info, update] = getDrinkInfo()
  const now = new Date()
  const key = _getDateKey(now)
  const times = info[key] ? info[key][0] : 0
  info[key] = [times + 1, +now]
  update(info)
}

function createNotif() {
  let title = '😈'
  let msg = `今天还没喝过水呢`
  const [info] = getDrinkInfo()
  const now = new Date()
  const [times, lastTime] = info[_getDateKey(now)] || [0, null]
  if (times) {
    const during = (now - lastTime) / _1min
    title = times > 9 ? '🎉🎉🎉👏👏👏' : new Array(times).fill('💧').join('')
    msg = `今天已经喝过 ${times} 次水了`
    if (during > 1) msg += `\n距离上一次已经过了 ${during.toFixed(1)} 分钟`
  }
  msg = `[${_getTime(now)}]\n${msg}`
  return [title, msg]
}

function _getItem(key = DRINK) {
  const data = localStorage.getItem(key)
  return data ? (typeof data === 'number' ? data : JSON.parse(data)) : null
}

function _setItem(key, data) {
  localStorage.setItem(
    key,
    typeof data === 'object' ? JSON.stringify(data) : data
  )
}

function _getDateKey(now) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

function _getDrinkInfo() {
  let data = null
  return () => {
    if (!data) {
      data = _getItem() || {}
    }
    return [
      data,
      (value) => {
        _setItem(DRINK, value)
      },
    ]
  }
}

function _getInitConfig() {
  const cycle = _getItem(CYCLE)
  const remind = _getItem(REMIND)
  return {
    cycle: _isPositiveNum(cycle) ? cycle : 30,
    remind: _isPositiveNum(remind) ? remind : 3,
  }
}

function _isPositiveNum(n) {
  return typeof n === 'number' && !isNaN(n) && n > 0
}

function _getTime(date) {
  const min = date.getMinutes()
  return `${date.getHours()}:${min < 10 ? '0' + min : min}`
}

function $(id) {
  return document.getElementById(id)
}
