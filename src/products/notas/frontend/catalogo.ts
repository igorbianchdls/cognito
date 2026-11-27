// Emojis do seletor de ícone e capas prontas (gradientes e cores), como no seletor do Notion.
export const EMOJIS = ('📄 📝 📌 📎 📁 📂 🗂️ 📅 📆 🗓️ 📊 📈 📉 📋 📑 🧾 💼 🏢 🏠 🏷️ 💡 🔥 ⭐ ✨ 🎯 🚀 ✅ ☑️ ❗ ❓ ⚠️ 🔒 🔑 🔔 📣 💬 💭 🗨️ 📞 ✉️ ' +
  '📦 🛒 💰 💵 💳 🧮 🏦 📐 🧭 🗺️ 🌎 🌱 🌻 🍀 🌈 ☀️ 🌙 ⚡ 🔧 🛠️ ⚙️ 🧪 🧠 🤖 💻 🖥️ 📱 🎨 🎬 🎵 🎧 📷 📚 📖 🎓 🏆 🥇 🎉 🎁 ' +
  '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 👍 👏 🙌 🤝 👀 🙂 😀 😎 🤔 😅 🥳 🧑‍💻 👥 👤 🐶 🐱 🦊 🐼 🐝 🦋 🍕 ☕ 🍰 🍎 ✈️ 🚗 🏁 🧩 🗝️ ⏰ ⏳ 🔍 🧹').split(' ')

export const emojiAleatorio = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)]

/** Capas prontas: o valor guardado é "cor:<css>" (gradiente ou cor); imagem enviada é a URL. */
/** Ilustrações de capa (arquivos do próprio Otto, em public/capas-notas; funcionam também no link público). */
export const ILUSTRACOES = [
  ['aurora', 'Aurora'], ['por-do-sol', 'Pôr do sol'], ['ondas', 'Ondas'], ['montanhas', 'Montanhas'], ['ceu-estrelado', 'Céu estrelado'], ['oceano', 'Oceano'],
  ['floresta', 'Floresta'], ['dunas', 'Dunas'], ['lavanda', 'Lavanda'], ['aquarela', 'Aquarela'], ['pastel', 'Pastel'], ['curvas-de-nivel', 'Curvas de nível'],
].map(([arquivo, nome]) => ({ nome, capa: `/capas-notas/${arquivo}.svg` }))

export const CAPAS = [
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  '#e16259', '#d9730d', '#dfab01', '#0f7b6c', '#0b6e99', '#6940a5', '#ad1a72', '#9b9a97',
].map(css => `cor:${css}`)

/** Estilo do fundo de uma capa guardada. */
export function estiloCapa(capa: string | null, posicao = 50): React.CSSProperties {
  if (!capa) return {}
  if (capa.startsWith('cor:')) return { background: capa.slice(4) }
  return { backgroundImage: `url("${capa.replace(/"/g, '%22')}")`, backgroundPosition: `center ${posicao}%` }
}
