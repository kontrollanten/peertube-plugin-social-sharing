import twitterIcon from '../assets/images/twitter.svg'
import facebookIcon from '../assets/images/facebook.svg'
import gabIcon from '../assets/images/gab.svg'
import linkedinIcon from '../assets/images/linkedin.svg'

let translate

async function register ({ registerHook, peertubeHelpers }) {
  translate = peertubeHelpers.translate

  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ path }) => {
      if (/^\/videos\/watch/.test(path)) {
        onModalOpen(() => {
          createTabObserver({ video: true, playlist: /playlist/.test(path) })
        })
      }

      if (/^\/my-account\/video-playlists/.test(path)) {
        onModalOpen(() => {
          createTabObserver({ playlist: true })
        })
      }
    }
  })
}

async function createButton({ name, sharerLink, inputRef, iconHTML, filters }) {
  const icon = document.createElement('div')
  icon.innerHTML = iconHTML

  const button = document.createElement('a')
  button.target = '_blank'
  button.tabIndex = 0
  const label = await translate('Share on')
  button.title = `${label} ${name}`
  button.classList.add('video-sharing', name.toLowerCase())
  button.appendChild(icon)
  button.innerHTML += name

  const getLink = () => {
    const videoLink = inputRef.value
    button.href = sharerLink + videoLink
  }

  getLink()

  filters.forEach(filter => {
    filter.addEventListener('change', getLink)
    filter.addEventListener('input', getLink)
  })

  return button
}

async function displayButtons(type) {
  const modalContainer = document.querySelector(`ngb-modal-window .${type}`)
  // my-input-readonly-copy is for backward compatibility
  const inputToggleHidenElem = modalContainer.querySelector('my-input-toggle-hidden') || modalContainer.querySelector('my-input-readonly-copy')
  const nativeInput = inputToggleHidenElem.querySelector('input')
  const filters = modalContainer.querySelectorAll('my-peertube-checkbox input, my-timestamp-input input')

  // If buttons already injected remove them
  const buttonsContainers = inputToggleHidenElem.parentElement.querySelectorAll('.video-sharing-container')
  buttonsContainers.forEach(buttonsContainer => {
    buttonsContainer.remove()
  })

  const container = document.createElement('div')
  container.classList.add('video-sharing-container')


  const facebookButton = await createButton({
    name: 'Facebook',
    inputRef: nativeInput,
    sharerLink: 'https://www.facebook.com/sharer/sharer.php?display=page&u=',
    iconHTML: facebookIcon,
    filters
  })

  const gabButton = await createButton({
    name: 'Gab',
    inputRef: nativeInput,
    sharerLink: 'https://gab.com/compose?url=',
    iconHTML: gabIcon,
    filters
  })

  const twitterButton = await createButton({
    name: 'Twitter',
    inputRef: nativeInput,
    sharerLink: 'https://twitter.com/intent/tweet?url=',
    iconHTML: twitterIcon,
    filters
  })

  const linkedinButton = await createButton({
    name: 'LinkedIn',
    inputRef: nativeInput,
    sharerLink: 'https://www.linkedin.com/shareArticle?mini=true&url=',
    iconHTML: linkedinIcon,
    filters
  })

  container.appendChild(facebookButton)
  container.appendChild(twitterButton)
  container.appendChild(gabButton)
  container.appendChild(linkedinButton)

  inputToggleHidenElem.parentElement.insertBefore(container, inputToggleHidenElem)
  const copyLabel = document.createElement('label')
  copyLabel.classList.add('share-link')
  copyLabel.innerText = await translate('Share link')
  inputToggleHidenElem.parentElement.insertBefore(copyLabel, inputToggleHidenElem)
}

function onModalOpen (callback) {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      const { type, addedNodes } = mutation

      if (type === 'childList') {
        addedNodes.forEach(addedNode => {
          if (addedNode.localName === 'ngb-modal-window') {
            if (document.querySelector('ngb-modal-window .video') || document.querySelector('ngb-modal-window .playlist')) {
              callback()
            }
          }
        })
      }
    }
  })

  observer.observe(document.body, {
    childList: true
  })
}

function createTabObserver ({ video, playlist }) {
  const runAction = target => {
    const selected = target.getAttribute('aria-selected')

    if (selected) {
      if (video) displayButtons('video')
      if (playlist) displayButtons('playlist')
    }
  }

  const observeTab = async type => {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        const { type, attributeName, target } = mutation

        if ((type === 'attributes') && (attributeName === 'aria-selected') && (target.getAttribute('aria-selected') === 'true')) {
          runAction(target)
        }
      }
    })

    const nav = document.querySelector(`ngb-modal-window .${type} .nav`)
    const tab = nav.querySelectorAll('.nav-link')[0]

    runAction(tab)

    observer.observe(tab, {
      attributes: true
    })
  }

  if (video) observeTab('video')
  if (playlist) observeTab('playlist')
}

export {
  register
}
