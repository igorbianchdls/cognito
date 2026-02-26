import type { ToolkitDefinition } from '@/products/integracoes/shared/types'

// Catálogo extra de conectores de dados/BI (curado para logos disponíveis nas libs atuais).
export const DATA_CONNECTOR_EXTRA_TOOLKITS: ToolkitDefinition[] = [
  { slug: 'POSTGRESQL', name: 'PostgreSQL', description: 'Banco relacional para analytics e replicação' },
  { slug: 'MYSQL', name: 'MySQL', description: 'Banco relacional operacional e ETL' },
  { slug: 'MARIADB', name: 'MariaDB', description: 'Banco relacional compatível com MySQL' },
  { slug: 'MONGODB', name: 'MongoDB', description: 'Document database e eventos de aplicação' },
  { slug: 'REDIS', name: 'Redis', description: 'Cache/streams para dados operacionais' },
  { slug: 'ELASTICSEARCH', name: 'Elasticsearch', description: 'Busca e analytics em logs/documentos' },
  { slug: 'OPENSEARCH', name: 'OpenSearch', description: 'Search/analytics para observabilidade e dados' },
  { slug: 'APACHE_KAFKA', name: 'Apache Kafka', description: 'Streaming de eventos e ingestão contínua' },
  { slug: 'APACHE_AIRFLOW', name: 'Apache Airflow', description: 'Orquestração de pipelines de dados' },
  { slug: 'APACHE_SPARK', name: 'Apache Spark', description: 'Processamento distribuído e engenharia de dados' },
  { slug: 'APACHE_DRUID', name: 'Apache Druid', description: 'OLAP/analytics em tempo quase real' },
  { slug: 'BIGQUERY', name: 'BigQuery', description: 'Data warehouse serverless (Google Cloud)' },
  { slug: 'AMAZON_REDSHIFT', name: 'Amazon Redshift', description: 'Data warehouse da AWS' },
  { slug: 'AMAZON_RDS', name: 'Amazon RDS', description: 'Bancos gerenciados na AWS' },
  { slug: 'AMAZON_S3', name: 'Amazon S3', description: 'Data lake / armazenamento de arquivos' },
  { slug: 'GOOGLE_CLOUD_STORAGE', name: 'Google Cloud Storage', description: 'Armazenamento para data lake' },
  { slug: 'MICROSOFT_SQL_SERVER', name: 'Microsoft SQL Server', description: 'Banco relacional corporativo' },
  { slug: 'SQLITE', name: 'SQLite', description: 'Banco embarcado para apps e exportações' },
  { slug: 'ORACLE', name: 'Oracle Database', description: 'Banco de dados corporativo' },
  { slug: 'DUCKDB', name: 'DuckDB', description: 'Analytics local/in-process' },
  { slug: 'TRINO', name: 'Trino', description: 'Query engine distribuído' },
  { slug: 'PRESTO', name: 'Presto', description: 'Query engine SQL distribuído' },
  { slug: 'DBT', name: 'dbt', description: 'Transformações e modelagem analítica' },
  { slug: 'AIRBYTE', name: 'Airbyte', description: 'ELT/open-source connectors' },
  { slug: 'POWER_BI', name: 'Power BI', description: 'BI e dashboards Microsoft' },
  { slug: 'TABLEAU', name: 'Tableau', description: 'Visualização de dados e dashboards' },
  { slug: 'LOOKER', name: 'Looker', description: 'BI/modelagem e exploração de dados' },
  { slug: 'DATADOG', name: 'Datadog', description: 'Observabilidade, métricas e logs' },
  { slug: 'INTERCOM', name: 'Intercom', description: 'Suporte e dados de conversas/clientes' },
]

export default DATA_CONNECTOR_EXTRA_TOOLKITS
