const useNumbers = document.getElementById("useNumbers");

const Password = {
    charSets: {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        special: "-!$%^&*(#)@_+|~=`\\]{}[\":;'<>?,./",
    },

    getPattern() {
        let availableChars = '';

        const useUppercase = document.getElementById('useUppercase');
        const useLowercase = document.getElementById('useLowercase');
        const useNumbers = document.getElementById('useNumbers');
        const useSpecial = document.getElementById('useSpecial');

        if (useUppercase.checked) availableChars += this.charSets.upper;
        if (useLowercase.checked) availableChars += this.charSets.lower;
        if (useNumbers.checked) availableChars += this.charSets.numbers;
        if (useSpecial.checked) availableChars += this.charSets.special;

        return availableChars.length > 0 ? availableChars : null;
    },

    getRandomCharFromSet(charSet) {
        const randomIndex = Math.floor(Math.random() * charSet.length);
        return charSet[randomIndex];
    },

    getRandomByte() {
        const byteArray = new Uint8Array(1);
        window.crypto.getRandomValues(byteArray);
        return byteArray[0];
    },

    shuffleArray(array) {
        // Fisher-Yates Shuffle
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    generate(length, minNumeric) {
        const pattern = this.getPattern();
        if (!pattern) return 'No options selected.';

        // Generate the password as an array of characters
        let password = Array.from({length}, () => this.getRandomCharFromSet(pattern));

        // Replace first `minNumeric` characters with random numbers
        if (useNumbers.checked) {
            const maxNumeric = Math.min(minNumeric, length); // Ensure no overflow
            for (let i = 0; i < maxNumeric; i++) {
                password[i] = this.getRandomCharFromSet(this.charSets.numbers);
            }
        }

        // Shuffle and return the password
        return this.shuffleArray(password).join('');
    },
};

function scorePassword(pass) {
    if (!pass) return 0;

    const letters = {};
    let score = 0;

    // Count unique characters and their repetitions
    for (const char of pass) {
        letters[char] = (letters[char] || 0) + 1;
        score += 5.0 / letters[char];
    }

    // Award points for variety in character types
    const variations = {
        digits: /\d/.test(pass),
        lower: /[a-z]/.test(pass),
        upper: /[A-Z]/.test(pass),
        nonWords: /\W/.test(pass),
    };
    const variationCount = Object.values(variations).filter(Boolean).length;

    return Math.floor(score + (variationCount - 1) * 10);
}

function checkPassStrength(password) {
    const score = scorePassword(password);

    if (score > 130) return "Phenomenal";
    if (score > 90) return "Incredible";
    if (score > 80) return "Great";
    if (score > 69) return "Good";
    if (score > 54) return "Fair";
    if (score > 44) return "Mediocre";
    if (score > 38) return "Limited";
    if (score > 34) return "Weak";
    if (score > 29) return "Poor";
    if (score > 19) return "Awful";
    return "Abysmal";
}

const percentColors = [
    {pct: 0.0, color: {r: 255, g: 0, b: 0}},
    {pct: 0.5, color: {r: 255, g: 255, b: 0}},
    {pct: 1.0, color: {r: 0, g: 255, b: 0}}
];

function getColorForPercentage(pct) {
    let lower = percentColors[0]; // Default to the lowest
    let upper = percentColors[percentColors.length - 1]; // Default to the highest

    for (let i = 1; i < percentColors.length; i++) {
        if (pct < percentColors[i].pct) {
            lower = percentColors[i - 1];
            upper = percentColors[i];
            break;
        }
    }

    const rangePct = (pct - lower.pct) / (upper.pct - lower.pct);
    const pctLower = 1 - rangePct;
    const pctUpper = rangePct;

    return `rgb(${[
        Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
        Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
        Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper),
    ].join(',')})`;
}
