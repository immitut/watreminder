const DRINK = '_d',
  CYCLE = '_c',
  REMIND = '_r',
  OK = 'OK',
  NEXT = 'next',
  MAXCOUNT = 15

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

  initRender()
  _intersectionObserver()

  if ('serviceWorker' in navigator) {
    // serviceWorker.register
    try {
      navigator.serviceWorker
        .register('/watreminder/sw.js')
        .then(handleRegistration)
    } catch (err) {
      console.log('register error', err)
    }
  }
}

function handleRegistration(registration) {
  const setTimer = () => setInterval(showNotif, remind * _1min, 'remind')
  let timer = setTimer()

  $('drinkBtn').onclick = () => {
    addNewItem()
    showNotif()
    handleTimer()
  }

  navigator.serviceWorker.addEventListener('message', (e) => {
    switch (e.data) {
      case OK:
        addNewItem()
      case NEXT:
      default:
        handleTimer()
    }
  })

  function showNotif(type) {
    const [title, body] = createNotif()
    const config = {
      body,
      icon: '/watreminder/icon/favicon.ico',
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
    registration.showNotification(title, config).catch(async () => {
      const result = await Notification.requestPermission()
      if (result !== 'granted') return console.log('通知权限:', result)
      showNotif()
    })
  }

  function handleTimer() {
    setTimeout(() => {
      showNotif('cycle')
      timer = setTimer()
    }, cycle * _1min)
    if (!timer) return
    clearInterval(timer)
    timer = null
  }
}

const addNewItem = (now = new Date()) => {
  const [info, update] = getDrinkInfo()
  const key = _getDateKey(now)
  let todayDrinkInfo = []
  if (info.has(key)) {
    todayDrinkInfo = info.get(key)
    const newItem = renderItem(_getTime(now, true))
    const lastList = document.querySelector('.list')
    lastList.insertBefore(newItem, lastList.firstChild)
  } else {
    const fragment = renderTimeInfo(key, [now])
    $('list').insertBefore(fragment, $('list').firstChild)
  }
  scrollTop()
  // newItem.scrollIntoView(false)
  todayDrinkInfo.push(+now)
  info.set(key, todayDrinkInfo)
  update(info)
}

function createNotif(now = new Date()) {
  let title = '😈'
  let msg = `今天还没喝过水呢`
  const [info] = getDrinkInfo()
  const todayDrinkInfo = info.get(_getDateKey(now)) || []
  if (todayDrinkInfo.length) {
    const { length } = todayDrinkInfo
    const lastTime = todayDrinkInfo[length - 1]
    const during = (now - lastTime) / _1min
    title = length > 9 ? '🎉🎉🎉👏👏👏' : new Array(length).fill('💧').join('')
    msg = `今天已经喝过 ${length} 次水了`
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
  const m = timeFix(now.getMonth() + 1)
  const d = timeFix(now.getDate())
  return `${now.getFullYear()}.${m}.${d}`
}

function _getDrinkInfo() {
  let data = null
  return () => {
    if (!data) {
      try {
        data = new Map(_getItem())
      } catch (err) {
        console.error('读取数据类型异常')
        data = new Map()
      }
    }
    return [
      data,
      (newData) => {
        // 数据存储上限15条
        if (newData.size > MAXCOUNT) {
          const [firstKey] = Array.from(newData)[0]
          newData.delete(firstKey)
        }
        _setItem(DRINK, Array.from(newData))
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

function _getTime(date, showSecond = false) {
  const res = `${timeFix(date.getHours())}:${timeFix(date.getMinutes())}`
  return showSecond ? res + `:${timeFix(date.getSeconds())}` : res
}

function timeFix(n) {
  return `0${n}`.slice(-2)
}

function initRender() {
  const [info] = getDrinkInfo()
  const fragment = document.createDocumentFragment()
  info.forEach((data, title) => {
    const temp = renderTimeInfo(title, data)
    fragment.insertBefore(temp, fragment.firstChild)
  })
  $('list').appendChild(fragment)
}

function scrollTop() {
  document.querySelector('.timeTitle').scrollIntoView(false)
}

function renderTimeInfo(title, data) {
  const box = document.createElement('div')
  box.className = 'info'
  const itemTitle = renderTitle(title)
  const ulElm = renderList(data)
  box.append(itemTitle)
  box.append(ulElm)
  return box
}

function renderList(data) {
  const ul = document.createElement('ul')
  ul.className = 'list'
  data.forEach((t) => {
    const elm = renderItem(_getTime(new Date(t), true))
    ul.insertBefore(elm, ul.firstChild)
  })
  return ul
}

function renderTitle(text) {
  const fragment = document.createDocumentFragment()
  const item = document.createElement('label')
  item.setAttribute('for', text)
  item.className = 'timeTitle'
  item.innerText = text
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.id = text
  fragment.append(item)
  fragment.append(checkbox)
  return fragment
}

function renderItem(text) {
  const item = document.createElement('li')
  item.className = 'timeItem'
  item.innerText = text
  return item
}

function _intersectionObserver() {
  const firstChild = document.querySelector('.timeTitle')
  if (!firstChild) return
  const intersectionObserver = new IntersectionObserver((entries) => {
    const { intersectionRatio } = entries[0]
    if (intersectionRatio === 0) {
      document.querySelector('.nav').classList.add('shadow')
    } else {
      document.querySelector('.nav').classList.remove('shadow')
    }
  })

  intersectionObserver.observe(firstChild)
}

function $(id) {
  return document.getElementById(id)
}
