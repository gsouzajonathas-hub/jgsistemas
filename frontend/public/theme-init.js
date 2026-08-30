// Aplica o tema salvo antes do React montar, evitando flash de tema errado (FOUC).
// Script clássico externo (não-inline) para ser permitido pela CSP do build.
(function () {
  var saved = localStorage.getItem('theme');
  var dark = saved ? saved === 'dark' : false;
  if (dark) document.documentElement.classList.add('dark');
})();