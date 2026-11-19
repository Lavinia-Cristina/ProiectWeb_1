/**
 * src/realtime/sse.js
 * Modul Server-Sent Events (SSE) pentru actualizări în timp real fără polling (D-002).
 * Conectează Kitchen Display (KDS), ecranul ospătarului, telefonul clientului, casierul și monitorul central.
 */

class RealtimeSSE {
  constructor() {
    this.clients = new Set();

    // Heartbeat periodic la fiecare 20 secunde pentru menținerea activă a conexiunilor
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 20000);
    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  /**
   * Înregistrează o conexiune nouă SSE.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handleConnection(req, res) {
    if (req.socket) {
      req.socket.setTimeout(0);
      req.socket.setKeepAlive(true);
      if (typeof req.socket.setNoDelay === 'function') {
        req.socket.setNoDelay(true);
      }
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    res.write('retry: 3000\n\n');
    res.write('event: connected\ndata: ' + JSON.stringify({ message: 'SSE conectat la Restaurant Kon Tiki', time: Date.now() }) + '\n\n');

    this.clients.add(res);

    const cleanup = () => {
      this.clients.delete(res);
    };

    req.on('close', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);
  }

  /**
   * Trimite ping de heartbeat tuturor clienților activi.
   */
  sendHeartbeat() {
    for (const client of this.clients) {
      if (client.destroyed || client.writableEnded) {
        this.clients.delete(client);
        continue;
      }
      try {
        client.write(': heartbeat\n\n', (err) => {
          if (err) this.clients.delete(client);
        });
      } catch {
        this.clients.delete(client);
      }
    }
  }

  /**
   * Emite un eveniment cu date JSON către toți clienții conectați.
   * @param {string} eventType - ex. 'order:new', 'order:status', 'table:status', 'stock:update', 'payment:done'
   * @param {object} payload
   */
  broadcast(eventType, payload) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.clients) {
      if (client.destroyed || client.writableEnded) {
        this.clients.delete(client);
        continue;
      }
      try {
        client.write(message, (err) => {
          if (err) this.clients.delete(client);
        });
      } catch {
        this.clients.delete(client);
      }
    }
  }

  /**
   * Returnează numărul de clienți activi conectați.
   */
  getClientCount() {
    return this.clients.size;
  }
}

const sseHub = new RealtimeSSE();
module.exports = sseHub;
