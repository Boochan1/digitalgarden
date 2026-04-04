// src/site/scripts/reactions.js

// --- YOUR CREDENTIALS ---
const SUPABASE_URL = 'https://pnmghvoxtmphpejmrklm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Gaa3N9dO5HCk0EKDLXVXaw_J8gZHVKI';

// --- HTML ELEMENTS ---
const reactionZone = document.getElementById('reaction-zone');
const inputField = document.getElementById('reaction-input');
const sendBtn = document.getElementById('send-btn');
const container = document.getElementById('reactions-container');

// Grab the filename of the current thought (e.g., "2026-04-04")
const currentSlug = reactionZone.getAttribute('data-slug');

// --- 1. FETCH AND DISPLAY REACTIONS ---
async function loadReactions() {
    // We use the REST API to grab comments for this specific thought
    const response = await fetch(`${SUPABASE_URL}/rest/v1/reactions?thought_slug=eq.${currentSlug}&select=*&order=created_at.desc`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    
    const reactions = await response.json();
    
    // Clear the loading state
    container.innerHTML = '';

    // Only show up to 3 bubbles as requested
    const displayReactions = reactions.slice(0, 3);

    displayReactions.forEach(reaction => {
        // Calculate a simple "time ago" string
        const date = new Date(reaction.created_at);
        const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        // Build the custom speech bubble HTML
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerHTML = `
            <p>${reaction.message}</p>
            <span class="bubble-time">${timeString}</span>
        `;
        container.appendChild(bubble);
    });

    if (displayReactions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No reactions yet. Be the first!</p>';
    }
}

// --- 2. SEND A NEW REACTION ---
async function sendReaction() {
    const message = inputField.value.trim();
    if (!message) return;

    // Change button text temporarily
    sendBtn.innerText = 'Sending...';

    // POST the new message to Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/reactions`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            thought_slug: currentSlug,
            message: message
        })
    });

    // Clear the input and reload the bubbles to show the new one
    inputField.value = '';
    sendBtn.innerText = 'Send';
    loadReactions();
}

// --- EVENT LISTENERS ---
// Trigger send on button click
sendBtn.addEventListener('click', sendReaction);

// Trigger send on 'Enter' key
inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendReaction();
    }
});

// Load comments as soon as the script runs
loadReactions();
