document.addEventListener("DOMContentLoaded", function () {
    const numberOfChars = document.getElementById("tot_char_res");
    const minNumericChars = document.getElementById("num_char_res");
    const useUppercase = document.getElementById("useUppercase");
    const useLowercase = document.getElementById("useLowercase");
    const useNumbers = document.getElementById("useNumbers");
    const useSpecial = document.getElementById("useSpecial");

    const moreToChar = document.getElementById("moreToChar");
    const lessToChar = document.getElementById("lessToChar");
    const moreNumChar = document.getElementById("moreNumChar");
    const lessNumChar = document.getElementById("lessNumChar");

    const genButton = document.getElementById("genButton");
    const result = document.getElementById("result");
    const passStr = document.getElementById("passStr");  // Password strength element

    function updatePasswordStrength(password) {
        const strength = checkPassStrength(password);
        const score = scorePassword(password);  // Assuming scorePassword() returns a numeric value
        const percentage = Math.min(score / 130, 1);  // Assuming 130 is the max score

        passStr.textContent = `Password Strength: ${strength}`;

        // Assuming getColorForPercentage() exists
        passStr.style.backgroundColor = getColorForPercentage(percentage);
    }

    // Automatically generate password on popup load
    function autoGeneratePassword() {
        const password = Password.generate(parseInt(numberOfChars.value), parseInt(minNumericChars.value));
        result.value = password;
        updatePasswordStrength(password); // Update the password strength and color
    }

    // Function to save settings to chrome.storage.sync
    function saveSettings() {
        const settings = {
            numbersOfChars: numberOfChars.value,
            minNumericChars: minNumericChars.value,
            useUppercase: useUppercase.checked,
            useLowercase: useLowercase.checked,
            useNumbers: useNumbers.checked,
            useSpecial: useSpecial.checked
        };
        chrome.storage.sync.set({strongPassGenerator: settings}, function () {
            console.log("Settings saved!", settings);
        });
    }

    // Event listeners for changes to inputs (automatically saves settings)
    numberOfChars.addEventListener("change", saveSettings, false);
    minNumericChars.addEventListener("change", saveSettings, false);
    useUppercase.addEventListener("change", saveSettings, false);
    useLowercase.addEventListener("change", saveSettings, false);
    useNumbers.addEventListener("change", saveSettings, false);
    useSpecial.addEventListener("change", saveSettings, false);

    // Copy to clipboard
    result.addEventListener("click", function () {
        navigator.clipboard.writeText(result.value)
            .then(() => {
                passStr.textContent = "Password copied!";  // Update password strength text to 'copied'
                passStr.style.backgroundColor = "#d1a8ff";  // Change background to purple

                // Reset after a short delay (e.g., 2 seconds)
                setTimeout(() => {
                    passStr.textContent = `Password Strength: ${checkPassStrength(result.value)}`;
                    updatePasswordStrength(result.value); // Reset to strength and color
                }, 1000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    });

    result.addEventListener("mousedown", function (e) {
        e.preventDefault();
    });

    // Event listeners for the + and - buttons for number of characters
    moreToChar.addEventListener("click", function () {
        numberOfChars.value = parseInt(numberOfChars.value) + 1;
        saveSettings();
    }, false);

    lessToChar.addEventListener("click", function () {
        const temp = parseInt(numberOfChars.value) - 1;
        numberOfChars.value = temp > 0 ? temp : 1;
        saveSettings();
    }, false);

    // Event listeners for the + and - buttons for minimum numeric characters
    moreNumChar.addEventListener("click", function () {
        minNumericChars.value = parseInt(minNumericChars.value) + 1;
        saveSettings();
    }, false);

    lessNumChar.addEventListener("click", function () {
        const temp = parseInt(minNumericChars.value) - 1;
        minNumericChars.value = temp > 0 ? temp : 1;
        saveSettings();
    }, false);

    // Generate button functionality to create and display the password and update strength
    genButton.addEventListener("click", function () {
        const password = Password.generate(parseInt(numberOfChars.value), parseInt(minNumericChars.value));
        result.value = password;
        updatePasswordStrength(password);  // Update the password strength
    }, false);

    // Load saved settings on load
    chrome.storage.sync.get(['strongPassGenerator'], function (items) {
        if (items.strongPassGenerator) {
            const settings = items.strongPassGenerator;
            numberOfChars.value = settings.numbersOfChars;
            minNumericChars.value = settings.minNumericChars;
            useUppercase.checked = settings.useUppercase;
            useLowercase.checked = settings.useLowercase;
            useNumbers.checked = settings.useNumbers;
            useSpecial.checked = settings.useSpecial;
        }
    });

    chrome.storage.sync.get(['strongPassGenerator'], function (items) {
        const settings = items.strongPassGenerator || {};

        // Apply saved settings to the form fields
        if (settings.numbersOfChars) numberOfChars.value = settings.numbersOfChars;
        if (settings.minNumericChars) minNumericChars.value = settings.minNumericChars;
        if (settings.useUppercase !== undefined) useUppercase.checked = settings.useUppercase;
        if (settings.useLowercase !== undefined) useLowercase.checked = settings.useLowercase;
        if (settings.useNumbers !== undefined) useNumbers.checked = settings.useNumbers;
        if (settings.useSpecial !== undefined) useSpecial.checked = settings.useSpecial;

        // After applying saved settings, generate the password
        autoGeneratePassword();
    });
});
