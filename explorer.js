console.log("Colonassist started...");

// Variables
let logElement = null;
let players = [];
let playerResources = {};

// Resource types
const resourceTypes = {
    wood: "card_lumber",
    brick: "card_brick",
    wheat: "card_grain",
    sheep: "card_wool",
    stone: "card_ore"
};

// Initialize MutationObserver for game log
function observeGameLog() {
    const logObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                parseLogMessage(mutation.addedNodes[0]);
            }
        });
    });

    if (logElement) {
        logObserver.observe(logElement, { childList: true });
        console.log("Started observing game log...");
    } else {
        console.error("Game log element not found.");
    }
}

// Parse individual log messages
function parseLogMessage(messageElement) {
    const textContent = messageElement.textContent;

    // Check for resource gains
    if (textContent.includes("got:")) {
        const player = extractPlayerName(textContent);
        const resources = extractResources(messageElement);
        updatePlayerResources(player, resources);
    }

    // Check for trades, builds, etc. (add further logic as needed)
}

// Extract player name from message
function extractPlayerName(text) {
    return text.split(" ")[0]; // Example logic; adjust based on log format
}

// Extract resources from message element
function extractResources(messageElement) {
    const resources = {};
    const images = messageElement.querySelectorAll("img");
    images.forEach((img) => {
        const resourceType = Object.keys(resourceTypes).find((key) => img.src.includes(resourceTypes[key]));
        if (resourceType) {
            resources[resourceType] = (resources[resourceType] || 0) + 1;
        }
    });
    return resources;
}

// Update player resources
function updatePlayerResources(player, resources) {
    if (!playerResources[player]) {
        playerResources[player] = { wood: 0, brick: 0, wheat: 0, sheep: 0, stone: 0 };
    }
    Object.keys(resources).forEach((resource) => {
        playerResources[player][resource] += resources[resource];
    });
    console.log(`Updated resources for ${player}:`, playerResources[player]);
}

// Initialize
function init() {
    logElement = document.getElementById("game-log-text");
    if (logElement) {
        console.log("Game log found, initializing...");
        observeGameLog();
    } else {
        console.error("Game log not found. Retrying...");
        setTimeout(init, 1000);
    }
}

init();

