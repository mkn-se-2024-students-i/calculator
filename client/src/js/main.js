import "../css/style.css"
import "../css/background-animation.css"

const app = document.getElementById("app")
const btnScreenScrollers = document.querySelectorAll(".screen__btn")
const historyList = document.querySelectorAll(".history__list")
const historyItems = document.querySelectorAll(".history__item")
const screenHome = document.querySelector(".screen_home") 

const calculatorForm = document.querySelector(".calculator-form")
const calculatorButtons = document.querySelectorAll(".calculator__button[data-button-symbol]")
const calculatorClearButton = document.querySelector(".calculator__button.remove-last-symbol")
const calculatorFormInput = calculatorForm.querySelector("input[name='calculator-request']")

calculatorClearButton.addEventListener("click", removeLastCalculatorSymbol)
calculatorFormInput.addEventListener("input",  () => calculatorForm.classList.remove("error"))

const ws = new WebSocket("ws://84.201.143.213:5000");
var globalUser = null;

ws.onopen = () => {
  console.log("WebSocket connection opened");
  
  userId = localStorage.getItem("user_id");
  if (userId == null) {
    userId = uuidv4();
    localStorage.setItem("user_id", userId);
  } else {
    getHistory(userId);
  }
  globalUser = userId;
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  // honestly, other user could be only if we have some mistakes on server side
  if (message.user == globalUser) {
    if (message.type == 'update') { // this is trigger from backend that in some tab you ask for eval and you need to update history
      addNewElementToHistory(message.expr, message.result);
      console.log("We need to update history list for this user");
    } else if (message.type == "eval_expr") { // this is response on evalExpr function
      if (message.result != "error") {
        calculatorFormInput.value = message.result
        console.log(message.result + " is valid result for expr = " + message.expr);
      } else {
        calculatorForm.classList.add("error");
        console.log("Got error while evaluate expr: " + message.error);
      }
    } else if (message.type == "get_history") { // this is response on getHistory function
      console.log("whole history for our user = " + message.result);
      message.result.forEach(elem => {
        addNewElementToHistory(elem.request, elem.result);
      })
    } else {
      console.log("Unknown message type");
    }
  }
};

ws.onclose = () => {
  console.log("WebSocket connection closed");
};

async function evalExpr(user, expr) {
  const message = { type: "eval_expr", user: user, expr: expr };
  ws.send(JSON.stringify(message));
}

async function getHistory(user) {
  const message = { type: "get_history", user: user };
  ws.send(JSON.stringify(message));
}

function removeLastCalculatorSymbol() {
  calculatorForm.classList.remove("error")
  calculatorFormInput.value = calculatorFormInput.value.slice(0, -1)
}

function calculatorInputOnFocus() {
  calculatorFormInput.scrollLeft = calculatorFormInput.scrollWidth
}

btnScreenScrollers.forEach(btn => {
  const screenScrollTo = document.querySelector(`.${btn.dataset.scrollTo}`) 

  btn.addEventListener("click", () => {
    app.scrollTo({
        top: 0,
        left: screenScrollTo.offsetLeft,
        behavior: 'smooth'
    })
  })
})

calculatorButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    calculatorFormInput.value += btn.dataset.buttonSymbol
    calculatorInputOnFocus()
    calculatorForm.classList.remove("error")
  })
})

calculatorForm.addEventListener("submit", (e) => {
  e.preventDefault()
  if(!validateInput()) {
    return
  }

  evalExpr(globalUser, calculatorFormInput.value)
})

function validateInput() {
  const input = calculatorFormInput.value
  const validPattern = /^[0-9+\-×÷/(). ]*$/

  const replaceOperators = (input) => {
    return input.replace(/\*/g, "×")
                .replace(/\//g, "÷")
  }
  calculatorFormInput.value = replaceOperators(calculatorFormInput.value)

  if(input.length == 0) {
    calculatorForm.classList.remove("error")
    console.log('null string')
    return false
  }

  if (/^[+\×\÷/).]/.test(input)) {
    calculatorForm.classList.add("error")
    console.log('First symbol cannot be an operator or closed parentheses or dot, except for minus (-).')
    return false
  }

  if (!validPattern.test(input)) {
    calculatorForm.classList.add("error")
    console.log('Invalid input! Please use only numbers and valid operators (+, -, ×, ÷).')
    return false
  }

  if (/[\+\-\×\÷\/]{2,}/.test(input)) {
    calculatorForm.classList.add("error")
    console.log('Invalid sequence of operators!')
    return false
  }

  const numberWithDots = input.split(/[\+\-\×\/\(\)\s]/)
  const lastPartOfNumberWithDots = numberWithDots[numberWithDots.length - 1]

  if (lastPartOfNumberWithDots.split('.').length > 2) {
    calculatorForm.classList.add("error")
    console.log('A number cannot have more than one dot.')
    return false
  }

  const openParentheses = (input.match(/\(/g) || []).length
  const closeParentheses = (input.match(/\)/g) || []).length

  if (openParentheses !== closeParentheses) {
    console.log('Invalid sequence of parentheses!')
    calculatorForm.classList.add("error")
    return false
  }

  calculatorForm.classList.remove("error")
  return true
}

const calculatorDisplay = document.querySelector(".calculator__display")
let touchstartX = 0
let touchendX = 0
    
function checkDirection() {
  if (touchendX > touchstartX) removeLastCalculatorSymbol()
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
  .replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0; 
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

function addNewElementToHistory(expr, answer) {
  const newRecord = document.createElement('li');
  newRecord.className = 'history__item';

  const answerSpan = document.createElement('span');
  answerSpan.className = 'history__item-answer';
  answerSpan.textContent = answer;

  const requestParagraph = document.createElement('p');
  requestParagraph.className = 'history__item-request';
  requestParagraph.textContent = expr;

  newRecord.appendChild(answerSpan);
  newRecord.appendChild(requestParagraph);
  historyList.appendChild(newRecord);
}

calculatorDisplay.addEventListener('touchstart', e => {
  touchstartX = e.changedTouches[0].screenX
})

calculatorDisplay.addEventListener('touchend', e => {
  touchendX = e.changedTouches[0].screenX
  checkDirection()
})

historyItems.forEach(item => {
  item.addEventListener("click", () => {
    const itemRequest = item.querySelector(".history__item-request")
    calculatorFormInput.value = itemRequest.innerText
    calculatorInputOnFocus()
    
    app.scrollTo({
      top: 0,
      left: screenHome.offsetLeft,
      behavior: 'smooth'
    })

    setTimeout(() => {
      calculatorFormInput.focus()
    }, 1000)
  })
})
