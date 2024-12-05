console.log("Colonassist started...");

let playerResources = {}; // Stores resource counts for each player
let tablePosition = { top: "10px", left: "10px" }; // Default position

// Resource types to track
const resourceTypes = {
    wood: "card_lumber",
    brick: "card_brick",
    wheat: "card_grain",
    sheep: "card_wool",
    stone: "card_ore",
};

// Function to extract resources from icons
function extractResourcesFromIcons(resourceIcons) {
    const resources = {};
    resourceIcons.forEach((img) => {
        Object.keys(resourceTypes).forEach((resource) => {
            if (img.src.includes(resourceTypes[resource])) {
                resources[resource] = (resources[resource] || 0) + 1;
            }
        });
    });
    return resources;
}

// Step 1: Observe game log and start tracking players and resources
function observeGameLog() {
    const logElement = document.querySelector("#game-log-text");
    if (!logElement) {
        console.error("Game log element not found. Retrying...");
        setTimeout(observeGameLog, 1000); // Retry after 1 second
        return;
    }

    console.log("Game log found. Setting up observer...");
    initializePlayers(logElement);

    const logObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("message-post")) {
                    parseLogMessage(node);
                }
            });
        });
    });

    logObserver.observe(logElement, { childList: true });
}

// Extract player name
function extractPlayerName(messageElement) {
    const playerNameElement = messageElement.querySelector(".semibold");
    return playerNameElement ? playerNameElement.textContent.trim() : null;
}

// Step 2: Initialize all players
function initializePlayers(logElement) {
    console.log("Initializing players...");
    const playerMessages = Array.from(logElement.querySelectorAll(".message-post")).filter((message) =>
        message.textContent.includes("placed a")
    );

    playerMessages.forEach((message) => {
        const playerName = extractPlayerName(message);
        if (playerName && !playerResources[playerName]) {
            playerResources[playerName] = { wood: 0, brick: 0, wheat: 0, sheep: 0, stone: 0 };
        }
    });

    console.log("Initialized players:", playerResources);
    renderResourceTable();
}

// Parse log messages
function parseLogMessage(messageElement) {
    const textContent = messageElement.textContent.trim();
    console.log("Parsing message:", textContent);

    if (textContent.includes("received starting resources")) {
        const player = extractPlayerName(messageElement);
        const resources = extractResourcesFromIcons(messageElement.querySelectorAll("img"));
        updatePlayerResources(player, resources);
    } else if (textContent.includes("got")) {
        const player = extractPlayerName(messageElement);
        const resources = extractResourcesFromIcons(messageElement.querySelectorAll("img"));
        updatePlayerResources(player, resources);
    } else if (textContent.includes("gave") && textContent.includes("and got") && textContent.includes("from")) {
        handleTrade(messageElement);
    }
}

// Handle trading
function handleTrade(messageElement) {
    console.log("Handling trade:", messageElement);

    const giverElement = messageElement.querySelector(".semibold:first-of-type");
    const receiverElement = messageElement.querySelector(".semibold:last-of-type");

    const giverPlayer = giverElement ? giverElement.textContent.trim() : null;
    const receiverPlayer = receiverElement ? receiverElement.textContent.trim() : null;

    if (!giverPlayer || !receiverPlayer) {
        console.error("Failed to extract player names from trade message");
        return;
    }

    const resourceIcons = Array.from(messageElement.querySelectorAll("img.lobby-chat-text-icon"));
    const givenResources = extractResourcesFromIcons(resourceIcons.slice(0, Math.floor(resourceIcons.length / 2)));
    const receivedResources = extractResourcesFromIcons(resourceIcons.slice(Math.floor(resourceIcons.length / 2)));

    updatePlayerResources(giverPlayer, negateResources(givenResources));
    updatePlayerResources(giverPlayer, receivedResources);
    updatePlayerResources(receiverPlayer, negateResources(receivedResources));
    updatePlayerResources(receiverPlayer, givenResources);

    console.log(
        `Trade processed: ${giverPlayer} gave ${JSON.stringify(givenResources)} and got ${JSON.stringify(receivedResources)} from ${receiverPlayer}`
    );
}

// Negate resource counts
function negateResources(resources) {
    const negated = {};
    Object.keys(resources).forEach((key) => {
        negated[key] = -resources[key];
    });
    return negated;
}

// Update player resources
function updatePlayerResources(player, resources) {
    if (!player) return;
    if (!playerResources[player]) {
        playerResources[player] = { wood: 0, brick: 0, wheat: 0, sheep: 0, stone: 0 };
    }
    Object.keys(resources).forEach((resource) => {
        playerResources[player][resource] += resources[resource];
    });
    console.log(`Updated resources for ${player}:`, playerResources[player]);
    renderResourceTable();
}

// Render resource table
function renderResourceTable() {
    const existingTable = document.getElementById("resource-table");
    if (existingTable) existingTable.remove();

    const table = document.createElement("table");
    table.id = "resource-table";
    table.style.position = "absolute";
    table.style.left = tablePosition.left;
    table.style.top = tablePosition.top;

    const headerRow = table.insertRow();
    headerRow.insertCell().innerText = "Player";
    Object.keys(resourceTypes).forEach((resource) => {
        const cell = headerRow.insertCell();
        cell.innerText = resource.charAt(0).toUpperCase() + resource.slice(1);
    });

    Object.keys(playerResources).forEach((player) => {
        const row = table.insertRow();
        row.insertCell().innerText = player;
        Object.keys(resourceTypes).forEach((resource) => {
            row.insertCell().innerText = playerResources[player][resource] || 0;
        });
    });

    makeTableDraggable(table);
    document.body.appendChild(table);
}

// Make table draggable
function makeTableDraggable(table) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    table.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - table.getBoundingClientRect().left;
        offsetY = e.clientY - table.getBoundingClientRect().top;
        table.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            table.style.left = `${e.clientX - offsetX}px`;
            table.style.top = `${e.clientY - offsetY}px`;
            tablePosition.left = `${e.clientX - offsetX}px`;
            tablePosition.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            table.style.cursor = "grab";
        }
    });
}

// Initialize the extension
function init() {
    console.log("Initializing Colonassist...");
    observeGameLog();
}

init();
