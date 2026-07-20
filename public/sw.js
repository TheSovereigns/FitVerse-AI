const CACHE_NAME = "fitverse-v3"
const STATIC_ASSETS = [
  "/",
  "/icon-192.svg",
  "/icon-512.svg",
  "/favicon.svg",
]

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: cache-first for static, network-first for API
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  // Skip API calls (let them go to network)
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "Offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    )
    return
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } }))

      return cached || fetched
    })
  )
})

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: "FitVerse AI", body: event.data.text() }
  }

  const options = {
    body: data.body || "New notification from FitVerse AI",
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    vibrate: [100, 50, 100],
    data: data.url || "/",
    actions: data.actions || [],
    tag: data.tag || "fitverse-notification",
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "FitVerse AI", options)
  )
})

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data || "/"

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Open new window
      return clients.openWindow(url)
    })
  )
})
