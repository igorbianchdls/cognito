// Streaming STT com AssemblyAI + microfone (node-record-lpcm16)
// Requisitos: npm i assemblyai node-record-lpcm16
// Em Windows/macOS pode ser necessário instalar o SoX (rec)

import { AssemblyAI } from 'assemblyai'
import { Readable } from 'stream'
import recorder from 'node-record-lpcm16'

// Usa env var ou a chave de teste fornecida (apenas para testes)
const API_KEY = process.env.ASSEMBLYAI_API_KEY || 'bd1609c15e71481e9fc12e080527d916'

const CONNECTION_PARAMS = {
  sampleRate: 16000,
  formatTurns: true,
}

async function run() {
  const client = new AssemblyAI({ apiKey: API_KEY })

  const transcriber = client.streaming.transcriber(CONNECTION_PARAMS)

  transcriber.on('open', ({ id }) => {
    console.log(`Session opened with ID: ${id}`)
  })

  transcriber.on('error', (error) => {
    console.error('Error:', error)
  })

  transcriber.on('close', (code, reason) => {
    console.log('Session closed:', code, reason)
  })

  transcriber.on('turn', (turn) => {
    if (!turn?.transcript) return
    console.log('Turn:', turn.transcript, `(final=${!!turn.end_of_turn})`)
  })

  try {
    console.log('Connecting to streaming transcript service...')
    await transcriber.connect()

    console.log('Starting recording (Ctrl+C para parar)')
    const recording = recorder.record({
      channels: 1,
      sampleRate: CONNECTION_PARAMS.sampleRate,
      audioType: 'wav', // Linear PCM
      // Se necessário, defina explicitamente o programa de gravação:
      // recordProgram: process.platform === 'win32' ? 'sox' : undefined,
    })

    Readable.toWeb(recording.stream()).pipeTo(transcriber.stream())

    process.on('SIGINT', async () => {
      console.log('\nStopping recording...')
      try { recording.stop() } catch {}
      console.log('Closing streaming transcript connection...')
      try { await transcriber.close() } catch {}
      process.exit(0)
    })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

run()

