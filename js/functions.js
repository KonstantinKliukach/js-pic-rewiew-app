/*
global workspace:true
global CommentForm:true
global commentJSEngine:true
global commentFormTemplate:true
global FormData:true
global localStorage:true
global fetch:true
global connection:true
global menu:true
global WebSocket:true
global unmodifiedLink:true
*/
function deleteEmptyForm (container) {
  const comment = container.querySelector('.comment')
  if (comment === null) {
    container.remove()
  } else {
    const form = new CommentForm(container)
    form.marker.checked = false
  }
}

function addCommentForm (event) {
  workspace.toggleActiveComments()
  let newCommentForm = commentJSEngine(commentFormTemplate(), event.pageX, event.pageY)
  newCommentForm = new CommentForm(newCommentForm)
  newCommentForm.defaultState()
  newCommentForm.registerEvents()
  workspace.app.appendChild(newCommentForm.form)
  workspace.forms.push(newCommentForm.form)
}

function addCommentFormFromServer (x, y, time, text) {
  workspace.toggleActiveComments()
  let newCommentForm = commentJSEngine(commentFormTemplate(), x, y)
  newCommentForm = new CommentForm(newCommentForm)
  newCommentForm.addComment(time, text)
  newCommentForm.registerEvents()
  workspace.app.appendChild(newCommentForm.form)
  workspace.forms.push(newCommentForm.form)
}

function startDraw (event) {
  event.preventDefault()
  workspace.isDrawing = true
  draw(event.pageX, event.pageY, false)
}

function stopDraw (event) {
  event.preventDefault()
  workspace.isDrawing = false
  workspace.canvas.toBlob(img => connection.send(img))
}

function leavingCanvas (event) {
  event.preventDefault()
  workspace.isDrawing = false
}

function drawing (event) {
  event.preventDefault()
  if (workspace.isDrawing) {
    draw(event.pageX, event.pageY, true)
  }
}

function draw (x, y, isDown) {
  if (isDown) {
    workspace.ctx.beginPath()
    workspace.ctx.strokeStyle = workspace.brushColor
    workspace.ctx.lineWidth = workspace.brushSize
    workspace.ctx.lineJoin = 'round'
    workspace.ctx.lineCap = 'round'
    workspace.ctx.moveTo(workspace.lastX, workspace.lastY)
    workspace.ctx.lineTo(x, y)
    workspace.ctx.closePath()
    workspace.ctx.stroke()
  }
  workspace.lastX = x
  workspace.lastY = y
}

function loadFile (event) {
  let files = []
  if (this.tagName === 'INPUT') {
    files = this.files
  } else {
    files = Array.from(event.dataTransfer.files)
    if (workspace.img.style.display !== 'none') {
      workspace.error.style.display = 'block'
      workspace.showError('Чтобы загрузить новое сообщение воспользуйтесь пунктом "Загрузить новое" в меню')
      return
    }
  }

  const imageTypeRegExp = /^image\//

  if (imageTypeRegExp.test(files[0].type)) {
    workspace.hideError()
    const formData = new FormData()
    formData.append('title', files[0].name)
    formData.append('image', files[0])
    workspace.showLoader()
    sendOnServer('https://neto-api.herokuapp.com/pic', {
      method: 'POST',
      body: formData
    }).then((response) => {
      localStorage.setItem('id', response.id)
      workspace.reviewingState(response.url)
      menu.setUpLink(response.id)
      menu.shareState()
      window.history.pushState(localStorage.getItem('id'), `${response.id}`, `${unmodifiedLink}?${response.id}`)
      // window.history.pushState(response.id, `${response.id}`, `${response.id}`)
      connectToServer(response.id)
    })
      .catch(error => {
        workspace.hideLoader()
        console.log(error)
        workspace.showError('Ошибка загрузки на сервер. приносим свои извинения')
      })
  } else {
    workspace.showError('Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png')
  }
}

function sendOnServer (url, data) {
  return fetch(url, data)
    .then(res => {
      return res.json()
    })
}

function connectToServer (id) {
  connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${id}`)
  connection.addEventListener('open', () => {
    console.log('Вебсокет-соединение открыто')
  })
  connection.addEventListener('message', event => {
    const msg = JSON.parse(event.data)
    if (msg.event === 'comment') {
      workspace.getCommentFromServer(msg.comment.left, msg.comment.top, msg.comment.timestamp, msg.comment.message)
    }
    if (msg.event === 'mask') {
      workspace.updateMask(msg.url)
    }
  })
  connection.addEventListener('error', error => {
    console.log(`Произошла ошибка: ${error.data}`)
  })
}

function throttle (callback) {
  let isWaiting = false
  return function () {
    if (!isWaiting) {
      callback.apply(this, arguments)
      isWaiting = true
      requestAnimationFrame(() => {
        isWaiting = false
      })
    }
  }
}

function menuCollapseHandler (menu) {
  workspace.updateClosestPos(menu)
  if (parseInt(menu.container.style.left) > workspace.maximumX) {
    menu.container.style.left = workspace.maximumX + 'px'
  }
  if (parseInt(menu.container.style.top) > workspace.maximumY) {
    menu.container.style.top = workspace.maximumY + 'px'
  }
}
