const app = document.getElementById("app")
const btnScreenScrollers = document.querySelectorAll(".screen__btn")
const historyItems = document.querySelectorAll(".history__item")

const calculatorForm = document.querySelector(".calculator-form")
const calculatorButtons = document.querySelectorAll(".calculator__button[data-button-symbol]")
const calculatorClearButton = document.querySelector(".calculator__button.remove-last-symbol")
const calculatorFormInput = calculatorForm.querySelector("input[name='calculator-request']")

calculatorClearButton.addEventListener("click", removeLastCalculatorSymbol)
calculatorFormInput.addEventListener("input", validateInput)

btnScreenScrollers.forEach(btn => {
  const screenScrollTo = document.querySelector(`.${btn.dataset.scrollTo}`) 

  btn.addEventListener("click", () => {
    app.scrollTo({
        top: 0,
        left: screenScrollTo.offsetLeft,
        behavior: 'smooth'
    });
  })
});

function removeLastCalculatorSymbol(){
  calculatorFormInput.value = calculatorFormInput.value.slice(0, -1)
}

calculatorButtons.forEach(btn => {
  btn.addEventListener("click", () =>{
    calculatorFormInput.value += btn.dataset.buttonSymbol
    calculatorFormInput.scrollLeft = calculatorFormInput.scrollWidth
    validateInput()
  })
});

calculatorFormInput.addEventListener("keydown", (e)=>{
  switch (e.code) {
    case 'NumpadDivide' || 'Slash':
      calculatorFormInput.value += '÷'
      break;
    case 'NumpadMultiply':
      calculatorFormInput.value += '×'
      break;
    
    default:
      break;
  }
  validateInput()
})

calculatorForm.addEventListener("submit", (e) =>{
  e.preventDefault()
  validateInput()

  calculatorFormInput.value = ''
})

function validateInput() {
  const input = calculatorFormInput.value;
  const validPattern = /^[0-9+\-×÷/(). ]*$/;

  if(input.length == 0){
    console.log('null string');
    return false;
  }

  if (/^[+\×\÷/).]/.test(input)) {
    removeLastCalculatorSymbol()
    console.log('First symbol cannot be an operator or closed parentheses or dot, except for minus (-).');
    return false;
  }

  if (!validPattern.test(input)) {
    // removeLastCalculatorSymbol()
    input.match(validPattern)
    console.log('Invalid input! Please use only numbers and valid operators (+, -, ×, ÷).');
    return false;
  }

  if (/[\+\-\×\÷\/]{2,}/.test(input)) {
    removeLastCalculatorSymbol()
    console.log('Invalid sequence of operators!');
    return false;
  }

  const numberWithDots = input.split(/[\+\-\×\/\(\)\s]/);
  const lastPartOfNumberWithDots = numberWithDots[numberWithDots.length - 1];

  if (lastPartOfNumberWithDots.split('.').length > 2) {
    removeLastCalculatorSymbol()
    console.log('A number cannot have more than one dot.');
    return false;
  }

  const openParentheses = (input.match(/\(/g) || []).length;
  const closeParentheses = (input.match(/\)/g) || []).length;

  if (openParentheses !== closeParentheses) {
    console.log('Invalid sequence of parentheses!')
    return false;
  }
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
