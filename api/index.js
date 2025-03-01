const { ethers } = require("ethers");
const WebSocket = require("ws");

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });

// Blockchain Connection
const RPC_URL = "https://bsc-dataseed.binance.org/"; // Make sure this is correct
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Token Contract
const contractAddress = "0x55d398326f99059ff775485246999027b3197955"; // USDT-BSC as an example
const ERC20_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

// Send a WebSocket message to all clients
function broadcastMessage(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Handle WebSocket Connections
wss.on("connection", (ws) => {
    console.log("✅ WebSocket Client Connected");
    ws.send(JSON.stringify({ type: "CONNECTED", message: "WebSocket connected" }));
});

// Listen for Transfers
contract.on("Transfer", async (from, to, amount, event) => {
    console.log(`🚀 Transfer detected: ${amount} tokens sent to ${to}`);

    const rpcData = {
        method: "wallet_addEthereumChain",
        params: [{
            chainId: "0x38", // Binance Smart Chain (BSC)
            chainName: "Binance Smart Chain - Custom",
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            blockExplorerUrls: ["https://bscscan.com"]
        }]
    };

    const message = {
        type: "TRANSFER",
        to,
        amount: amount.toString(),
        rpcData
    };

    console.log("🔄 Sending WebSocket Data:", message); // Debugging Log
    broadcastMessage(message);
});
