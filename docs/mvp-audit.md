# Auditoria geral do MVP

Data da auditoria: 2026-05-19.

## Resumo executivo

O MVP está em bom estado para um beta técnico controlado: a arquitetura por domínio está clara, o modelo multi-tenant está presente no banco, as rotas críticas têm validações básicas e o build de produção passa.

Durante a auditoria foram corrigidos pontos importantes:

- Login e cadastro deixaram de ser formulários estáticos e passaram a usar Supabase Auth.
- Cadastro agora cria usuário, organização, perfil `owner` e `business_settings` inicial.
- A área `/app` passou a redirecionar usuários sem sessão para `/login` quando Supabase está configurado.
- O botão "Sair" passou a executar logout real.
- Sidebar/topbar deixaram de exibir organização hardcoded.
- Dashboard deixou de depender apenas de mock quando há Supabase e agora busca métricas por `organization_id`.
- Gráfico do dashboard foi protegido contra volume zerado.

## O que está pronto

### Produto e UX

- Landing page comercial em `/` com promessa, problema, solução, benefícios, nichos, mockups, planos, FAQ e CTA.
- Página `/pricing` com planos comerciais Starter, Pro e Business.
- Área interna com módulos iniciais:
  - Dashboard
  - Clientes
  - Conversas
  - Agenda
  - Pagamentos
  - Catálogo de produtos/serviços
  - Configurações do negócio
  - Base de conhecimento da IA
  - Playground da IA
- Playground permite testar a IA sem WhatsApp real.
- Tela global de erro amigável sem stack trace.

### Arquitetura

- Next.js App Router organizado por rotas públicas, auth, app e APIs.
- Separação por domínio em `src/features`.
- Infra e integrações em `src/lib`.
- Server Actions isoladas por módulo.
- Webhooks externos separados em Route Handlers.
- Service role usado somente no servidor.

### Multi-tenant

- Tabelas de negócio usam `organization_id`.
- Migrations habilitam e forçam RLS.
- Policies usam membership/organização ativa.
- Queries revisadas filtram por `organization_id`.
- Script `npm run verify:tenant-schema` valida RLS, policies, helpers, colunas e índices críticos.
- `.env` está ignorado pelo Git.

### IA

- Motor de IA com classificação de intenção, montagem de contexto, decisão de ação e tools internas.
- Regras impedem cobrança/agendamento sem confirmação clara.
- Prompt instrui a IA a não inventar preço, horário ou serviço.
- Handoff humano disponível como tool.
- Testes unitários cobrem prompt, intenção, planner e fluxo de tools.

### Integrações

- WhatsApp Cloud API:
  - Verificação GET por token.
  - Validação de assinatura HMAC no POST.
  - Parse de mensagens.
  - Persistência de cliente, conversa e mensagens.
  - Resposta via IA quando a conversa não está em handoff.
- Mercado Pago Pix:
  - Criação inicial de cobrança Pix.
  - Idempotência.
  - Webhook com assinatura.
  - Atualização de status local.
- Rate limit básico nos endpoints sensíveis.

## O que falta

### Beta obrigatório

- Criar ambiente Supabase de staging e aplicar migrations reais.
- Testar cadastro/login com e-mail real e confirmação de e-mail conforme configuração do Supabase Auth.
- Criar tenant de teste e executar fluxo completo autenticado:
  - cadastro
  - configuração do negócio
  - cadastro de produto/serviço
  - cliente
  - conversa manual
  - playground
  - agenda
  - pagamento manual
- Configurar backups automáticos no Supabase.
- Configurar domínio real e variáveis na Vercel.
- Configurar logs/observabilidade com alerta para webhooks e erros 5xx.
- Adicionar bloqueio por plano/status comercial.

### Produção real

- Rate limiting distribuído por Redis/Vercel Firewall/WAF.
- Fila/worker para processamento de webhooks e retry.
- Reconciliador periódico de pagamentos Mercado Pago.
- Métricas de uso de IA por tenant e por plano.
- Registro de custo/token por organização.
- Termos de uso, política de privacidade e política de retenção de dados.
- Auditoria de LGPD para dados de clientes finais.
- CSP restritiva testada com Supabase, fontes e integrações.
- Rotina documentada e testada de restore.

## Riscos

### Alto

- **Billing comercial ainda não bloqueia uso por plano.** Os planos existem na UI, mas não existe enforcement server-side para mensagens, usuários, WhatsApp, IA ou pagamentos.
- **Rate limit é em memória.** Funciona como proteção inicial, mas não protege múltiplas instâncias em produção.
- **Webhooks ainda processam trabalho síncrono.** Em volume real, WhatsApp e Mercado Pago devem enviar para fila/worker.
- **Fluxo de cadastro depende de service role.** Está correto para bootstrap server-side, mas precisa ser testado em staging com Supabase Auth real.

### Médio

- **Dashboard tem fallback mock.** Quando Supabase falha, exibe fallback para não quebrar UI; isso deve virar estado de erro mais explícito para operação real.
- **Há duplicação de validações tenant em actions.** Funções como `assertCustomerBelongsToTenant` e `assertConversationBelongsToTenant` aparecem em mais de um módulo. Não gerou bug encontrado, mas merece helper compartilhado.
- **README está atrasado em relação ao produto atual.** Ainda menciona algumas integrações como futuras.
- **Pagamentos Pix não estão conectados diretamente à UI principal.** Existe rota de integração, mas a UI de pagamentos ainda cria cobrança manual.

### Baixo

- Alguns textos internos ainda misturam linguagem de produto, arquitetura e operação técnica.
- Alguns estados vazios podem ser mais orientados à ação.
- Não há teste E2E com navegador real ainda.

## Testes executados

Comandos:

- `npm run verify:tenant-schema`: passou.
- `npm run lint`: passou.
- `npm test`: passou, 7 arquivos e 25 testes.
- `npm run build`: passou.
- `npm audit --omit=dev --audit-level=moderate`: 0 vulnerabilidades.

Fluxos HTTP locais:

- `GET /`: 200, landing renderizada.
- `GET /pricing`: 200, planos Starter/Pro/Business renderizados.
- `GET /login`: 200, formulário de login renderizado.
- `GET /register`: 200, formulário de cadastro renderizado.
- `GET /app/dashboard` sem sessão: 307 para `/login`.
- `GET /api/webhooks/whatsapp` com token inválido: 403.
- `POST /api/webhooks/mercadopago` sem assinatura válida: 503 neste ambiente sem secret configurado.
- `POST /api/payments/mercadopago/create` sem Mercado Pago configurado: 503 controlado.

## Próximos passos recomendados

1. Criar projeto Supabase de staging e aplicar migrations.
2. Rodar teste manual autenticado ponta a ponta com tenant real.
3. Atualizar README para refletir o estado atual do MVP.
4. Extrair helpers compartilhados de validação tenant.
5. Criar middleware/guard de plano para recursos pagos.
6. Conectar UI de pagamentos à rota Pix em ambiente sandbox.
7. Implementar logging estruturado com request id/correlation id.
8. Adicionar testes E2E para login, cadastro, dashboard e módulos principais.
9. Configurar observabilidade e alertas.
10. Preparar beta fechado com 3 a 5 negócios reais.

## Checklist para lançar o beta

- [ ] Supabase staging criado.
- [ ] Supabase production criado.
- [ ] Migrations aplicadas em staging.
- [ ] Migrations aplicadas em production.
- [ ] Backups automáticos habilitados.
- [ ] Restore testado em staging.
- [ ] Variáveis de ambiente configuradas na Vercel.
- [ ] `NEXT_PUBLIC_APP_URL` apontando para domínio real.
- [ ] Cadastro/login testados com e-mail real.
- [ ] Tenant de teste criado.
- [ ] `/app/dashboard` validado com dados reais.
- [ ] Clientes criados/editados.
- [ ] Conversas manuais criadas.
- [ ] Playground da IA validado.
- [ ] Agenda criada/editada/cancelada.
- [ ] Pagamento manual criado.
- [ ] Webhook WhatsApp validado em ambiente de teste.
- [ ] Webhook Mercado Pago validado em sandbox.
- [ ] Logs revisados sem tokens, secrets ou payload bruto sensível.
- [ ] Rate limit distribuído planejado antes de abrir tráfego.
- [ ] Limites por plano definidos.
- [ ] Termos e privacidade publicados.
- [ ] Processo de suporte beta definido.
- [ ] Checklist de rollback documentado.

## Observação sobre segredos

O arquivo `.env` está ignorado pelo Git, e a busca nos arquivos versionados não encontrou o token selecionado no editor. Se o valor selecionado no IDE for um token real, ele deve ser rotacionado por segurança, porque foi exposto no contexto da conversa.
