import { applyLanguage, detectLanguage, translate } from './i18n.js';
import { bindTheme } from './theme.js';

let saved;
try { saved = localStorage.getItem('lang'); } catch {}
let language = detectLanguage(saved, navigator.language);
const languageButton = document.querySelector('#language-toggle');
const updateTheme = bindTheme(document.querySelector('#theme-toggle'), key => translate(key, language));
function update() {
  applyLanguage(document, language);
  languageButton.lang = language === 'pt-BR' ? 'en' : 'pt-BR';
  updateTheme();
}
languageButton.addEventListener('click', () => {
  language = language === 'pt-BR' ? 'en' : 'pt-BR';
  try { localStorage.setItem('lang', language); } catch {}
  update();
});
languageButton.hidden = false;
update();
