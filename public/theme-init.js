// Anti-FOUC do tema: aplica a classe `dark` em <html> antes do React
// montar para evitar flash branco no carregamento. Lê a preferência
// salva em localStorage; quando "system" (ou ausente), respeita o
// prefers-color-scheme do SO. O ThemeProvider sincroniza a partir daí.
//
// Arquivo estático (não inline) para passar no CSP estrito do nginx
// (`script-src 'self'`). Carregado bloqueante no <head> — roda antes
// de qualquer paint.
(function () {
  try {
    var pref = localStorage.getItem('autocore:tema')
    var systemDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    var dark =
      pref === 'dark' || ((pref === null || pref === 'system') && systemDark)
    var root = document.documentElement
    if (dark) root.classList.add('dark')
    root.style.colorScheme = dark ? 'dark' : 'light'
  } catch (_) {
    /* localStorage bloqueado — segue com tema claro */
  }
})()
