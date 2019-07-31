function commentJSEngine (block, x, y) {
  const element = document.createElement(block.tag)
  if ((block === undefined) || (block === null) || (block === false)) {
    return document.createTextNode('')
  }
  if ((typeof block === 'number') || (typeof block === 'string') || (block === true)) {
    return document.createTextNode(block.toString())
  }
  if (block.class) {
    element.classList.add(...[].concat(block.class))
  }
  if (block.attrs) {
    Object.keys(block.attrs).forEach(key => {
      element.setAttribute(key, block.attrs[key])
    })
  }
  if (Array.isArray(block)) {
    return block.reduce((f, item) => {
      f.appendChild(
        commentJSEngine(item)
      )
      return f
    }, document.createDocumentFragment())
  }
  if (block.content) {
    element.appendChild(commentJSEngine(block.content))
  }
  if (x !== undefined && y !== undefined) {
    element.style.left = x + 'px'
    element.style.top = y + 'px'
  }
  return element
}

function commentFormTemplate () {
  return {
    tag: 'form',
    class: 'comments__form',
    content: [{
      tag: 'span',
      class: 'comments__marker'
    },
    {
      tag: 'input',
      class: 'comments__marker-checkbox',
      attrs: { type: 'checkbox' }
    },
    {
      tag: 'div',
      class: 'comments__body',
      content: [{
        tag: 'textarea',
        class: 'comments__input',
        attr: { type: 'text', placeholder: 'Напишите ответ...' }
      },
      {
        tag: 'input',
        class: 'comments__close',
        attrs: { type: 'button', value: 'Закрыть' }
      },
      {
        tag: 'input',
        class: 'comments__submit',
        attrs: { type: 'submit', value: 'Отправить' }
      }
      ]
    }

    ]
  }
}

function commentTemplate (time, text) {
  return {
    tag: 'div',
    class: 'comment',
    content: [{
      tag: 'p',
      class: 'comment__time',
      content: `${time}`
    },
    {
      tag: 'p',
      class: 'comment__message',
      content: `${text}`
    }
    ]
  }
}

function loaderTemplate () {
  return {
    tag: 'div',
    class: 'comment',
    content: [{
      tag: 'div',
      class: 'loader',
      content: [{
        tag: 'span'
      },
      {
        tag: 'span'
      },
      {
        tag: 'span'
      },
      {
        tag: 'span'
      },
      {
        tag: 'span'
      }
      ]
    }]
  }
}
