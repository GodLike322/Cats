let modals = document.querySelectorAll(".modal");
let actions = document.querySelectorAll("[data-action]");
let container = document.querySelector(".cats-container");
let user = "vlad";
let updForm = document.forms.upd;
let addForm = document.forms.add;

let cats = localStorage.getItem("vlad-cats");
cats = cats ? JSON.parse(cats) : [];

actions.forEach(action => {
  action.addEventListener("click", () => {
    if (action.dataset.action === "reload") {
      localStorage.removeItem("vlad-cats");
      fetch(`https://cats.petiteweb.dev/api/single/${user}/show`)
        .then(response => response.json())
        .then(data => {
          if (!data.message) {
            cats = [...data];
            localStorage.setItem("vlad-cats", JSON.stringify(cats));
            container.innerHTML = cats.map(cat => createCard(cat)).join("");
          }
        })
    } else {
      let modal = document.querySelector(`.modal[data-type="${action.dataset.action}"]`);
      modal.classList.add("active");
    }
  })
})

modals.forEach(modal => {
    let closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      addForm.reset();
      updForm.reset();
    });
});

function showCats() {
    container.innerHTML = "";
    let filteredCats = cats;
    if (showOnlyFavorites) {
        filteredCats = filteredCats.filter(cat => cat.favorite);
    }
    filteredCats.forEach(cat => {
        container.innerHTML += createCard(cat);
    })
}
 
const favoritesBtn = document.querySelector(".btn");

favoritesBtn.addEventListener("click", () => {
  const favoriteCats = cats.filter(cat => cat.favorite);
  container.innerHTML = "";
  favoriteCats.forEach(cat => {
    container.innerHTML += createCard(cat);
  })
})

const allCatsBtn = document.querySelector(".all-btn");

allCatsBtn.addEventListener("click", () => {
    displayCats(cats);
});

function setLike(id, el) {
    console.log(id);
    el.classList.toggle("fa-solid");
    el.classList.toggle("fa-regular");
    const isFavorite = el.classList.contains("fa-solid");
    const url = `https://cats.petiteweb.dev/api/single/${user}/update/${id}`;
    const options = {
        method: "put",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({favorite: isFavorite})
    };
    fetch(url, options)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if (data.message.includes("успешно")) {
                cats = cats.map(cat => {
                    if (cat.id === id) {
                        cat.favorite = isFavorite;
                    }
                    return cat;
                });
                localStorage.setItem("vlad-cats", JSON.stringify(cats));
            }
        });
}

function setRate(n) {
    const solidStar = '<i class="fa-solid fa-star"></i>';
    const regularStar = '<i class="fa-regular fa-star"></i>';
    return `${solidStar.repeat(n)}${regularStar.repeat(5 - n)}`;
}

function setAge(n) {
    const years = (n % 100 < 11 || n % 100 > 14) &&
      (n % 10 === 1) ? 'год' : (n % 10 >= 2 && n % 10 <= 4) ? 'года' : 'лет';
    return `${n} ${years}`;
  }  

function showModal(id, el) {
    const modalType = el.dataset.action;
    const modal = document.querySelector(`.modal[data-type=${modalType}]`);
    modal.classList.add('active');

    const content = modal.querySelector('.modal-cat');
    const cat = cats.find(cat => cat.id === id);

    content.innerHTML = `
        <div class="cat-text">
        <h2>${cat.name}</h2>
        <div>${typeof cat.age === 'number' ? setAge(cat.age) : 'Возраст не указан'}</div>
        <div>${cat.description || 'Информации о котике пока нет...'}</div>
        </div>
        <img src=${cat.image || 'images/default.png'} alt="${cat.name}">
    `;
}

function setUpd(id, el) {
    Array.from(modals).find(m => m.dataset.type === el.dataset.action).classList.add("active");
    let cat = cats.find(cat => cat.id === id);
    console.log(cat);
    for (let i = 0; i < updForm.elements.length; i++) {
        let inp = updForm.elements[i];
        if (inp.name && cat[inp.name]) {
            if (inp.type === "checkbox") {
                inp.checked = cat[inp.name]
            } else {
                inp.value = cat[inp.name];
            }
        }
    }
}

function setDel(id, el) {
    fetch(`https://cats.petiteweb.dev/api/single/${user}/delete/${id}`, {
        method: "delete"
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if (data.message.includes("успешно")) {
                cats = cats.filter(cat => cat.id !== id);
                localStorage.setItem("vlad-cats", JSON.stringify(cats));
            } else {
                alert(data.message);
            }
        })
        .finally(() => {
            el.parentElement.parentElement.remove();
        })
}

function createCard(obj) {
    const catPicStyle = obj.image ? `background-image: url('${obj.image}');` : '';
    const catAge = obj.age ? `, ${setAge(obj.age)}` : '';
    const catDescription = obj.description || "Информации о котике пока нет...";
    const catRate = setRate(obj.rate || 0);
    const catLikeClass = obj.favorite ? "fa-solid" : "fa-regular";

    return `
        <div class="cat" data-id="${obj.id}">
            <i class="fa-heart cat-like ${catLikeClass}" onclick="setLike(${obj.id}, this)"></i>
            <div class="cat-pic" style="${catPicStyle}"></div>
            <h2 class="cat-name">${obj.name}${catAge}</h2>
            <div class="cat-rate">${catRate}</div>
            <div class="cat-info">
                <button class="btn-text" onclick="showModal(${obj.id}, this)" data-action="show">Посмотреть</button>
                <button class="btn"><i class="fa-solid fa-pen" onclick="setUpd(${obj.id}, this)" data-action="upd"></i></button>
                <button class="btn" onclick="setDel(${obj.id}, this)"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;
}

if (!cats.length) {
    fetch(`https://cats.petiteweb.dev/api/single/${user}/show`)
      .then(res => res.json())
      .then(data => {
        if (!data.message) {
          cats = data;
          localStorage.setItem("vlad-cats", JSON.stringify(cats));
        }
        displayCats(cats);
      });
  } else {
    displayCats(cats);
}
  
function displayCats(cats) {
    container.innerHTML = cats.map(cat => createCard(cat)).join("");
}
  
updForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let body = {};
    for (let i = 0; i < updForm.elements.length; i++) {
        let inp = updForm.elements[i];
        if (inp.name) {
            if (inp.type === "checkbox") {
                body[inp.name] = inp.checked;
            } else {
                body[inp.name] = inp.value;
            }
        }
    }
    body.id = +body.id;
    console.log("upd", body);
    fetch(`https://cats.petiteweb.dev/api/single/${user}/update/${body.id}`, {
        method: "put",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if (data.message.includes("успешно")) {
                cats = cats.map(cat => {
                    if (cat.id === body.id) {
                        return body;
                    }
                    return cat;
                })
                console.log(cats);
                container.innerHTML = "";
                cats.forEach(cat => {
                    container.innerHTML += createCard(cat);
                })
                updForm.reset()
                localStorage.setItem("vlad-cats", JSON.stringify(cats));
                Array.from(modals).find(m => m.dataset.type === "upd").classList.remove("active");
            } else {
                alert(data.message);
            }
        })
})  

  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let body = {};
    for (let i = 0; i < addForm.elements.length; i++) {
        let inp = addForm.elements[i];
        if (inp.name) {
            if (inp.type === "checkbox") {
                body[inp.name] = inp.checked;
            } else {
                body[inp.name] = inp.value;
            }
        }
    }
    body.id = +body.id;
    console.log("add", body);
    fetch(`https://cats.petiteweb.dev/api/single/${user}/add`, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if (data.message.includes("успешно")) {
                cats.push(body);
                container.innerHTML = "";
                cats.forEach(cat => {
                    container.innerHTML += createCard(cat);
                })
                addForm.reset()
                localStorage.setItem("vlad-cats", JSON.stringify(cats));
                Array.from(modals).find(m => m.dataset.type === "add").classList.remove("active");
            } else {
                alert(data.message);
            }
        })
})
  