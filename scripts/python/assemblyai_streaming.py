#!/usr/bin/env python3
"""
AssemblyAI streaming STT via microfone.

Instalação (Windows):
  - python -m pip install --upgrade pip
  - pip install assemblyai
  - pip install pyaudio
    Se der erro no pyaudio, use:
      - pip install pipwin && pipwin install pyaudio

Linux (Debian/Ubuntu):
  - sudo apt-get install portaudio19-dev && pip install pyaudio assemblyai

macOS:
  - brew install portaudio && pip3 install pyaudio assemblyai

Execução:
  - Defina ASSEMBLYAI_API_KEY ou use a chave de teste embutida (apenas testes)
  - python scripts/python/assemblyai_streaming.py
"""

import os
import logging
from typing import Type

import assemblyai as aai
from assemblyai.streaming.v3 import (
    BeginEvent,
    StreamingClient,
    StreamingClientOptions,
    StreamingError,
    StreamingEvents,
    StreamingParameters,
    StreamingSessionParameters,
    TerminationEvent,
    TurnEvent,
)

# Chave: usa ASSEMBLYAI_API_KEY do ambiente ou a chave de teste fornecida (apenas para testes)
API_KEY = os.getenv("ASSEMBLYAI_API_KEY") or "bd1609c15e71481e9fc12e080527d916"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def on_begin(self: Type[StreamingClient], event: BeginEvent):
    print(f"Session started: {event.id}")


def on_turn(self: Type[StreamingClient], event: TurnEvent):
    print(f"{event.transcript} ({event.end_of_turn})")

    if event.end_of_turn and not event.turn_is_formatted:
        params = StreamingSessionParameters(
            format_turns=True,
        )
        self.set_params(params)


def on_terminated(self: Type[StreamingClient], event: TerminationEvent):
    print(
        f"Session terminated: {event.audio_duration_seconds} seconds of audio processed"
    )


def on_error(self: Type[StreamingClient], error: StreamingError):
    print(f"Error occurred: {error}")


def main():
    client = StreamingClient(
        StreamingClientOptions(
            api_key=API_KEY,
            api_host="streaming.assemblyai.com",
        )
    )

    client.on(StreamingEvents.Begin, on_begin)
    client.on(StreamingEvents.Turn, on_turn)
    client.on(StreamingEvents.Termination, on_terminated)
    client.on(StreamingEvents.Error, on_error)

    client.connect(
        StreamingParameters(
            sample_rate=16000,
            format_turns=True,
        )
    )

    try:
        # Requer PyAudio instalado (ver instruções no topo do arquivo)
        client.stream(
            aai.extras.MicrophoneStream(sample_rate=16000)
        )
    except KeyboardInterrupt:
        pass
    finally:
        client.disconnect(terminate=True)


if __name__ == "__main__":
    main()

