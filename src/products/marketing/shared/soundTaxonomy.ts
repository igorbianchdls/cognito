// Names of the Epidemic Sound categories and subcategories (the first two parts of each title) in Portuguese.
// A name not listed here shows as it is in Epidemic.

const CATEGORIES: Record<string, string> = {
  Air: 'Ar', Alarms: 'Alarmes', Ambience: 'Ambientes', Animals: 'Animais', Archived: 'Arquivados', 'Bass Drop': 'Queda de grave',
  Beeps: 'Bipes', Bells: 'Sinos', Birds: 'Pássaros', Burn: 'Queima', Calculator: 'Calculadora', Carrot: 'Cenoura',
  Cartoon: 'Desenho animado', 'Cartoon Character': 'Personagem de desenho', 'Cash Register': 'Caixa registradora', Clocks: 'Relógios',
  Cloth: 'Tecido', 'Clothes Hanger': 'Cabide', 'Code Fail 13': 'Falha de código', Communications: 'Comunicação', Computers: 'Computadores',
  'Credit Card': 'Cartão de crédito', Crowds: 'Multidões', Designed: 'Desenhados', Doors: 'Portas', Drawers: 'Gavetas', 'Drink Can': 'Lata de bebida',
  Duck: 'Pato', Electricity: 'Eletricidade', Equipment: 'Equipamentos', Explosions: 'Explosões', Fail: 'Falha', Fight: 'Luta', Fire: 'Fogo',
  Fireworks: 'Fogos de artifício', 'Food & Drink': 'Comida e bebida', Footsteps: 'Passos', Games: 'Jogos', Glass: 'Vidro', Hit: 'Pancada',
  Horns: 'Buzinas e cornetas', Human: 'Humano', Impact: 'Impacto', Lasers: 'Lasers', Machines: 'Máquinas', Magazine: 'Revista', Magic: 'Magia',
  Mechanical: 'Mecânico', Money: 'Dinheiro', Movement: 'Movimento', Musical: 'Musical', Notifications: 'Notificações', Objects: 'Objetos',
  'Office Supplies': 'Material de escritório', Paper: 'Papel', Ping: 'Ping', 'Plastic Ruler 03': 'Régua de plástico', Rain: 'Chuva', Robots: 'Robôs',
  Rubber: 'Borracha', Running: 'Corrida', 'Running 02': 'Corrida', Scifi: 'Ficção científica', Siren: 'Sirene', Snow: 'Neve', Sports: 'Esportes',
  Swooshes: 'Swooshes', Toys: 'Brinquedos', Trains: 'Trens', 'User Interface': 'Interface', Vegetation: 'Vegetação', Vehicles: 'Veículos',
  Voice: 'Voz', Voices: 'Vozes', 'Washing Machine': 'Máquina de lavar', Water: 'Água', Weapons: 'Armas', Weather: 'Clima', Whistles: 'Apitos e assobios',
  Wind: 'Vento', Windows: 'Janelas', Wings: 'Asas', Wood: 'Madeira',
}

const SUBCATEGORIES: Record<string, string> = {
  Alarm: 'Alarme', Alert: 'Alerta', Angelic: 'Angelical', Animes: 'Anime', Antique: 'Antigo', Applause: 'Aplausos', Appliance: 'Eletrodoméstico',
  Arcade: 'Fliperama', Arrow: 'Flecha', 'Audio Visual': 'Audiovisual', Bag: 'Bolsa', 'Bass Dive': 'Mergulho de grave', Beep: 'Bipe', Bell: 'Sino',
  Bells: 'Sinos', 'Bird Of Prey': 'Ave de rapina', Boing: 'Boing', Book: 'Livro', Boom: 'Boom', Brake: 'Freio', Brass: 'Metais', Breath: 'Respiração',
  Bubbles: 'Bolhas', Burst: 'Estouro', Buzzer: 'Campainha', Camera: 'Câmera', Car: 'Carro', 'Cat Domestic': 'Gato', Celebration: 'Celebração',
  Cellphone: 'Celular', Cheer: 'Torcida', Cheering: 'Comemoração', Children: 'Crianças', Chime: 'Carrilhão', Click: 'Clique', Coin: 'Moeda',
  Commercial: 'Comercial', Computer: 'Computador', Concrete: 'Concreto', Container: 'Recipiente', Cooking: 'Cozinhando', Court: 'Quadra',
  Covering: 'Cobertura', Crackle: 'Crepitar', Creak: 'Rangido', Data: 'Dados', Dog: 'Cachorro', Door: 'Porta', 'Door Close 02': 'Porta fechando',
  Doorbell: 'Campainha de porta', Drone: 'Drone', Eating: 'Comendo', Eerie: 'Sinistro', Electromagnetic: 'Eletromagnético', Energy: 'Energia',
  Ethereal: 'Etéreo', Farm: 'Fazenda', Fashion: 'Moda', Female: 'Feminina', Field: 'Campo', Flesh: 'Carne', Flow: 'Fluxo', Forest: 'Floresta',
  Fowl: 'Aves', Friction: 'Atrito', 'Fun 03': 'Diversão', Furniture: 'Móveis', Futzed: 'Distorcido', General: 'Geral', 'Generic By': 'Passando',
  Glassware: 'Vidraria', Glitch: 'Glitch', Gun: 'Arma de fogo', Gust: 'Rajada', Gym: 'Academia', Handbell: 'Sineta', Handle: 'Manuseio',
  Heartbeat: 'Batimento cardíaco', Horn: 'Buzina', Horse: 'Cavalo', Hospital: 'Hospital', Household: 'Casa', Human: 'Humano', Impact: 'Impacto',
  'Impulse Response': 'Resposta de impulso', Ingredients: 'Ingredientes', Insect: 'Inseto', Interior: 'Interior', Jalopy: 'Calhambeque',
  Kaching: 'Ka-ching', 'Keyboard & Mouse': 'Teclado e mouse', Keyed: 'Com tecla', Keys: 'Chaves', Kiss: 'Beijo', Kitchenware: 'Utensílios de cozinha',
  Large: 'Grande', Laugh: 'Risada', Leaves: 'Folhas', Lofi: 'Lo-fi', 'Loop Group': 'Burburinho', Machine: 'Máquina', Male: 'Masculina',
  Mechanical: 'Mecânico', Mechanism: 'Mecanismo', Misc: 'Diversos', Motion: 'Movimento', Motorcycle: 'Moto', Musical: 'Musical', Noise: 'Ruído',
  Notes: 'Notas', Office: 'Escritório', 'Page Turn 02': 'Virar página', Percussion: 'Percussão', Phonograph: 'Toca-discos', Plastic: 'Plástico',
  Pluck: 'Dedilhado', Plumbing: 'Encanamento', Pop: 'Pop', Pour: 'Derramar', 'Press Button': 'Apertar botão', Quack: 'Quack', Racing: 'Corrida',
  Reaction: 'Reação', Recreational: 'Recreativo', 'Restaurant & Bar': 'Restaurante e bar', Retro: 'Retrô', Riser: 'Riser', 'Rubber Stamp': 'Carimbo',
  Sample: 'Sample', Scifi: 'Ficção científica', Scream: 'Grito', Sea: 'Mar', Shimmer: 'Brilho', 'Short Sizzle': 'Chiado curto', Siren: 'Sirene',
  Sizzle: 'Chiado', Slice: 'Fatia', 'Slide On Metal Rail 03': 'Deslizar no trilho', 'Slide On Metal Rail 04': 'Deslizar no trilho',
  'Slide On Metal Rail 05': 'Deslizar no trilho', Soda: 'Refrigerante', 'Song & Phrase': 'Canto e frase', Songbird: 'Pássaro canoro', Spell: 'Feitiço',
  Splash: 'Respingo', Sport: 'Esporte', Spray: 'Spray', Squeak: 'Chiado agudo', Stapler: 'Grampeador', 'Start 02': 'Partida', Stinger: 'Vinheta',
  'String Pluck 02': 'Corda dedilhada', Subway: 'Metrô', Surf: 'Arrebentação', 'Swipe In Machine 03': 'Passar na maquininha',
  'Swipe In Machine 04': 'Passar na maquininha', Swish: 'Swish', Switch: 'Interruptor', Synthetic: 'Sintético', Telephone: 'Telefone',
  Thunder: 'Trovão', Tick: 'Tique-taque', Tonal: 'Tonal', Toy: 'Brinquedo', Transportation: 'Transporte', Tree: 'Árvore', Tropical: 'Tropical',
  'Trumpet 02': 'Trompete', Turbulent: 'Turbulento', Typewriter: 'Máquina de escrever', Urban: 'Urbano', 'User Interface 05': 'Interface',
  'User Interface 11': 'Interface', Video: 'Vídeo', Vocal: 'Vocal', Voice: 'Voz', Walla: 'Burburinho', Wave: 'Onda', Weapon: 'Arma',
  Whisper: 'Sussurro', Whistle: 'Apito', Whoosh: 'Whoosh', Wood: 'Madeira', Writing: 'Escrita', Zipper: 'Zíper',
}

export const categoryPt = (name: string) => CATEGORIES[name] ?? name
export const subcategoryPt = (name: string) => SUBCATEGORIES[name] ?? name

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
/** Epidemic category and subcategory names whose Portuguese name contains the search (so "sirene" finds "Siren"). */
export function namesMatching(search: string) {
  const q = plain(search.trim())
  if (!q) return { categories: [] as string[], subcategories: [] as string[] }
  const pick = (map: Record<string, string>) => Object.entries(map).filter(([, pt]) => plain(pt).includes(q)).map(([en]) => en)
  return { categories: pick(CATEGORIES), subcategories: pick(SUBCATEGORIES) }
}
