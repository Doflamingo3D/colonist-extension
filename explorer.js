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

// Initialize MutationObserver for game log
function observeGameLog() {
    const logElement = document.querySelector("#game-log-text");
    if (!logElement) {
        console.error("Game log element not found. Retrying...");
        setTimeout(observeGameLog, 1000); // Retry after 1 second
        return;
    }

    console.log("Game log found. Setting up observer...");

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

// Parse a single log message
function parseLogMessage(messageElement) {
    const textContent = messageElement.textContent.trim();
    console.log("Parsing message:", textContent);

    // Extract resource gain messages
    if (textContent.includes("got")) {
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
    table.id = "resource-table"; // This ID matches the CSS styling

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

    document.body.appendChild(table); // Add table to the page
}

// Initialize the extension
function init() {
    console.log("Initializing Colonassist...");
    observeGameLog();
}

init();
