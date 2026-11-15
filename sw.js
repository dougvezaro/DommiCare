/* HomeFlow — sw.js
   Guarda o "esqueleto" do app (página, ícones, manifesto) para abrir rápido e funcionar como app no celular.
   Os dados NÃO passam por aqui: as chamadas para o servidor (Apps Script) vão direto para a internet.
   Estratégia: entrega a cópia guardada e atualiza em segundo plano (na próxima abertura já vem a versão nova).
   O número da versão acompanha o VERSAO_APP do index.html. */
var CACHE = 'homeflow-v1';
var ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icone-180.png', './icone-192.png', './icone-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('homeflow-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;           // servidor, fontes etc.: direto na rede
  if (url.search.indexOf('nocache') !== -1) return;      // "Procurar atualização"
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (guardado) {
      var rede = fetch(req).then(function (r) {
        if (r && r.ok) c.put(req, r.clone());
        return r;
      }).catch(function () { return guardado; });
      return guardado || rede;
    });
  }));
});
