param(
  [ValidatePattern('^[a-z][a-z0-9-]{4,61}[a-z0-9]$')][string]$ProjectId = 'creatto-463117',
  [ValidatePattern('^[a-z]+-[a-z]+[0-9]+$')][string]$Region = 'southamerica-east1'
)
$ErrorActionPreference = 'Stop'
$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloud) { Write-Output 'Cloud inventory unavailable: gcloud not installed or not in PATH.'; exit 1 }
$checks = @(
  @{ Name='services'; Args=@('run','services','list',"--region=$Region",'--platform=managed','--format=json(metadata.name,status.url,spec.template.spec.serviceAccountName)') },
  @{ Name='workerJobs'; Args=@('run','jobs','list',"--region=$Region",'--format=json(metadata.name)') },
  @{ Name='scheduler'; Args=@('scheduler','jobs','list',"--location=$Region",'--format=json(name,schedule,state,httpTarget.oidcToken.serviceAccountEmail,pubsubTarget.topicName)') },
  @{ Name='topics'; Args=@('pubsub','topics','list','--format=json(name)') },
  @{ Name='subscriptions'; Args=@('pubsub','subscriptions','list','--format=json(name,topic,deadLetterPolicy.deadLetterTopic,pushConfig.oidcToken.serviceAccountEmail)') },
  @{ Name='repositories'; Args=@('artifacts','repositories','list',"--location=$Region",'--format=json(name,format)') },
  @{ Name='secrets'; Args=@('secrets','list','--format=json(name)') },
  @{ Name='serviceAccounts'; Args=@('iam','service-accounts','list','--format=json(email,disabled)') },
  @{ Name='projectIam'; Args=@('projects','get-iam-policy',$ProjectId,'--format=json(bindings.role,bindings.members)') }
)
$results = [ordered]@{ generatedAt=[DateTime]::UtcNow.ToString('o'); project=$ProjectId; region=$Region; readOnly=$true; checks=@() }
$failed = $false
foreach ($check in $checks) {
  $arguments = $check.Args + @("--project=$ProjectId",'--quiet')
  $output = & $gcloud.Source @arguments 2>$null
  $code = $LASTEXITCODE
  if ($code -ne 0) { $failed=$true; $results.checks += @{ name=$check.Name; status='unavailable'; exitCode=$code }; continue }
  $results.checks += @{ name=$check.Name; status='inspected'; data=($output -join "`n" | ConvertFrom-Json) }
}
$results.limitations = @('Only the specified region was inspected for regional resources.','BigQuery datasets, build triggers, revision traffic, pending messages, active executions and provider OAuth revocation require separate live review.','Resource names do not prove exclusive ownership; no deletion is performed.','No secret values or environment values are collected.')
$results | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 docs/retirada-integracoes/etapa-6/verificacoes/cloud-inventory.json
if ($failed) { Write-Output 'Inventory incomplete: one or more queries failed.'; exit 1 }
Write-Output 'Read-only cloud inventory completed for the specified scope.'
