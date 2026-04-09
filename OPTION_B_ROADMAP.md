# Option B: Multi-Client SaaS Roadmap

This document outlines the architectural strategy to transform the Teched Studios WhatsApp Bot into a scalable **Multi-Client Platform**.

## Core Concept
Instead of one bot for one business, the system will support **hundreds of clients**, each with their own:
1.  WhatsApp Number (and QR code).
2.  Custom AI Personality (Niche-specific).
3.  Private Dashboard.
4.  Dedicated API limits.

---

## 1. Multi-Client Architecture (Tenancy)
To handle multiple clients without data leaks, we will migrate to a **Scoped Database Structure** in Firebase:

```text
/clients
  /{client_id}
    /config (AI prompt, niche, business name)
    /status (Connection state, QR code)
    /messages (Log of all chats)
    /api_keys (Specific keys for this client)
```

## 2. Solving API Limits (Account Rotation)
As suggested, to avoid the "Requests Per Minute" limit on Groq/LLM providers, we will implement a **Key Management System**:

- **Key Pool**: We can register multiple free accounts on Groq and pool the keys.
- **Client-Specific Keys**: Premium clients can provide their own API keys, which the bot will use exclusively for them.
- **Dynamic Allocation**: When a user messages Client A, the bot selects an available key from Client A's pool or the global pool.
- **Load Balancing**: If Key 1 hits a rate limit, the bot instantly retries with Key 2.

## 3. Deployment Strategy (Continuous Run-time)
GitHub Actions will be replaced by a **Background Worker Cluster**:

- **Primary Host**: A VPS (DigitalOcean/AWS) running a PM2 cluster.
- **Instance Management**: A "Manager" script that spawns a new Node.js process for each new client added to the platform.
- **Auto-Scale**: As you reach 50+ clients, the Manager script distributes them across multiple small servers.

## 4. The Multi-Client Control Panel
A professional dashboard built with **Next.js/React** where:
- **Admin (You)**: Can see all clients, their connectivity status, and global API health.
- **Client (The User)**: Can log in to see only *their* QR code, their subscription status, and their conversation logs.

---

## Next Steps for Phase 2:
1.  **Refactor Bot Logic**: Update `index.js` to accept a `clientId` and use scoped Firebase paths.
2.  **Key Vault**: Set up a rotation service in `brain.js`.
3.  **Client Dashboard**: Extend the modern dashboard into a multi-user portal.

---
**Teched Studios AI Bot - Version 2.0 Roadmap**
