const noConfig = !_getItem()
if (noConfig) {
  let deferredPrompt

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    const banner = document.getElementById('banner')
    banner.style.display = 'block'
    window.addEventListener('appinstalled', () => {
      banner.style.display = 'none'
    })
    banner.onclick = () => {
      banner.style.display = 'none'
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
        } else {
          console.log('User dismissed the A2HS prompt')
        }
        deferredPrompt = null
      })
    }
  })
}
