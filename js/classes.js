/*
global workspace:true
global Image:true
global unmodifiedLink:true
global menuCollapseHandler:true
global loadFile:true
global addCommentForm:true
global startDraw:true
global stopDraw:true
global drawing:true
global leavingCanvas:true
global addCommentFormFromServer:true
global deleteEmptyForm:true
global localStorage:true
global commentJSEngine:true
global commentTemplate:true
global loaderTemplate:true
global sendOnServer:true
*/
class Menu {
  constructor (container) {
    this.container = container
    this.drag = container.querySelector('.drag')
    this.burger = container.querySelector('.burger')
    this.new = container.querySelector('.new')
    this.comments = container.querySelector('.mode.comments')
    this.draw = container.querySelector('.mode.draw')
    this.share = container.querySelector('.mode.share')
    this.tools = container.querySelectorAll('.tool')
    this.state = ''
    this.width = 0
    this.height = 0
    this.moving = {
      isMoving: false,
      shiftX: 0,
      shiftY: 0
    }
    this.registerEvents()
  }
  registerEvents () {
    this.new.addEventListener('click', this.loadFile.bind(this))
    this.comments.addEventListener('click', this.сommentingState.bind(this))
    this.burger.addEventListener('click', this.reviewingState.bind(this))
    this.share.addEventListener('click', this.shareState.bind(this))
    this.draw.addEventListener('click', this.drawingState.bind(this))
  }
  publicationState () {
    this.burger.style.display = 'none'
    this.comments.style.display = 'none'
    this.draw.style.display = 'none'
    this.share.style.display = 'none'
    this.state = 'default'
    this.updateSize()
  }
  сommentingState () {
    this.new.style.display = 'none'
    this.draw.style.display = 'none'
    this.share.style.display = 'none'
    this.burger.style.display = 'inline-block'
    this.comments.style.display = 'inline-block'
    this.state = 'сommentingState'
    this.tools.forEach(tool => {
      if (tool.classList.contains('comments-tools')) {
        tool.style.display = 'inline-block'
        const commentsOn = tool.querySelector('#comments-on')
        commentsOn.addEventListener('change', () => {
          workspace.showAllComments()
        })
        const commentsOff = tool.querySelector('#comments-off')
        commentsOff.addEventListener('change', () => {
          workspace.hideAllComments()
        })
      }
    })
    workspace.state = 'сommentingState'
    workspace.handleState()
    this.updateSize()
  }
  shareState (id) {
    this.new.style.display = 'none'
    this.comments.style.display = 'none'
    this.draw.style.display = 'none'
    this.burger.style.display = 'inline-block'
    this.share.style.display = 'inline-block'
    this.state = 'shareState'
    this.tools.forEach(tool => {
      if (tool.classList.contains('share-tools')) {
        tool.style.display = 'inline-block'
        const copyButton = tool.querySelector('.menu_copy')
        copyButton.addEventListener('click', (event) => {
          navigator.clipboard.writeText(tool.firstElementChild.value)
            .then(() => {
              console.log('Копирование ссылки завершено успешно')
            })
            .catch(err => {
              console.log('Что-то пошло не так', err)
            })
        })
      }
    })
    workspace.state = ''
    workspace.handleState()
    this.updateSize()
  }
  setUpLink (id) {
    this.tools.forEach(tool => {
      if (tool.classList.contains('share-tools')) {
        tool.firstElementChild.value = `${unmodifiedLink}?${id}`
      }
    })
  }
  reviewingState () {
    this.burger.style.display = 'none'
    this.new.style.display = 'inline-block'
    this.comments.style.display = 'inline-block'
    this.draw.style.display = 'inline-block'
    this.share.style.display = 'inline-block'
    this.state = 'reviewingState'
    this.tools.forEach(tool => {
      tool.style.display = 'none'
    })
    workspace.state = ''
    workspace.handleState()
    this.updateSize()
  }
  drawingState () {
    this.new.style.display = 'none'
    this.comments.style.display = 'none'
    this.share.style.display = 'none'
    this.burger.style.display = 'inline-block'
    this.draw.style.display = 'inline-block'
    this.state = 'drawingState'
    this.tools.forEach(tool => {
      if (tool.classList.contains('draw-tools')) {
        tool.style.display = 'inline-block'
        const colors = tool.querySelectorAll('.menu__color')
        colors.forEach(color => {
          color.addEventListener('change', (event) => {
            workspace.setUpBrush(event.target.value)
          })
        })
      }
    })
    workspace.state = 'drawingState'
    workspace.handleState()
    this.updateSize()
  }
  updateSize () {
    const rect = this.container.getBoundingClientRect()
    this.width = Math.ceil(rect.width)
    this.height = Math.ceil(rect.height)
    if (this.state === 'default' && this.width < 143) {
      this.width = 143
    }
    if (this.state === 'сommentingState' && this.width < 471) {
      this.width = 471
    }
    if (this.state === 'shareState' && this.width < 708) {
      this.width = 708
    }
    if (this.state === 'reviewingState' && this.width < 519) {
      this.width = 519
    }
    if (this.state === 'drawingState' && this.width < 396) {
      this.width = 396
    }
    menuCollapseHandler(this)
  }
  loadFile () {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.addEventListener('change', loadFile)
    input.click()
  }
}

class Workspace {
  constructor (container) {
    this.app = container
    this.img = container.querySelector('.current-image')
    this.error = container.querySelector('.error')
    this.loader = container.querySelector('.image-loader')
    this.canvas = null
    this.ctx = null
    this.mask = null
    this.maximumX = 0
    this.maximumY = 0
    this.state = ''
    this.isDrawing = false
    this.brushSize = 4
    this.brushColor = '#6cbe47'
    this.forms = []
    this.lastX = ''
    this.lastY = ''
    this.registerEvents()
  }
  registerEvents () {
    this.app.addEventListener('dragover', event => event.preventDefault())
    this.app.addEventListener('drop', this.dropFile.bind(this))
    this.img.addEventListener('load', () => {
      this.hideLoader()
      this.img.style.display = 'block'
    })
  }
  dropFile (event) {
    event.preventDefault()
    loadFile(event)
  }
  showError (errorText) {
    const message = this.error.querySelector('.error__message')
    this.error.style.display = 'block'
    message.textContent = errorText
  }
  hideError () {
    this.error.style.display = 'none'
  }

  showLoader () {
    this.loader.style.display = 'block'
  }
  hideLoader () {
    this.loader.style.display = 'none'
  }
  publicationState () {
    this.img.src = ''
    this.img.style.display = 'none'
    this.deteleAllComments()
  }
  reviewingState (url) {
    this.img.src = url
    this.deteleAllComments()
    this.setUpCanvas()
    this.setUpMask()
  }
  handleState () {
    switch (this.state) {
      case 'сommentingState':
        this.img.addEventListener('click', addCommentForm)
        this.img.removeEventListener('mousedown', startDraw)
        this.img.removeEventListener('mouseup', stopDraw)
        this.img.removeEventListener('mouseleave', leavingCanvas)
        this.img.removeEventListener('mousemove', drawing)
        break
      case 'drawingState':
        this.img.removeEventListener('click', addCommentForm)
        this.img.addEventListener('mousedown', startDraw)
        this.img.addEventListener('mouseup', stopDraw)
        this.img.addEventListener('mouseleave', leavingCanvas)
        this.img.addEventListener('mousemove', drawing)
        break
      case '':
        this.img.removeEventListener('click', addCommentForm)
        this.img.removeEventListener('mousedown', startDraw)
        this.img.removeEventListener('mouseup', stopDraw)
        this.img.removeEventListener('mouseleave', leavingCanvas)
        this.img.removeEventListener('mousemove', drawing)
        break
    }
  }
  getCommentFromServer (x, y, time, text) {
    for (let form of this.forms) {
      if (form.offsetLeft === x && form.offsetTop === y) {
        form = new CommentForm(form)
        form.addComment(time, text)
        form.activeState()
        return
      }
    }
    addCommentFormFromServer(x, y, time, text)
  }
  toggleActiveComments () {
    const commentForms = this.app.querySelectorAll('.comments__form')
    commentForms.forEach(commentForm => {
      deleteEmptyForm(commentForm)
    })
  }
  hideAllComments () {
    const commentForms = this.app.querySelectorAll('.comments__form')
    commentForms.forEach(commentForm => {
      commentForm.style.display = 'none'
    })
  }
  showAllComments () {
    const commentForms = this.app.querySelectorAll('.comments__form')
    commentForms.forEach(commentForm => {
      commentForm.style.display = 'block'
    })
  }
  deteleAllComments () {
    const comments = this.app.querySelectorAll('.comments__form')
    comments.forEach(comment => {
      comment.remove()
    })
  }
  updateClosestPos (menu) {
    this.maximumX = Math.floor(this.app.offsetWidth - menu.width)
    this.maximumY = Math.floor(this.app.offsetHeight - menu.height)
  }
  setUpCanvas () {
    if (this.canvas !== null) {
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.position = 'absolute'
    canvas.style.top = '0px'
    canvas.style.left = '0px'
    canvas.style.zIndex = '2'
    canvas.style.pointerEvents = 'none'
    canvas.classList.add('canvas')
    this.app.insertBefore(canvas, this.img)
    this.canvas = this.app.querySelector('.canvas')
    this.ctx = this.canvas.getContext('2d')
  }
  setUpMask () {
    if (this.mask !== null) {
      this.mask.remove()
    }
    const mask = document.createElement('img')
    mask.style.position = 'absolute'
    mask.style.top = '0px'
    mask.style.left = '0px'
    mask.style.zIndex = '1'
    mask.style.pointerEvents = 'none'
    mask.crossOrigin = 'anonymous'
    mask.classList.add('mask')
    this.app.insertBefore(mask, this.canvas)
    this.mask = this.app.querySelector('.mask')
    this.mask.addEventListener('load', () => {
      this.clearCanvas()
    })
  }
  setUpBrush (color) {
    switch (color) {
      case 'red':
        this.brushColor = '#ea5d56'
        break
      case 'yellow':
        this.brushColor = '#f3d135'
        break
      case 'green':
        this.brushColor = '#6cbe47'
        break
      case 'blue':
        this.brushColor = '#53a7f5'
        break
      case 'purple':
        this.brushColor = '#b36ade'
        break
    }
  }
  updateMask (url) {
    if (!this.mask.hasAttribute('src')) {
      this.mask.src = url
    } else {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = this.mask.width
      canvas.height = this.mask.height
      const newMask = new Image()
      newMask.src = url
      newMask.crossOrigin = 'anonymous'
      newMask.addEventListener('load', () => {
        ctx.drawImage(this.mask, 0, 0)
        ctx.drawImage(newMask, 0, 0)
        this.mask.src = canvas.toDataURL()
        localStorage.setItem('mask', this.mask.src)
      })
      newMask.src = url
    }
  }
  clearCanvas () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

class CommentForm {
  constructor (container) {
    this.form = container
    this.body = this.form.querySelector('.comments__body')
    this.close = this.form.querySelector('.comments__close')
    this.submit = this.form.querySelector('.comments__submit')
    this.marker = this.form.querySelector('.comments__marker-checkbox')
    this.text = this.form.querySelector('.comments__input')
    this.loader = null
    this.form.style.zIndex = '3'
  }
  registerEvents () {
    this.close.addEventListener('click', () => {
      deleteEmptyForm(this.form)
      this.marker.checked = false
    })
    this.submit.addEventListener('click', (event) => {
      event.preventDefault()
      this.addLoader()
      this.sendComment()
    })
    this.marker.addEventListener('click', (event) => {
      if (this.marker.checked === true) {
        workspace.toggleActiveComments()
        this.marker.checked = true
      }
    })
  }
  defaultState () {
    this.marker.checked = true
    this.marker.disabled = true
  }
  activeState () {
    this.marker.disabled = false
  }
  addLoader () {
    if (this.loader !== null) {
      this.loader.remove()
    }
    const loader = commentJSEngine(loaderTemplate())
    this.body.insertBefore(loader, this.text)
    this.loader = this.body.querySelector('.loader').parentElement
  }
  addComment (time, text) {
    let date = new Date(time)
    date = new DateObj(date)
    const newComment = commentJSEngine(commentTemplate(date.convertToString(), text))
    this.body.insertBefore(newComment, this.text)
  }
  sendComment () {
    let comment = new Comment(this.text.value, this.form.style.left, this.form.style.top)
    sendOnServer(`https://neto-api.herokuapp.com/pic/${localStorage.getItem('id')}/comments`, {
      method: 'POST',
      body: comment.encode(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then((response) => {
      this.loader.remove()
      this.text.value = ''
    })
  }
}

class Comment {
  constructor (text, x, y) {
    this.message = text
    this.left = parseInt(x)
    this.top = parseInt(y)
  }
  encode () {
    return Object.keys(this).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(this[key])).join('&')
  }
}

class DateObj {
  constructor (date) {
    this.day = date.getDate()
    this.month = date.getMonth() + 1
    this.year = date.getFullYear()
    this.hours = date.getHours()
    this.minutes = date.getMinutes()
    this.seconds = date.getSeconds()
  }
  convertToString () {
    for (let key in this) {
      if (this[key] < 10) {
        this[key] = '0' + this[key].toString()
      }
    }
    return `${this.day}.${this.month}.${this.year} ${this.hours}:${this.minutes}:${this.seconds}`
  }
}
