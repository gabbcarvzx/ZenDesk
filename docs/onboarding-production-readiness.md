# Onboarding Production Readiness

Data da auditoria: 2026-05-19

## Conclusao

Status: pronto para beta real controlado.

O onboarding esta tecnicamente apto para uso por clientes beta, desde que a mesma migration validada em staging esteja aplicada no ambiente alvo antes do go-live. A auditoria encontrou e corrigiu problemas de hardening, consistencia de progresso e persistencia parcial.

## Bugs encontrados

1. `onboarding_progress` aceitava `completed_steps` com qualquer texto.
   - Risco: dados invalidos poderiam quebrar progresso, checklist ou telas futuras.

2. `onboarding_progress.payload` nao tinha limite nem garantia de objeto JSON.
   - Risco: usuario autenticado com permissao poderia gravar payload grande demais ou formato inesperado.

3. A migration nao revogava explicitamente acesso `anon` na nova tabela.
   - Risco: baixo por padrao do Postgres, mas fraco para padrao SaaS multi-tenant.

4. `saveOnboardingStepAction` salvava progresso antes de sincronizar `business_settings`.
   - Risco: etapa poderia aparecer como concluida mesmo se a configuracao real falhasse.

5. Alternar modo demo podia resetar `current_step` para `welcome`.
   - Risco: cliente perderia a posicao correta do onboarding.

6. Regravar uma etapa antiga podia mover o usuario para tras no fluxo.
   - Risco: recuperacao de progresso confusa para clientes que revisam etapas.

7. Testes unitarios nao resolviam alias `@/*` no Vitest.
   - Risco: cobertura nova para modulos App Router ficava bloqueada.

## Correcoes feitas

- Adicionados checks SQL:
  - `onboarding_progress_completed_steps_check`
  - `onboarding_progress_payload_object_check`
  - `onboarding_progress_payload_size_check`
- Adicionado `revoke all on table public.onboarding_progress from anon`.
- Atualizado `verify:tenant-schema` para validar hardening da tabela de onboarding.
- Alterada a action de onboarding para sincronizar `business_settings` antes de marcar etapa como salva.
- Erros de sincronizacao agora retornam mensagem clara em vez de sucesso falso.
- Modo demo agora preserva `current_step`, `completed_steps`, `payload` e `completed_at`.
- Proximo passo agora e calculado pelo primeiro passo incompleto, evitando regressao ao editar etapas antigas.
- Tour interativo passou a resetar estado por area via remount, evitando tour aberto entre rotas.
- Adicionado `vitest.config.ts` com alias `@`.
- Adicionados testes para checklist, sanitizacao de progresso, migration e isolamento logico tenant A/B.

## Arquivos alterados

- `supabase/migrations/20260519170000_add_onboarding_progress.sql`
- `scripts/verify-tenant-schema.mjs`
- `src/features/training/actions.ts`
- `src/features/training/queries.ts`
- `src/features/training/components/product-tour-launcher.tsx`
- `src/features/training/queries.test.ts`
- `vitest.config.ts`
- `docs/onboarding-production-readiness.md`

## Validacoes de seguranca e multi-tenant

- Migration revisada: RLS habilitado e forcado.
- Policies revisadas:
  - membros leem apenas a propria organizacao.
  - `owner` e `admin` inserem/atualizam.
  - apenas `owner` exclui.
- Todos os acessos server-side revisados usam `organization_id` resolvido no servidor.
- `saveOnboardingStepAction` usa `requireOrganizationRole(["owner", "admin"])`.
- `toggleDemoModeAction` usa `requireOrganizationRole(["owner", "admin"])`.
- Queries de readiness filtram por `organization_id`.
- Nenhum `organization_id` do formulario e confiado pelo backend.

## Testes executados

### Comandos obrigatorios

- `npm run verify:tenant-schema`
  - Resultado: aprovado.
  - Saida: `Tenant schema verification passed.`

- `npm run lint`
  - Resultado: aprovado.

- `npm run test`
  - Resultado: aprovado.
  - Saida: `12 passed`, `47 passed`.

- `npm run build`
  - Resultado: aprovado.
  - Rotas novas compiladas:
    - `/app/onboarding`
    - `/app/training`
    - `/app/help-center`

- `npm audit --omit=dev --audit-level=moderate`
  - Resultado: aprovado.
  - Saida: `found 0 vulnerabilities`.

### Smoke HTTP sem sessao

Com dev server local em `http://localhost:3000`:

- `/app/onboarding`
  - Resultado: `307` para `/login`.
- `/app/training`
  - Resultado: `307` para `/login`.
- `/app/help-center`
  - Resultado: `307` para `/login`.
- `/register`
  - Resultado: `200`.
- `/login`
  - Resultado: `200`.

### Teste real em staging com Supabase

Ambiente identificado: `APP_ENV=staging`.

Teste executado com tenants temporarios e limpeza ao final:

- Criacao de tenant A.
- Criacao de tenant B.
- Criacao de usuario owner do tenant A.
- Criacao de usuario owner do tenant B.
- Criacao de usuario agent no tenant A.
- Sessao real com Supabase Auth.
- Owner A inseriu progresso do proprio tenant.
- Owner A foi bloqueado ao tentar inserir progresso no tenant B.
- Owner B nao conseguiu ler progresso do tenant A.
- Agent A foi bloqueado ao tentar inserir progresso.
- Salvamento parcial foi persistido.
- Recuperacao do progresso apos nova sessao funcionou.
- Dados reais para checklist foram criados e contados:
  - produto
  - servico
  - base de conhecimento
  - cliente
  - conversa
  - pagamento

Resultado: aprovado.

## Cobertura por tarefa solicitada

- Revisar migration: concluido.
- Garantir RLS correto: concluido por revisao, script e staging.
- Garantir `organization_id`: concluido por revisao e testes.
- Cadastro ate onboarding: pagina de cadastro carrega, action redireciona para `/app/onboarding`, build aprovado.
- Usuario sem sessao: validado via HTTP `307` para `/login`.
- Usuario com sessao: validado no Supabase Auth em staging no nivel RLS/dados.
- Tenant A versus tenant B: validado em staging e em teste unitario.
- Salvamento parcial: validado em staging.
- Recuperacao do progresso: validado em staging.
- Checklist com dados reais: validado em staging com dados reais temporarios.
- Estados vazios inteligentes: revisados estaticamente e build/lint aprovados.
- Central de ajuda: rota compilada, HTTP protegido e componente revisado.
- Tours interativos: fluxo de estado corrigido e build/lint aprovados.
- UX/loading/erro/responsividade: revisao estatica feita; sem browser visual automatizado disponivel neste ambiente.

## Riscos restantes

1. QA visual autenticado ainda deve ser executado em navegador real antes de liberar para clientes.
   - Motivo: o CLI `agent-browser`/Playwright nao esta disponivel neste ambiente.

2. Fluxo completo de cadastro via UI nao foi submetido por browser automatizado.
   - O codigo do redirect foi revisado, paginas carregam e a sessao Supabase foi validada em staging.

3. Pix ainda usa payload do onboarding, nao uma tabela dedicada de configuracao financeira por tenant.
   - Recomendacao: criar `payment_settings` antes de permitir credenciais Pix por cliente.

4. O checklist depende de variaveis de ambiente globais para WhatsApp e Mercado Pago.
   - Recomendacao: quando houver credenciais por tenant, mover readiness para configuracoes tenant-scoped.

5. Ainda nao ha analytics de abandono por etapa.
   - Recomendacao: registrar eventos de onboarding iniciado, etapa salva, etapa com erro e onboarding concluido.

## Recomendacao final

Liberar para beta real controlado apos confirmar que a migration esta aplicada no ambiente beta/producao e executar um smoke visual manual autenticado em desktop e mobile.
