document.addEventListener("DOMContentLoaded", () => {
    const note = document.getElementById("note");
    const unlockBtn = document.getElementById("unlockBtn");
    const lockBtn = document.getElementById("lockBtn");

    // Simulated stored passphrase (customize this)
    const storedPassphrase = "access granted";  

    // Speech recognition setup
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";

    // Start listening
    unlockBtn.addEventListener("click", () => {
        unlockBtn.innerText = "🎙️ Listening...";
        unlockBtn.style.boxShadow = "0px 0px 20px #ff00ff";
        recognition.start();
    });

    // Process voice input
    recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Recognized:", spokenText);

        if (spokenText === storedPassphrase) {
            note.disabled = false;
            note.placeholder = "Welcome back, agent. Notes unlocked.";
            lockBtn.disabled = false;
            unlockBtn.disabled = true;
            unlockBtn.innerText = "✅ Unlocked";
            unlockBtn.style.boxShadow = "0px 0px 10px #00ffcc";
        } else {
            alert("❌ Unauthorized voice detected! Access denied.");
            unlockBtn.innerText = "🔊 Speak to Unlock";
        }
    };

    // Lock the notes
    lockBtn.addEventListener("click", () => {
        note.disabled = true;
        note.placeholder = "Access denied. Authenticate to unlock...";
        lockBtn.disabled = true;
        unlockBtn.disabled = false;
        unlockBtn.innerText = "🔊 Speak to Unlock";
    });
});
