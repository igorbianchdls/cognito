// ElevenLabs Realtime STT (server-side) — streams a local PCM file
// Usage:
//   npm run stream:eleven -- ./path/to/audio.pcm
// Prep (convert to 16kHz mono 16-bit PCM):
//   ffmpeg -i input.mp3 -f s16le -ac 1 -ar 16000 output.pcm
//   (Windows/macOS podem usar sox via: sox input.wav -c 1 -r 16000 -b 16 -e signed-integer output.pcm)

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { ElevenLabsClient, RealtimeEvents, AudioFormat } from '@elevenlabs/elevenlabs-js'

const API_KEY = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY (or XI_API_KEY) in environment.')
  process.exit(1)
}

const pcmFilePath = process.argv[2] || process.env.PCM_FILE
if (!pcmFilePath) {
  console.error('Usage: npm run stream:eleven -- ./path/to/audio.pcm')
  process.exit(1)
}

const absPath = path.resolve(pcmFilePath)
if (!fs.existsSync(absPath)) {
  console.error('File not found:', absPath)
  process.exit(1)
}

const elevenlabs = new ElevenLabsClient({ apiKey: API_KEY })

async function main() {
  const connection = await elevenlabs.speechToText.realtime.connect({
    modelId: 'scribe_v2_realtime',
    audioFormat: AudioFormat.PCM_16000,
    sampleRate: 16000,
    includeTimestamps: true,
  })

  connection.on(RealtimeEvents.SESSION_STARTED, (data) => {
    console.log('Session started', data)
    sendAudio(connection).catch((err) => {
      console.error('sendAudio error:', err)
    })
  })

  connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (transcript) => {
    console.log('Partial transcript:', transcript?.transcript || transcript)
  })

  connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (transcript) => {
    console.log('Committed transcript:', transcript?.transcript || transcript)
  })

  connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT_WITH_TIMESTAMPS, (transcript) => {
    console.log('Committed with timestamps:', transcript)
  })

  connection.on(RealtimeEvents.ERROR, (error) => {
    console.error('Error:', error)
  })

  connection.on(RealtimeEvents.CLOSE, () => {
    console.log('Connection closed')
  })
}

async function sendAudio(connection) {
  console.log('Reading PCM file:', absPath)
  const audioBuffer = fs.readFileSync(absPath)

  // 1 second of 16kHz mono 16-bit signed PCM = 16000 samples * 2 bytes = 32000 bytes
  const chunkSize = 32000
  const total = audioBuffer.length
  const chunks = Math.ceil(total / chunkSize)
  console.log(`Streaming ${total} bytes in ${chunks} chunks of ${chunkSize} bytes…`)

  await connection.start().catch(() => {}) // ensure started before sending

  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, total)
    const chunk = audioBuffer.subarray(start, end)
    connection.send({
      audioBase64: chunk.toString('base64'),
      sampleRate: 16000,
    })
    if (i < chunks - 1) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  await new Promise((r) => setTimeout(r, 500))
  await connection.commit()
  console.log('Final commit sent. Waiting briefly before closing…')
  await new Promise((r) => setTimeout(r, 800))
  await connection.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

