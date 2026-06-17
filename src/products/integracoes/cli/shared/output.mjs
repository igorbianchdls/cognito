export function printInfo(message, data) {
  if (data == null) {
    console.log(message)
    return
  }

  console.log(`${message} ${JSON.stringify(data)}`)
}

export function printError(error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Erro: ${message}`)
}

export function formatRun(run) {
  return {
    runId: String(run.id),
    status: run.status,
    connectionId: String(run.connection_id),
    pipelineId: run.pipeline_id == null ? null : String(run.pipeline_id),
    destinationId: run.destination_id == null ? null : String(run.destination_id),
    recordsIn: Number(run.records_in || 0),
    recordsUpdated: Number(run.records_updated || 0),
    recordsFailed: Number(run.records_failed || 0),
    errorMessage: run.error_message || null,
  }
}
