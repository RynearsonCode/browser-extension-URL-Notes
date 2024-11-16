console.log("popup.js loaded");

// Get elements
const noteInput = document.getElementById("note");
const addButton = document.getElementById("add-note");
const saveButton = document.getElementById("save-note");
const urlNotesList = document.getElementById("url-notes");
const baseUrlNotesList = document.getElementById("base-url-notes");
const acc = document.getElementsByClassName("accordion");
const toggleBaseUrl = document.getElementById("toggle-base-url");
const baseUrlTitle = document.getElementById("base-url-title");
const mainPage = document.getElementById("main-page");
const addNotePage = document.getElementById("add-note-page");
console.log(acc);
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

// Show "Add Note" page
addButton.addEventListener("click", () => {
    mainPage.classList.add("hidden");
    addNotePage.classList.remove("hidden");
});



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
        notes[baseDomain].push({ title, url, note });

        chrome.storage.sync.set({ notes }, () => {
            noteInput.value = "";
            loadNotes();
        });
    });

    mainPage.classList.remove("hidden");
    addNotePage.classList.add("hidden");
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

            if (urlNotes.length === 0) {
                // Display message if there are no notes
                const noNotesMessage = document.createElement("li");
                noNotesMessage.textContent = "No notes, Yet!";
                urlNotesList.appendChild(noNotesMessage);
            } else {
                // Display notes
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
            }


            // Display notes for the base domain (excluding the current URL)
            const baseUrlNotes = notes[baseDomain] || [];
            // Group notes by URL
            filteredEntry = baseUrlNotes.filter((entry) => entry.url !== url) // Exclude the current URL
            const groupedNotes = filteredEntry.reduce((acc, entry) => {
                if (!acc[entry.url]) {
                    acc[entry.url] = {
                        title: entry.title,
                        notes: []
                    };
                }
                acc[entry.url].notes.push(entry.note);
                return acc;
            }, {});

            Object.values(groupedNotes).forEach((group) => {
                // Add page title once
                const title_container = document.createElement("button");
                title_container.className = "accordion";
                const title = document.createElement("a");
                title.href = group.url;
                title.textContent = group.title;
                title.target = "_blank"; // Open in a new tab

                title_container.appendChild(title);

                // Create a container for all notes related to this URL
                const notesContainer = document.createElement("div");
                notesContainer.className = "panel"

                group.notes.forEach((noteText, index) => {
                    // Add Note with hyperlink
                    const div = document.createElement("div");
                    div.className="notediv"
                    const note = document.createElement("p");
                    note.textContent = noteText;

                    // Add delete button
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Delete";
                    deleteButton.addEventListener("click", () => deleteBaseNote(baseDomain, index));

                    div.appendChild(note);
                    div.appendChild(deleteButton);
                    notesContainer.appendChild(div);
                });

                // Append the title and the grouped notes to the DOM

                baseUrlNotesList.appendChild(title_container);
                baseUrlNotesList.appendChild(notesContainer);
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

    // accordion
    console.log("TEST")
    console.log(acc.length)

    // Loop through all accordion elements
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function () {
            console.log("Accordion button clicked!");  // Debug to check if the click event works
            this.classList.toggle("active");

            // Find the panel that follows the clicked accordion button
            const panel = this.nextElementSibling;
            console.log("test");
            console.log(panel);  // Log the panel to verify it's the correct sibling
            
            // Toggle the 'hidden' and 'visible' classes
            if (panel.classList.contains("visible")) {
                panel.classList.remove("visible");
                panel.classList.add("hidden");
            } else {
                panel.classList.remove("hidden");
                panel.classList.add("visible");
            }
            
            console.log(panel);  // Log the panel to verify it's the correct sibling
        });
    }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    loadNotes();
    // Default toggle state
    toggleBaseUrl.checked = false;
    baseUrlTitle.style.display = "none";
    baseUrlNotesList.style.display = "none";

    
});

