var Password = {

  getPattern: function () {
    var pattern = '[';
    if (useUppercase.checked)
      pattern = pattern.concat('A-Z');
    if (useLowercase.checked)
      pattern = pattern.concat('a-z');
    if (useNumbers.checked)
      pattern = pattern.concat('0-9');
    if (useSpecial.checked)
      pattern = pattern.concat("-!$%^&*(#)@_+|~=`\\]{}\[:\";'<>?,.\/");
    pattern = pattern.concat(']');

    if (pattern.length <= 2)
      return null;

    return new RegExp(pattern);
  },

  getRandomByte: function () {
    if (window.crypto && window.crypto.getRandomValues) {
      var temp1 = new Uint8Array(1);
      window.crypto.getRandomValues(temp1);
      return temp1[0];
    }
    else if (window.msCrypto && window.msCrypto.getRandomValues) {
      var temp2 = new Uint8Array(1);
      window.msCrypto.getRandomValues(temp2);
      return temp2[0];
    }
    else {
      return Math.floor(Math.random() * 256);
    }
  },

  generate: function (length, minNumeric) {
    var pattern = this.getPattern();

    if (!pattern)
      return 'No options selected.';

    String.prototype.shuffle = function () {
      for (var a = this.split(""), b = a.length, c = b - 1; c > 0; c--) {
        var d = Math.floor(Math.random() * (c + 1)), e = a[c];
        a[c] = a[d];
        a[d] = e;
      }
      return a.join("")
    };

    String.prototype.replaceAt = function (index, character) {
      return this.substr(0, index) + character + this.substr(index + character.length);
    };

    var password = Array.apply(null, {'length': length})
      .map(function () {
        var result;
        while (true) {
          result = String.fromCharCode(this.getRandomByte());
          if (pattern.test(result)) {
            return result;
          }
        }
      }, this).join('');

    if (useNumbers.checked) {
      if (minNumeric > length) //Check for overflow
        minNumeric = length;

      //Get random numbers
      var randomNums = Array.apply(null, new Array(minNumeric)).map(function () {
        return Math.floor(Math.random() * 10);
      });

      for (var j = 0; j < randomNums.length; j++)
        password = password.replaceAt(j, randomNums[j].toString());
    }

    return password.shuffle();
  }
};

function scorePassword(pass) {
  var score = 0;
  if (!pass)
    return score;

  // award every unique letter until 5 repetitions
  var letters = {};
  for (var i = 0; i < pass.length; i++) {
    letters[pass[i]] = (letters[pass[i]] || 0) + 1;
    score += 5.0 / letters[pass[i]];
  }

  // bonus points for mixing it up
  var variations = {
    digits: /\d/.test(pass),
    lower: /[a-z]/.test(pass),
    upper: /[A-Z]/.test(pass),
    nonWords: /\W_/.test(pass)
  };

  var variationCount = 0;
  for (var check in variations) {
    variationCount += (variations[check] == true) ? 1 : 0;
  }
  score += (variationCount - 1) * 10;

  return parseInt(score);
}

function checkPassStrength(a) {
  var b = scorePassword(a);
  return b > 130 ? "Phenomenal" :
    b <= 130 && b > 90 ? "Incredible" :
      b <= 90 && b > 89 ? "Amazing" :
        b <= 89 && b > 83 ? "Excellent" :
          b <= 83 && b > 80 ? "Great" :
            b <= 80 && b > 69 ? "Good" :
              b <= 69 && b > 66 ? "Fine" :
                b <= 66 && b > 62 ? "Decent" :
                  b <= 62 && b > 54 ? "Fair" :
                    b <= 54 && b > 44 ? "Mediocre" :
                      b <= 44 && b > 38 ? "Limited" :
                        b <= 38 && b > 34 ? "Weak" :
                          b <= 34 && b > 29 ? "Poor" :
                            b <= 29 && b > 26 ? "Bad" :
                              b <= 26 && b > 19 ? "Awful" :
                                b <= 19 && b > 18 ? "Terrible" :
                                  b <= 18 && b > 19 ? "Dreadful" :
                                    "Abysmal"
}

//background-color: #9db6cc;
var percentColors = [
  {pct: 0.0, color: {r: 0xff, g: 0x00, b: 0}},
  {pct: 0.5, color: {r: 0xff, g: 0xff, b: 0}},
  {pct: 1.0, color: {r: 0x00, g: 0xff, b: 0}}];

var getColorForPercentage = function (pct) {
  for (var i = 1; i < percentColors.length - 1; i++) {
    if (pct < percentColors[i].pct) {
      break;
    }
  }
  var lower = percentColors[i - 1];
  var upper = percentColors[i];
  var range = upper.pct - lower.pct;
  var rangePct = (pct - lower.pct) / range;
  var pctLower = 1 - rangePct;
  var pctUpper = rangePct;
  var color = {
    r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
    g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
    b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
  };
  return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
  // or output as hex if preferred
};