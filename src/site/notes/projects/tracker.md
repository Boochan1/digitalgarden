---
tags: project
title: FiveM Player Tracker
description: A Python-based GUI tool built to monitor player pings and network data on FiveM servers.
date: 2026-04-05
---

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FiveM Server Monitor</title>
    <style>
        :root {
            --bg-color: #1a1a1a;
            --container-bg: #2b2b2b;
            --input-bg: #1e1e1e;
            --text-main: #ebebeb;
            --text-dim: #919191;
            --accent-blue: #1f538d;
            --accent-hover: #14375e;
            --border-color: #3f3f3f;
            --success-green: #50fa7b;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            padding: 20px;
            margin: 0;
        }

        .monitor-card {
            background-color: var(--container-bg);
            width: 100%;
            max-width: 500px;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border: 1px solid var(--border-color);
        }

        h1 { font-size: 22px; text-align: center; margin-bottom: 20px; }

        .controls { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; }

        input {
            background: var(--input-bg);
            border: 1px solid var(--border-color);
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            width: 120px;
            text-align: center;
            font-family: 'Consolas', monospace;
        }

        button {
            background: var(--accent-blue);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }

        button:hover { background: var(--accent-hover); }

        .status-bar {
            background: #212121;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            font-weight: bold;
            margin-bottom: 15px;
            border: 1px solid var(--border-color);
            color: var(--accent-blue);
        }

        .table-container {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid var(--border-color);
            border-radius: 5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Consolas', monospace;
            font-size: 13px;
        }

        th {
            position: sticky;
            top: 0;
            background: #333;
            text-align: left;
            color: var(--text-dim);
            padding: 10px 5px;
            z-index: 1;
        }

        td { padding: 10px 5px; border-bottom: 1px solid var(--border-color); }

        .ping-cell { text-align: right; color: var(--success-green); }

        .footer {
            margin-top: 15px;
            font-size: 11px;
            color: var(--text-dim);
            text-align: center;
        }
    </style>
</head>
<body>

    <div class="monitor-card">
        <h1>FiveM Player Tracker</h1>

        <div class="controls">
            <input type="text" id="serverInput" placeholder="Code (e.g. l9yp9v)" maxlength="6">
            <button onclick="changeServer()">Switch Server</button>
        </div>

        <div id="status" class="status-bar">Refreshing...</div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th width="15%">ID</th>
                        <th width="65%">Player Name</th>
                        <th width="20%" style="text-align: right;">Ping</th>
                    </tr>
                </thead>
                <tbody id="playerList">
                    <tr><td colspan="3" style="text-align:center; padding:20px; color:#666;">Waiting for data...</td></tr>
                </tbody>
            </table>
        </div>

        <div class="footer" id="lastUpdated">Initializing...</div>
    </div>

    <script>
        let currentCode = "l9yp9v"; 
        let refreshInterval = null;

        // Using AllOrigins raw proxy as it's often more reliable for Cfx.re calls
        const PROXY_URL = "https://api.allorigins.win/raw?url=";

        async function updateTracker() {
            if (!currentCode) return;

            const statusEl = document.getElementById('status');
            const listEl = document.getElementById('playerList');
            const footerEl = document.getElementById('lastUpdated');
            const apiUrl = `https://servers-frontend.fivem.net/api/servers/single/${currentCode}`;

            try {
                // We add a cache-buster timestamp to ensure we get fresh data
                const targetUrl = `${apiUrl}?t=${Date.now()}`;
                const response = await fetch(PROXY_URL + encodeURIComponent(targetUrl));
                
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

                const json = await response.json();
                console.log("Server Data:", json); // Debug info in console

                if (!json || !json.Data) {
                    throw new Error("Invalid response from FiveM API");
                }

                const data = json.Data;
                const players = data.players || [];
                const max = (data.vars && data.vars.sv_maxClients) || "??";

                statusEl.innerText = `Online: ${players.length} / ${max}`;
                
                // Sort by ID
                players.sort((a, b) => parseInt(a.id) - parseInt(b.id));

                if (players.length > 0) {
                    listEl.innerHTML = players.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.name.toString().substring(0, 25).replace(/</g, "&lt;")}</td>
                            <td class="ping-cell">${p.ping}ms</td>
                        </tr>
                    `).join('');
                } else {
                    listEl.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">No players online.</td></tr>`;
                }

                footerEl.innerText = `Server: ${currentCode} | Last updated: ${new Date().toLocaleTimeString()}`;

            } catch (err) {
                console.error("Tracker Error:", err);
                statusEl.innerText = "Status: Error (Check Console)";
                listEl.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#ff5555;">Failed to fetch server data.<br><small>${err.message}</small></td></tr>`;
            }
        }

        function changeServer() {
            const input = document.getElementById('serverInput').value.trim().toLowerCase();
            if (input.length === 6) {
                currentCode = input;
                document.getElementById('status').innerText = "Refreshing...";
                updateTracker();

                clearInterval(refreshInterval);
                refreshInterval = setInterval(updateTracker, 60000);
            } else {
                alert("Please enter a valid 6-digit FiveM code.");
            }
        }

        // Setup UI and initial load
        document.getElementById('serverInput').value = currentCode;
        updateTracker();
        refreshInterval = setInterval(updateTracker, 60000);
    </script>
</body>
</html>
