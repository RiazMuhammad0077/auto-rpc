require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });

// Wallet A (Sender) Address
const walletA = "0x50977e1A7B02D947e5Ea1B3B23d94F0ced809FEd"; // Replace with actual Wallet A address

// RPC Details (Replace with Your Custom RPC)
const rpcData = {
    chainId: "0x38", // Binance Smart Chain Mainnet
    chainName: "Binance Smart Chain - Custom",
    rpcUrls: ["https://virtual.binance.rpc.tenderly.co/ed2bb519-52ab-4239-be46-069d0e31947a"],
    nativeCurrency: {
        name: "BNB",
        symbol: "BNB",
        decimals: 18
    },
    blockExplorerUrls: ["https://bscscan.com"]
};

// Listen for WebSocket connections
wss.on("connection", (ws) => {
    console.log("✅ New WebSocket client connected");

    ws.on("message", (message) => {
        console.log(`📩 Received from client: ${message}`);
    });

    ws.send(JSON.stringify({ type: "CONNECTED", message: "WebSocket connected" }));
});

// Blockchain Connection
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");

// Token Contract Address
const contractAddress = "0x55d398326f99059fF775485246999027B3197955"; // Replace with your token contract address
const ERC20_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const tokenContract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

// Listen for Transfers from Wallet A
tokenContract.on("Transfer", async (from, to, amount, event) => {
    if (from.toLowerCase() === walletA.toLowerCase()) {
        console.log(`🚀 Transfer detected: ${amount} tokens sent to ${to}`);

        // Send WebSocket notification to Wallet B
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    type: "TRANSFER",
                    to,
                    amount: amount.toString(),
                    rpcData
                });
                console.log("🔄 Sending WebSocket Data:", message);
                client.send(message);
            }
        });
    }
});

// API to fetch RPC Data (For Manual Fetching)
app.get("/rpc-data", (req, res) => {
    res.json({ success: true, rpcData });
});

// Start Express Server
app.listen(3000, () => {
    console.log("🚀 Backend running on port 3000");
});
