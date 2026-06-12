import type {
  DestinationWriteInput,
  DestinationWriteOutput,
  DestinationWriter,
} from '@/products/integracoes/destinations/cloud/DestinationWriter'
import { bigQueryDestinationWriter } from '@/products/integracoes/destinations/cloud/bigQueryDestinationWriter'

const writers = new Map<string, DestinationWriter>([
  [bigQueryDestinationWriter.type, bigQueryDestinationWriter],
])

export async function writeRowsToDestination(input: DestinationWriteInput): Promise<DestinationWriteOutput> {
  const writer = writers.get(input.destination.type)
  if (!writer) {
    throw new Error(`Destino ${input.destination.type} ainda nao possui writer implementado.`)
  }
  return writer.writeRows(input)
}
