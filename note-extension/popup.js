// Get elements
const noteInput = document.getElementById("note");
const saveButton = document.getElementById("save-note");
const urlNotesList = document.getElementById("url-notes");
const baseUrlNotesList = document.getElementById("base-url-notes");
const toggleBaseUrl = document.getElementById("toggle-base-url");
const baseUrlTitle = document.getElementById("base-url-title");

// Helper function to get the base domain
function getBaseDomain(url) {
    try {
        const { hostname } = new URL(url);
        const parts = hostname.split(".");
        return parts.slice(-2).join(".");
    } catch {
        return null;
    }
}

// Save the note
saveButton.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const baseDomain = getBaseDomain(url);
    const note = noteInput.value.trim();
    const title = tab.title; // Get the title of the active tab

    if (!note) return;

    chrome.storage.sync.get(["notes"], (data) => {
        const notes = data.notes || {};

        // Save the note for the specific URL
        if (!notes[url]) notes[url] = [];
        notes[url].push(note);

        // Save the note for the base domain (if it's not already there)
        if (!notes[baseDomain]) notes[baseDomain] = [];
        if (!notes[baseDomain].some((entry) => entry.url === url)) {
            notes[baseDomain].push({ title, url, note });
        }

        chrome.storage.sync.set({ notes }, () => {
            noteInput.value = "";
            loadNotes();
        });
    });
});

// Load and display notes
// Updated loadNotes function with delete functionality
function loadNotes() {
    urlNotesList.innerHTML = "";
    baseUrlNotesList.innerHTML = "";

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        const url = tab.url;
        const baseDomain = getBaseDomain(url);

        chrome.storage.sync.get(["notes"], (data) => {
            const notes = data.notes || {};

            // Display notes for the current URL
            const urlNotes = notes[url] || [];
            urlNotes.forEach((note, index) => {
                const li = document.createElement("li");
                li.textContent = note;

                // Add delete button
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener("click", () => deleteNote(url, index));

                li.appendChild(deleteButton);
                urlNotesList.appendChild(li);
            });

            // Display notes for the base domain (excluding the current URL)
            const baseUrlNotes = notes[baseDomain] || [];
            baseUrlNotes
                .filter((entry) => entry.url !== url) // Exclude the current URL
                .forEach((entry, index) => {
                    // Add page title
                    const title_container = document.createElement("h3")
                    title_container.className = "title"
                    const title = document.createElement("a");
                    title.href = entry.url;
                    title.textContent = entry.title;
                    title.target = "_blank"; // Open in a new tab

                    // Add Note with hyperlink
                    const li = document.createElement("li");
                    const note = document.createElement("p");
                    note.textContent = entry.note;
                    

                    // Add delete button
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Delete";
                    deleteButton.addEventListener("click", () => deleteBaseNote(baseDomain, index));

                    title_container.appendChild(title)
                    li.appendChild(title_container)
                    li.appendChild(note);
                    li.appendChild(deleteButton);
                    baseUrlNotesList.appendChild(li);
                });
        });
    });
}

// Function to delete a note for a specific URL
function deleteNote(url, index) {
    chrome.storage.sync.get(["notes"], (data) => {
        const notes = data.notes || {};
        if (notes[url]) {
            notes[url].splice(index, 1); // Remove the note at the specified index

            // If no notes are left for the URL, delete the key
            if (notes[url].length === 0) {
                delete notes[url];
            }

            chrome.storage.sync.set({ notes }, loadNotes); // Save changes and reload notes
        }
    });
}

// Function to delete a note from the base domain
function deleteBaseNote(baseDomain, index) {
    chrome.storage.sync.get(["notes"], (data) => {
        const notes = data.notes || {};
        if (notes[baseDomain]) {
            notes[baseDomain].splice(index, 1); // Remove the note at the specified index

            // If no notes are left for the base domain, delete the key
            if (notes[baseDomain].length === 0) {
                delete notes[baseDomain];
            }

            chrome.storage.sync.set({ notes }, loadNotes); // Save changes and reload notes
        }
    });
}

// Toggle base URL notes visibility
toggleBaseUrl.addEventListener("change", (event) => {
    const show = event.target.checked;
    baseUrlTitle.style.display = show ? "block" : "none";
    baseUrlNotesList.style.display = show ? "block" : "none";
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    loadNotes();
    // Default toggle state
    toggleBaseUrl.checked = false;
    baseUrlTitle.style.display = "none";
    baseUrlNotesList.style.display = "none";
});
