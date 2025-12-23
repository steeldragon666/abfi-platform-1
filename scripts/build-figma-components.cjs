/**
 * Build ABFI Figma Components via WebSocket
 * Connects to figma-mcp-write-server and creates pages/components
 */

const WebSocket = require('ws');
const path = require('path');

const WS_URL = 'ws://localhost:8765';
let requestId = 0;
const pendingRequests = new Map();

// Pages to create according to FIGMA_REDESIGN_TODO.md
const PAGES = [
  '00 — Element Studies (Reference Only)',
  '01 — Tokens & Variables',
  '02 — UI Components',
  '03 — Domain Components (BF)',
  '99 — Design Authority Locked',
];

// Wait for response with timeout
function waitForResponse(ws, id, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Timeout waiting for response to ${id}`));
    }, timeout);

    pendingRequests.set(id, { resolve, reject, timer });
  });
}

// Send operation and wait for response
async function sendOperation(ws, type, payload) {
  const id = `req-${++requestId}`;
  const msg = JSON.stringify({ type, payload: { ...payload, requestId: id } });
  console.log(`[SEND] ${type}:`, JSON.stringify(payload).slice(0, 100));
  ws.send(msg);

  try {
    const response = await waitForResponse(ws, id);
    console.log(`[RECV] ${type}: OK`);
    return response;
  } catch (error) {
    console.log(`[RECV] ${type}: ${error.message}`);
    return null;
  }
}

// Create page structure
async function createPages(ws) {
  console.log('\n=== Creating Pages ===');

  // First, list existing pages
  const listResult = await sendOperation(ws, 'MANAGE_PAGES', { operation: 'list' });

  for (const pageName of PAGES) {
    console.log(`Creating page: ${pageName}`);
    await sendOperation(ws, 'MANAGE_PAGES', {
      operation: 'create',
      name: pageName
    });
  }

  // Rename Page 1 to something useful
  await sendOperation(ws, 'MANAGE_PAGES', {
    operation: 'update',
    pageId: '0:1',
    name: '📋 Instructions'
  });
}

// Main execution
async function main() {
  console.log('Connecting to Figma MCP Write Server...');

  const ws = new WebSocket(WS_URL);

  ws.on('open', async () => {
    console.log('Connected to WebSocket server');

    // Handle responses
    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        // Try to find matching request by checking response content
        for (const [id, handler] of pendingRequests.entries()) {
          clearTimeout(handler.timer);
          handler.resolve(response);
          pendingRequests.delete(id);
          break;
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    });

    try {
      // Test connection first
      console.log('\n=== Testing Connection ===');
      await sendOperation(ws, 'PING_TEST', { timestamp: Date.now() });

      // Create pages
      await createPages(ws);

      console.log('\n=== Build Complete ===');
    } catch (error) {
      console.error('Error:', error.message);
    }

    // Close connection
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 2000);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
    process.exit(1);
  });
}

main();
