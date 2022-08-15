import { h, human } from './misc.js'

const db = new IdbKvStore('newsv1')
const cache = new IdbKvStore('cachev1')

const api = 'https://hacker-news.firebaseio.com/v0/'

let follows = []

cache.get('follows').then(followlist => {
  if (followlist) {
    follows = followlist
  }
})

async function render (msg) {
  const div = h('div', {classList: 'message'})
  div.appendChild(h('span', {style: 'float: right;'}, [
    h('a', {href: '#' + msg.id}, [human(new Date(msg.time * 1000))])
  ]))
  div.appendChild(h('a', {href: '#' + msg.by}, [msg.by]))

  if (msg.url) {
    div.appendChild(h('p', [
      h('a', {href: msg.url}, [msg.title]),
      h('pre', [msg.url])
    ]))
  }

  if (msg.parent) {
    div.appendChild(h('p', [h('a', {href: '#' + msg.parent}, ['Re: ' + msg.parent])]))
  }

  if (msg.text) {
    div.appendChild(h('p', {innerHTML: msg.text}))
  }

  if (!msg.text) {
    div.appendChild(h('pre', [JSON.stringify(msg)]))
  }

  return div
}

async function addPosts (posts, div) {
  posts.forEach(msg => {
    render(msg).then(rendered => {
      div.appendChild(rendered)
    })
  })
}

export function adder (log, src, div) {
  if (log && log[0]) {
    let index = 0

    var reverse = log.slice().reverse()
    var posts = reverse.slice(index, index + 50)
    addPosts(posts, div).then(done => {
      index = index + 50
      window.onscroll = function (ev) {
        if (
          ((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 1000)
          && window.location.hash.substring(1) === src
        ) {
          posts = reverse.slice(index, index + 50)
          index = index + 50
          addPosts(posts, div)
        }
      }
    })
  }
}

const container = h('div', {id: 'container'})

async function dbget (id) {
  return await db.get(id)
}

async function apiget (id) {
  const res = await fetch(api + 'item/' + id + '.json')
  const msg = res.json()
  return msg
}

async function getallposts (submitted) {
  const src = window.location.hash
  const inter = setInterval(function () {
    const id = submitted.shift()
    db.get(id).then(data => {
      if (!data) {
        apiget(id).then(msg => {
          db.set(id, msg)
          if (window.location.hash === src) {
            render(msg).then(rendered => {
              scroller.appendChild(rendered)
            })
          }
        })
      }
    })
    if (!submitted[0] || window.location.hash != src) {
      clearInterval(inter)
    }
  }, 1000)
}

let head = 0

let num = 0

setInterval(function () {
  if (head != 0) {
    //console.log(head)
    dbget(head).then(msg => {
      if (msg) {
        //console.log('WE HAVE IT')
        //console.log(msg)
        head--
      } else {
        //console.log('FETCHING IT')
        apiget(head).then(msg => {
          db.set(msg.id, msg)
          if (window.location.hash.substring(1) === '' && num < 50) {
            render(msg).then(rendered => {
              scroller.insertBefore(rendered, scroller.childNodes[num - 1])
              console.log(num) 
            })
            num = num + 1
          }
          head--
        })
      }
    })
  } 
}, 1000)

fetch(api + 'maxitem.json')
  .then(res => res.json())
  .then(data => {
    console.log(data)
    head = data
  })

function route (container) {
  const scroller = h('div', {id: 'scroller'})
  container.appendChild(scroller)

  db.values().then(log => {
    log.sort((a,b) => a.created - b.created)
    //console.log(log)
    const src = window.location.hash.substring(1)

    if (src === '') {
      adder(log, '', scroller)
    } else if (src === 'follows') {
      const querylog = log.filter(msg => follows.includes(msg.by))
      adder(querylog, src, scroller)
    } else {
      const querylog = log.filter(msg => msg.by === src || msg.id + '' === src)
      if (!querylog[0] || querylog[0].by === src) {
      //dbget(src).then(gotit => {
      //  console.log(gotit)
      //  if (!gotit) {
          //console.log('checking for user')
          fetch(api + 'user/' + src + '.json').then(res => res.json()).then(data => {
            if (data) {
              console.log(data)
              const profile = h('div', {classList: 'message'})
              profile.appendChild(h('span', {style: 'float: right;'}, ['Since ', human(new Date(data.created * 1000))]))
              profile.appendChild(h('span', [data.id]))
              if (data.about) {
                profile.appendChild(h('p', {innerHTML: data.about}))
              }
              scroller.insertBefore(profile, scroller.firstChild)

              const followButton = h('button', {onclick: function () {
                follows.push(data.id)
                cache.set('follows', follows)
                followButton.parentNode.replaceChild(unfollowButton, followButton)
              }}, ['Follow ' + data.id])

              const unfollowButton = h('button', {onclick: function () {
                for (let i = 0; i < follows.length; i++) {
                  if (follows[i] === data.id) {
                    follows.splice(i, 1)
                  }
                  cache.set('follows', follows)
                  unfollowButton.parentNode.replaceChild(followButton, unfollowButton)
                }
              }}, ['Unfollow ' + data.id])
              if (follows.includes(data.id)) {
                profile.appendChild(unfollowButton)
              } else {
                profile.appendChild(followButton)
              }
              if (data.submitted) {
                getallposts(data.submitted)
              }
            }
          }) 
      //  } 
      //})
      }
      if (!querylog[0]) {
        //console.log('checking for item')
        fetch(api + 'item/' + src + '.json').then(res => res.json()).then(data => {
          db.set(data.id, data)
          render(data).then(rendered => {
            scroller.appendChild(rendered)
          })
        })
      }
      //scroller.appendChild(h('div', [src]))
      adder(querylog, src, scroller)
    }
  })

  window.onhashchange = function () {
    scroller.parentNode.removeChild(scroller)
    route(container)
  }
}

if (window.location.hash === '') {
  window.location.hash = '#'
}

document.body.appendChild(container)
container.appendChild(h('div', {id: 'navbar'}, [
  h('a', {href: '#'}, [h('strong', ['Fracker News'])]),
  ' ',
  h('a', {href: '#follows'}, ['Follows'])
]))
route(container)
