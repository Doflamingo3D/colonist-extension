console.log("Colonassist started...");

let playerResources = {}; // Stores resource counts for each player

// Resource types to track
const resourceTypes = {
    wood: "card_lumber",
    brick: "card_brick",
    wheat: "card_grain",
    sheep: "card_wool",
    stone: "card_ore"
};

// Step 1: Observe game log and start tracking players and resources
function observeGameLog() {
    const logElement = document.querySelector("#game-log-text");
    if (!logElement) {
        console.error("Game log element not found. Retrying...");
        setTimeout(observeGameLog, 1000); // Retry after 1 second
        return;
    }

    console.log("Game log found. Setting up observer...");

    // Initialize all players when the game starts
    initializePlayers(logElement);

    const logObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("message-post")) {
                    parseLogMessage(node); // Parse new log entries
                }
            });
        });
    });

    logObserver.observe(logElement, { childList: true });
}

// Step 2: Initialize all players from the start of the game
function initializePlayers(logElement) {
    console.log("Initializing players...");

    const playerMessages = Array.from(logElement.querySelectorAll(".message-post"))
        .filter((message) => message.textContent.includes("placed a")); // Detect placement messages

    playerMessages.forEach((message) => {
        const playerName = extractPlayerName(message);
        if (playerName && !playerResources[playerName]) {
            playerResources[playerName] = { wood: 0, brick: 0, wheat: 0, sheep: 0, stone: 0 };
        }
    });

    console.log("Initialized players:", playerResources);
    renderResourceTable(); // Display the initial table
}

// Parse a single log message
function parseLogMessage(messageElement) {
    const textContent = messageElement.textContent.trim();
    console.log("Parsing message:", textContent);

    // Handle starting resources
    if (textContent.includes("received starting resources")) {
        const player = extractPlayerName(messageElement);
        const resources = extractResources(messageElement);
        updatePlayerResources(player, resources);
    } else if (textContent.includes("got")) { // Handle resource gains from dice rolls
        const player = extractPlayerName(messageElement);
        const resources = extractResources(messageElement);
        updatePlayerResources(player, resources);
    }

    // Handle other log types (e.g., trades, builds) as needed
}

// Extract player name from message
function extractPlayerName(messageElement) {
    const playerNameElement = messageElement.querySelector(".semibold");
    return playerNameElement ? playerNameElement.textContent.trim() : null;
}

// Extract resources from a log message
function extractResources(messageElement) {
    const resources = {};
    const resourceIcons = messageElement.querySelectorAll("img");
    resourceIcons.forEach((img) => {
        Object.keys(resourceTypes).forEach((resource) => {
            if (img.src.includes(resourceTypes[resource])) {
                resources[resource] = (resources[resource] || 0) + 1;
            }
        });
    });
    return resources;
}

// Update resource data for a player
function updatePlayerResources(player, resources) {
    if (!player) return;
    if (!playerResources[player]) {
        playerResources[player] = { wood: 0, brick: 0, wheat: 0, sheep: 0, stone: 0 };
    }
    Object.keys(resources).forEach((resource) => {
        playerResources[player][resource] += resources[resource];
    });
    console.log(`Updated resources for ${player}:`, playerResources[player]);
    renderResourceTable(); // Update the resource table
}

// Render the resource table
function renderResourceTable() {
    // Remove existing table if it exists
    const existingTable = document.getElementById("resource-table");
    if (existingTable) {
        existingTable.remove();
    }

    // Create a new table
    const table = document.createElement("table");
    table.id = "resource-table";

    // Create header row
    const headerRow = table.insertRow();
    const headerPlayer = headerRow.insertCell();
    headerPlayer.innerText = "Player";
    Object.keys(resourceTypes).forEach((resource) => {
        const cell = headerRow.insertCell();
        cell.innerText = resource.charAt(0).toUpperCase() + resource.slice(1);
    });

    // Create rows for each player
    Object.keys(playerResources).forEach((player) => {
        const row = table.insertRow();
        const playerNameCell = row.insertCell();
        playerNameCell.innerText = player;
        Object.keys(resourceTypes).forEach((resource) => {
            const cell = row.insertCell();
            cell.innerText = playerResources[player][resource] || 0;
        });
    });

    // Add drag functionality
    makeTableDraggable(table);

    document.body.appendChild(table); // Add table to the page
}

// Function to make the table draggable
function makeTableDraggable(table) {
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    // Add mousedown event to start dragging
    table.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - table.getBoundingClientRect().left;
        offsetY = e.clientY - table.getBoundingClientRect().top;
        table.style.cursor = "grabbing"; // Change cursor during dragging
    });

    // Add mousemove event to drag the table
    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            table.style.left = `${e.clientX - offsetX}px`;
            table.style.top = `${e.clientY - offsetY}px`;
        }
    });

    // Add mouseup event to stop dragging
    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            table.style.cursor = "grab"; // Reset cursor after dragging
        }
    });
}

// Initialize the extension
function init() {
    console.log("Initializing Colonassist...");
    observeGameLog();
}

init();
