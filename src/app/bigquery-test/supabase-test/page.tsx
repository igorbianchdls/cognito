'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TestResult {
  status: 'loading' | 'success' | 'error'
  message: string
  details?: Record<string, unknown>
}

export default function SupabaseTestPage() {
  const [envTest, setEnvTest] = useState<TestResult>({ status: 'loading', message: 'Verificando variáveis de ambiente...' })
  const [connectionTest, setConnectionTest] = useState<TestResult>({ status: 'loading', message: 'Testando conexão...' })
  const [authTest, setAuthTest] = useState<TestResult>({ status: 'loading', message: 'Testando autenticação...' })

  useEffect(() => {
    runTests()
  }, [])

  async function runTests() {
    // Test 1: Verificar variáveis de ambiente
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        setEnvTest({
          status: 'error',
          message: 'Variáveis de ambiente não encontradas',
          details: {
            NEXT_PUBLIC_SUPABASE_URL: !!url,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!key
          }
        })
        return
      }

      setEnvTest({
        status: 'success',
        message: 'Variáveis de ambiente carregadas',
        details: {
          url: url,
          keyLength: key.length
        }
      })

      // Test 2: Testar conexão
      try {
        const supabase = createClient()

        setConnectionTest({
          status: 'success',
          message: 'Cliente Supabase criado com sucesso',
          details: {
            supabaseUrl: url
          }
        })

        // Test 3: Testar autenticação
        try {
          const { data, error } = await supabase.auth.getSession()

          if (error) {
            setAuthTest({
              status: 'error',
              message: 'Erro ao verificar sessão',
              details: { error: error.message }
            })
          } else {
            setAuthTest({
              status: 'success',
              message: data.session ? 'Usuário autenticado' : 'Nenhum usuário autenticado (normal)',
              details: {
                hasSession: !!data.session,
                user: data.session?.user?.email || 'N/A'
              }
            })
          }
        } catch (error) {
          setAuthTest({
            status: 'error',
            message: 'Erro ao testar autenticação',
            details: { error: String(error) }
          })
        }

      } catch (error) {
        setConnectionTest({
          status: 'error',
          message: 'Erro ao criar cliente Supabase',
          details: { error: String(error) }
        })
      }

    } catch (error) {
      setEnvTest({
        status: 'error',
        message: 'Erro ao verificar variáveis',
        details: { error: String(error) }
      })
    }
  }

  const renderTestResult = (test: TestResult, title: string) => {
    const statusColors = {
      loading: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      success: 'bg-green-100 border-green-400 text-green-800',
      error: 'bg-red-100 border-red-400 text-red-800'
    }

    const statusIcons = {
      loading: '⏳',
      success: '✅',
      error: '❌'
    }

    return (
      <div className={`border-l-4 p-4 rounded ${statusColors[test.status]}`}>
        <h3 className="font-bold flex items-center gap-2">
          <span>{statusIcons[test.status]}</span>
          {title}
        </h3>
        <p className="mt-2">{test.message}</p>
        {test.details && (
          <pre className="mt-2 text-xs overflow-auto bg-white/50 p-2 rounded">
            {JSON.stringify(test.details, null, 2)}
          </pre>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-800">
          Teste de Integração do Supabase
        </h1>
        <p className="text-gray-600 mb-8">
          Esta página testa a configuração e conexão com o Supabase
        </p>

        <div className="space-y-4">
          {renderTestResult(envTest, '1. Variáveis de Ambiente')}
          {renderTestResult(connectionTest, '2. Conexão com Supabase')}
          {renderTestResult(authTest, '3. Sistema de Autenticação')}
        </div>

        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Próximos Passos</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Se todos os testes passaram, o Supabase está configurado corretamente</li>
            <li>• Configure tabelas no Supabase Dashboard</li>
            <li>• Implemente autenticação (login/signup)</li>
            <li>• Crie queries para suas tabelas</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={runTests}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            🔄 Executar Testes Novamente
          </button>
        </div>
      </div>
    </div>
  )
}