let deferredPrompt

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  const banner = document.getElementById('banner')
  if (_getItem()) banner.style.display = 'none'
  window.addEventListener('appinstalled', () => {
    banner.style.display = 'none'
  })
  banner.onclick = () => {
    banner.style.display = 'none'
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null
    })
  }
})
