import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getYouTubeContent = tool({
  description: 'Busca conteúdos de vídeos do YouTube salvos no banco de dados',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['draft', 'published', 'archived']).optional().describe('Filtrar por status')
  }),
  execute: async ({ limit, status }) => {
    try {
      let query = supabase
        .from('youtube_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `✅ ${data?.length || 0} vídeos do YouTube encontrados`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: '❌ Erro ao buscar vídeos do YouTube'
      };
    }
  }
});

export const getReelsContent = tool({
  description: 'Busca conteúdos de Reels do Instagram salvos no banco de dados',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['draft', 'published', 'archived']).optional().describe('Filtrar por status')
  }),
  execute: async ({ limit, status }) => {
    try {
      let query = supabase
        .from('reels_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `✅ ${data?.length || 0} Reels encontrados`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: '❌ Erro ao buscar Reels'
      };
    }
  }
});

export const createYouTubeContent = tool({
  description: 'Cria um novo conteúdo de vídeo do YouTube no banco de dados',
  inputSchema: z.object({
    titulo: z.string().describe('Título do vídeo (obrigatório)'),
    hook: z.string().optional().describe('Hook - Primeiros 0-10 segundos'),
    intro: z.string().optional().describe('Intro - Apresentação do canal (10-30s)'),
    value_proposition: z.string().optional().describe('Value Proposition - O que vai aprender (30s-1min)'),
    script: z.string().optional().describe('Script completo do vídeo'),
    categoria: z.string().optional().describe('Categoria do vídeo')
  }),
  execute: async ({ titulo, hook, intro, value_proposition, script, categoria }) => {
    try {
      const { data, error } = await supabase
        .from('youtube_content')
        .insert([{
          titulo,
          hook: hook || null,
          intro: intro || null,
          value_proposition: value_proposition || null,
          script: script || null,
          categoria: categoria || null
        }])
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data?.[0],
        message: `✅ Vídeo do YouTube "${titulo}" criado com sucesso`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: `❌ Erro ao criar vídeo do YouTube`
      };
    }
  }
});

export const createReelsContent = tool({
  description: 'Cria um novo conteúdo de Reel do Instagram no banco de dados',
  inputSchema: z.object({
    titulo: z.string().describe('Título do Reel (obrigatório)'),
    hook: z.string().optional().describe('Hook - Primeiro 1-2 segundos (crucial)'),
    hook_expansion: z.string().optional().describe('Hook Expansion - Expansão do hook'),
    script: z.string().optional().describe('Script completo do Reel')
  }),
  execute: async ({ titulo, hook, hook_expansion, script }) => {
    try {
      const { data, error } = await supabase
        .from('reels_content')
        .insert([{
          titulo,
          hook: hook || null,
          hook_expansion: hook_expansion || null,
          script: script || null
        }])
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data?.[0],
        message: `✅ Reel "${titulo}" criado com sucesso`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: `❌ Erro ao criar Reel`
      };
    }
  }
});