Here's a comprehensive list of **Node.js server best practices** to maximize performance, avoid crashes, and implement retry logic effectively.

---

## 🚀 1. **Performance Best Practices**

### ✅ Use Clustering

Use Node's built-in `cluster` module to utilize all CPU cores:

```js
import cluster from 'cluster';
import os from 'os';
import http from 'http';

if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  http.createServer((req, res) => {
    res.end('Hello from Worker!');
  }).listen(3000);
}
```

---

### ✅ Use Asynchronous/Non-blocking Code

Avoid CPU-intensive tasks on the main thread. Offload heavy computation to **worker threads** or background queues.

```js
import { Worker } from 'worker_threads';

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

---

### ✅ Use Compression & Caching

```js
import compression from 'compression';
app.use(compression()); // GZIP responses

// Cache headers
res.set('Cache-Control', 'public, max-age=86400'); // 1 day
```

---

### ✅ Avoid Memory Leaks

* Use memory profiling tools like Chrome DevTools, `clinic.js`, or `memwatch-next`.
* Avoid global variables, large unreferenced objects, etc.

---

## 🛑 2. **Crash Avoidance (Stability & Resilience)**

### ✅ Use Process Managers

Use **PM2**, **forever**, or **Docker restart policies** to auto-restart on crash:

```bash
pm2 start server.js --name myapp --watch --max-restarts 5
```

---

### ✅ Catch Uncaught Exceptions

```js
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Let PM2 restart
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

---

### ✅ Graceful Shutdown

```js
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
```

---

## 🔁 3. **Retry & Fault Tolerance**

### ✅ Retry Failed Requests (e.g., DB, API)

Use libraries like `axios-retry` or write your own exponential backoff:

```js
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
```

Or:

```js
async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(res => setTimeout(res, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}
```

---

### ✅ Circuit Breaker Pattern

Use libraries like `opossum`:

```js
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(myApiCall, { timeout: 3000, errorThresholdPercentage: 50 });
breaker.fire().then(...).catch(...);
```

---

## 🧪 4. **Monitoring & Logging**

### ✅ Use Logging (Winston, Pino)

```js
import winston from 'winston';
const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});
```

### ✅ Use Health Checks

```js
app.get('/health', (req, res) => res.send('OK'));
```

### ✅ Monitor with Tools

* **PM2** monitoring dashboard (`pm2 monit`)
* **Prometheus + Grafana**
* **New Relic**, **Datadog**, **Sentry**, **LogRocket**

---

## ✅ 5. **Security Practices (Bonus)**

* Use `helmet` for HTTP header security.
* Validate all input using `Joi` or `Zod`.
* Use HTTPS.
* Rate-limit APIs (with `express-rate-limit`).
* Sanitize data (against NoSQL injection, XSS).

---

## Summary Checklist

| Category      | Best Practice                              |
| ------------- | ------------------------------------------ |
| Performance   | Clustering, Async Code, Caching            |
| Crash Control | PM2, Graceful shutdown, Exception Handlers |
| Retry Logic   | Exponential Backoff, Circuit Breaker       |
| Monitoring    | Logs, Health Checks, Observability         |
| Security      | Helmet, Rate Limiting, Input Validation    |

---

Would you like me to generate a production-ready Express.js boilerplate with these features?
  use express rate limit..