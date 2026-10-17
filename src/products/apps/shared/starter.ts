import type { AppPackage } from './contracts'

const styles = '*{box-sizing:border-box}body{margin:0;background:#f7f6fc;color:#242034;font:15px system-ui}main{max-width:700px;margin:60px auto;padding:32px}.tag{font-size:11px;letter-spacing:2px;color:#7259d6}h1{font-size:36px;margin-bottom:12px}p{color:#777184}form{display:flex;gap:10px;margin:30px 0}input{flex:1;min-width:0;padding:14px;border:1px solid #ddd7ed;border-radius:10px}button{background:#7259d6;color:white;border:0;border-radius:10px;padding:12px 20px;cursor:pointer}ul{list-style:none;padding:0}li{background:white;margin:10px 0;padding:18px;border-radius:12px;display:flex;justify-content:space-between;align-items:center}li button{background:#f0edf8;color:#7259d6;padding:6px 10px}'

// Same example in both models: a shared list of ideas saved with otto.data.
const reactApp = `import { useEffect, useState } from 'react'

export default function App() {
  const [itens, setItens] = useState([])
  const [titulo, setTitulo] = useState('')
  const [status, setStatus] = useState('')

  async function carregar() {
    const resposta = await otto.data.list('itens')
    setItens(resposta.registros)
  }
  useEffect(() => { otto.ready().then(carregar).catch(e => setStatus(e.message)) }, [])

  async function adicionar(event) {
    event.preventDefault()
    try { await otto.data.save('itens', { dados: { titulo } }); setTitulo(''); await carregar(); setStatus('Salvo') }
    catch (e) { setStatus(e.message) }
  }
  async function remover(item) {
    try { await otto.data.remove('itens', item.id, item.versao_concorrencia); await carregar() }
    catch (e) { setStatus(e.message) }
  }

  return (
    <main>
      <span className="tag">MEU APP</span>
      <h1>Organize suas ideias</h1>
      <p>Um espaço da sua empresa, do seu jeito.</p>
      <form onSubmit={adicionar}>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Escreva uma ideia" required maxLength={200} />
        <button>Adicionar</button>
      </form>
      <p role="status">{status}</p>
      <ul>
        {itens.map(item => <li key={item.id}><span>{item.dados.titulo}</span><button onClick={() => remover(item)}>Remover</button></li>)}
      </ul>
    </main>
  )
}
`
const reactBlank = `export default function App() {
  return <main><span className="tag">MEU APP</span><h1>Olá, mundo!</h1><p>Um espaço da sua empresa, do seu jeito.</p></main>
}
`

export function starter(collectionId: string, example = true, modelo: 'html' | 'react' = 'html'): AppPackage {
  const colecoes = example ? [{ id: collectionId, chave: 'itens', nome: 'Itens', campos: [{ id: 'titulo', nome: 'Título', tipo: 'texto' as const, obrigatorio: true }] }] : []
  if (modelo === 'react') return {
    manifesto: { formato: 1, entrada: 'index.html', modelo: 'react', principal: 'src/main.jsx', tabelas: [], colecoes },
    arquivos: [
      { caminho: 'index.html', codificacao: 'utf8', conteudo: '<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"></head><body><div id="root"></div><script src="src/main.jsx"></script></body></html>' },
      { caminho: 'src/main.jsx', codificacao: 'utf8', conteudo: "import { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './styles.css'\n\ncreateRoot(document.getElementById('root')).render(<App />)\n" },
      { caminho: 'src/App.jsx', codificacao: 'utf8', conteudo: example ? reactApp : reactBlank },
      { caminho: 'src/styles.css', codificacao: 'utf8', conteudo: styles },
    ],
  }
  return {
    manifesto: { formato: 1, entrada: 'index.html', modelo: 'html', principal: 'src/main.jsx', tabelas: [], colecoes },
    arquivos: [
      { caminho: 'index.html', codificacao: 'utf8', conteudo: '<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><link rel="stylesheet" href="styles.css"></head><body><main><span class="tag">MEU APP</span><h1>' + (example ? 'Organize suas ideias' : 'Olá, mundo!') + '</h1><p>Um espaço da sua empresa, do seu jeito.</p>' + (example ? '<form id="form"><input id="titulo" placeholder="Escreva uma ideia" required maxlength="200"><button>Adicionar</button></form><p id="status" role="status"></p><ul id="lista"></ul>' : '') + '</main><script src="app.js"></script></body></html>' },
      { caminho: 'styles.css', codificacao: 'utf8', conteudo: styles },
      { caminho: 'app.js', codificacao: 'utf8', conteudo: example ? `async function render(){const r=await otto.data.list('itens');const list=document.querySelector('#lista');list.replaceChildren();for(const item of r.registros){const li=document.createElement('li'),label=document.createElement('span'),button=document.createElement('button');label.textContent=item.dados.titulo;button.textContent='Remover';button.onclick=async()=>{try{await otto.data.remove('itens',item.id,item.versao_concorrencia);await render()}catch(e){status(e.message)}};li.append(label,button);list.append(li)}}\nfunction status(text){document.querySelector('#status').textContent=text}\ndocument.querySelector('#form').onsubmit=async e=>{e.preventDefault();try{await otto.data.save('itens',{dados:{titulo:document.querySelector('#titulo').value}});e.target.reset();await render();status('Salvo')}catch(e){status(e.message)}};otto.ready().then(render).catch(e=>status(e.message));` : 'otto.ready().then(()=>console.log("App pronto"));' },
    ],
  }
}
