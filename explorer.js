console.log("Colonassist started...");

let playerResources = {}; // Stores resource counts for each player
let tablePosition = { top: "10px", left: "10px" }; // Default position

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

// Extract player name from message
function extractPlayerName(messageElement) {
    const playerNameElement = messageElement.querySelector(".semibold");
    return playerNameElement ? playerNameElement.textContent.trim() : null;
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
    }

    // Handle resource gains from dice rolls
    else if (textContent.includes("got")) {
        const player = extractPlayerName(messageElement);
        const resources = extractResources(messageElement);
        updatePlayerResources(player, resources);
    }

    // Handle trading
    else if (textContent.includes("gave") && textContent.includes("and got") && textContent.includes("from")) {
        handleTrade(messageElement); // Detect and process trades
    }
}

// Handle trading
function handleTrade(messageElement) {
    console.log("Handling trade:", messageElement);

    const messageParts = messageElement.textContent.split(" and got ");
    if (messageParts.length !== 2) {
        console.error("Trade message format invalid:", messageElement.textContent);
        return;
    }

    const [giverPart, receiverPart] = messageParts;
    const [giverPlayer, givenResources] = extractTradeDetails(giverPart, "gave");
    const [receiverPlayer, receivedResources] = extractTradeDetails(receiverPart, "from");

    if (!giverPlayer || !receiverPlayer) {
        console.error("Failed to extract player names from trade message");
        return;
    }

    // Update resources for giver and receiver
    updatePlayerResources(giverPlayer, negateResources(givenResources)); // Deduct resources given
    updatePlayerResources(giverPlayer, receivedResources); // Add resources received
    updatePlayerResources(receiverPlayer, negateResources(receivedResources)); // Deduct resources given
    updatePlayerResources(receiverPlayer, givenResources); // Add resources received

    console.log(`Trade processed: ${giverPlayer} gave ${JSON.stringify(givenResources)} and got ${JSON.stringify(receivedResources)} from ${receiverPlayer}`);
}

// Extract trade details
function extractTradeDetails(messagePart, keyword) {
    const [player, resourcesText] = messagePart.split(keyword).map(part => part.trim());
    const resources = extractResourcesFromIcons(messagePart);
    return [player, resources];
}

// Extract resources from icons
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

// Negate resource counts
function negateResources(resources) {
    const negated = {};
    Object.keys(resources).forEach((key) => {
        negated[key] = -resources[key];
    });
    return negated;
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

    // Apply the saved position
    table.style.position = "absolute";
    table.style.left = tablePosition.left;
    table.style.top = tablePosition.top;

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
            const newLeft = `${e.clientX - offsetX}px`;
            const newTop = `${e.clientY - offsetY}px`;

            table.style.left = newLeft;
            table.style.top = newTop;

            // Update the saved position
            tablePosition.left = newLeft;
            tablePosition.top = newTop;
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
