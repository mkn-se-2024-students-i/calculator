const app = document.getElementById("app")
const btnScreenScrollers = document.querySelectorAll(".screen__btn")
const historyItems = document.querySelectorAll(".history__item")
const screenHome = document.querySelector(".screen_home") 

const calculatorForm = document.querySelector(".calculator-form")
const calculatorButtons = document.querySelectorAll(".calculator__button[data-button-symbol]")
const calculatorClearButton = document.querySelector(".calculator__button.remove-last-symbol")
const calculatorFormInput = calculatorForm.querySelector("input[name='calculator-request']")

calculatorClearButton.addEventListener("click", removeLastCalculatorSymbol)
calculatorFormInput.addEventListener("input", validateInput)

function removeLastCalculatorSymbol() {
  calculatorFormInput.value = calculatorFormInput.value.slice(0, -1)
  validateInput()
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
    validateInput()
  })
})

calculatorFormInput.addEventListener("keydown", (e) => {
  if (e.code === "NumpadDivide" || e.code === "Slash") {
    calculatorFormInput.value += '÷'
  }
  if (e.code === "NumpadMultiply" || (e.code === "Digit8" && e.shiftKey)) {
    calculatorFormInput.value += '×'
  }

  validateInput()
})

calculatorForm.addEventListener("submit", (e) => {
  e.preventDefault()
  if(!validateInput()) return

  calculatorFormInput.value = ''
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
