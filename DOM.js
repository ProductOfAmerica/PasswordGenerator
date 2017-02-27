var genButton = document.getElementById("genButton"),
  lessToChar = document.getElementById("lessToChar"),
  moreToChar = document.getElementById("moreToChar"),
  lessNumChar = document.getElementById("lessNumChar"),
  moreNumChar = document.getElementById("moreNumChar"),
  useUppercase = document.getElementById("useUppercase"),
  useLowercase = document.getElementById("useLowercase"),
  useNumbers = document.getElementById("useNumbers"),
  useSpecial = document.getElementById("useSpecial"),
  result = document.getElementById("result"),
  numberOfChars = document.getElementById("tot_char_res"),
  minNumericChars = document.getElementById("num_char_res"),
  passStr = document.getElementById("passStr");


genButton.addEventListener("click", function () {
  result.value = Password.generate(parseInt(numberOfChars.value), parseInt(minNumericChars.value));

  passStr.style.background = getColorForPercentage(scorePassword(result.value) / 160);
  passStr.innerText = checkPassStrength(result.value);

  chrome.storage.sync.set({
    strongPassGenerator: {
      numbersOfChars: numberOfChars.value,
      minNumericChars: minNumericChars.value,
      useUppercase: useUppercase.checked,
      useLowercase: useLowercase.checked,
      useNumbers: useNumbers.checked,
      useSpecial: useSpecial.checked
    }
  }, function () {
    console.log("Saved settings!");
  });
}, false);


moreToChar.addEventListener("click", function () {
  numberOfChars.value = parseInt(numberOfChars.value) + 1;
}, false);


lessToChar.addEventListener("click", function () {
  var temp = parseInt(numberOfChars.value) - 1;
  if (temp > 0)
    numberOfChars.value = temp;
  else if (temp <= 0)
    numberOfChars.value = 1;
}, false);


lessNumChar.addEventListener("click", function () {
  var temp = parseInt(minNumericChars.value) - 1;
  if (temp > 0)
    minNumericChars.value = temp;
  else if (temp <= 0)
    minNumericChars.value = 1;
}, false);


moreNumChar.addEventListener("click", function () {
  minNumericChars.value = parseInt(minNumericChars.value) + 1;
}, false);

chrome.storage.sync.get(["strongPassGenerator"], function (items) {
  items = items["strongPassGenerator"];

  minNumericChars.value = items["minNumericChars"];
  numberOfChars.value = items["numbersOfChars"];
  useLowercase.checked = items["useLowercase"];
  useNumbers.checked = items["useNumbers"];
  useSpecial.checked = items["useSpecial"];
  useUppercase.checked = items["useUppercase"];
});