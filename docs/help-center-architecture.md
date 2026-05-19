# Arquitetura da central de ajuda

## Objetivo

A central de ajuda foi criada para educar usuarios nao tecnicos dentro do produto. O foco e ativacao operacional, nao documentacao tecnica.

## Rota

- `/app/help-center`

## Estrutura de conteudo

O conteudo fica em `src/features/training/data.ts` para manter artigos versionados junto ao produto.

Categorias atuais:

- Primeiros passos
- Configuracao da empresa
- Configuracao da IA
- WhatsApp
- Pagamentos
- Conversas
- Atendimento humano
- Problemas comuns
- Seguranca
- Planos e billing

Cada artigo possui:

- categoria
- titulo
- resumo
- tempo estimado de leitura
- passo a passo
- exemplo real

## UX

A interface usa busca client-side, filtros por categoria e cards de artigos com linguagem simples. Os exemplos foram escritos para pequenos negocios, com foco em WhatsApp, Pix, atendimento humano e IA.

## Evolucao recomendada

- Migrar artigos para CMS quando houver time de suporte ou marketing.
- Registrar buscas sem resultado para decidir novos artigos.
- Adicionar videos curtos por etapa de onboarding.
- Adicionar versoes por plano, ja que recursos como Pix e handoff dependem de billing.

## Segurança e multi-tenant

Os artigos sao conteudo estatico compartilhado e nao carregam dados de tenant. Qualquer personalizacao futura deve ser resolvida no servidor usando `organization_id`.
