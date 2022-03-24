var dataCacheName = 'livezilla_v8008';
var cacheName = 'livezilla_v8008';
var filesToCache = [

];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('activate', function(e) {

    e.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (key !== cacheName && key !== dataCacheName) {
                    return caches.delete(key);
                }
            }));
        })
    );

    return self.clients.claim();
});

self.addEventListener('fetch', function(e) {


});

self.addEventListener('notificationclose', function(e) {


});

self.addEventListener('notificationclick', function(e) {

    var event=e,notification = e.notification;
    const rootUrl = new URL('./', location).href;

    event.waitUntil(
        clients.matchAll().then(matchedClients =>
        {
            for (var client of matchedClients)
            {
                if (client.url.indexOf(rootUrl) >= 0 || true)
                {
                    if(notification.tag)
                    {
                        client.postMessage({
                            action: notification.tag
                        });
                    }

                    return client.focus();
                }
            }
            return clients.openWindow(rootUrl).then(function (client) { client.focus(); });
        })
    );
    event.notification.close();
});