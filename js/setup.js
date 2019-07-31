/*
global Workspace:true
global throttle:true
global sendOnServer:true
global connectToServer:true
global localStorage:true
global Menu:true
*/
const workspace = new Workspace(document.querySelector('.app'))
const menu = new Menu(workspace.app.querySelector('.menu'))
const trackResize = throttle((event) => {
  workspace.updateClosestPos(menu)
  if (parseInt(menu.container.style.left) > workspace.maximumX) {
    menu.container.style.left = workspace.maximumX + 'px'
  }
  if (parseInt(menu.container.style.top) > workspace.maximumY) {
    menu.container.style.top = workspace.maximumY + 'px'
  }
})
let connection = null
let unmodifiedLink = null

document.addEventListener('DOMContentLoaded', event => {
  workspace.publicationState()
  const url = window.location.href.split('?')
  if (url.length < 2) {
    menu.publicationState()
    unmodifiedLink = window.location.href
    return
  }
  unmodifiedLink = url[0]
  const id = url[1]
  sendOnServer(`https://neto-api.herokuapp.com/pic/${id}`).then((response) => {
    localStorage.setItem('id', response.id)
    menu.сommentingState()
    connectToServer(id)
    workspace.reviewingState(response.url)
    menu.setUpLink(response.id)
    if (response.hasOwnProperty('comments')) {
      for (let comment in response.comments) {
        addCommentFormFromServer(response.comments[comment].left, response.comments[comment].top, response.comments[comment].timestamp, response.comments[comment].message)
      }
    }
  })
  if (localStorage.getItem('mask') !== null) {
    workspace.mask.src = localStorage.getItem('mask')
  }
})

document.addEventListener('mousedown', event => {
  if (event.target === menu.drag) {
    menu.moving.isMoving = true
    workspace.updateClosestPos(menu)
    menu.moving.shiftX = event.pageX - event.target.getBoundingClientRect().left - window.pageXOffset
    menu.moving.shiftY = event.pageY - event.target.getBoundingClientRect().top - window.pageYOffset
  }
})

document.addEventListener('mousemove', event => {
  if (!menu.moving.isMoving) {
    return
  }
  event.preventDefault()
  let newPosX = event.pageX - menu.moving.shiftX
  let newPosY = event.pageY - menu.moving.shiftY
  if (newPosX > workspace.maximumX) {
    newPosX = workspace.maximumX
  }
  if (newPosY > workspace.maximumY) {
    newPosY = workspace.maximumY
  }
  if (newPosX < 0) {
    newPosX = 0
  }
  if (newPosY < 0) {
    newPosY = 0
  }
  menu.container.style.left = newPosX + 'px'
  menu.container.style.top = newPosY + 'px'
})

document.addEventListener('mouseup', event => {
  menu.moving.isMoving = false
})

window.addEventListener('beforeunload', () => {
  localStorage.clear()
})

window.addEventListener('resize', event => trackResize(event))
