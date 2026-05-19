# Sistema de onboarding

## Objetivo

O onboarding guia o cliente leigo da conta nova ate uma implantacao minimamente segura do SaaS de IA para WhatsApp. Ele nao substitui as telas operacionais; ele coordena a ordem correta de configuracao e salva progresso por tenant.

## Rotas

- `/app/onboarding`: fluxo guiado em 10 etapas.
- `/app/training`: visao geral, checklist, trilha e modo demo.
- `/app/help-center`: central de ajuda pesquisavel.

## Persistencia

A tabela `public.onboarding_progress` armazena:

- `organization_id`: tenant dono do progresso.
- `current_step`: etapa atual.
- `completed_steps`: etapas finalizadas.
- `payload`: respostas do onboarding.
- `demo_mode_enabled`: modo demo do tenant.
- `completed_at`: data de conclusao.

Regras de seguranca:

- RLS habilitado e forcado.
- Leitura apenas para membros da organizacao.
- Escrita apenas para `owner` e `admin`.
- Nenhum `organization_id` vem do cliente; ele e resolvido no servidor.

## Etapas

1. Bem-vindo
2. Dados da empresa
3. Nicho do negocio
4. Horario de funcionamento
5. Produtos e servicos
6. Configuracao da IA
7. Conectar WhatsApp
8. Configurar Pix
9. Testar atendimento IA
10. Finalizacao

## Sincronizacao com configuracoes reais

As etapas de empresa, nicho, horario, IA e WhatsApp sincronizam campos seguros em `business_settings`, sempre usando a organizacao autenticada. Pix fica registrado no payload do onboarding enquanto a arquitetura de billing evolui para contas de pagamento por tenant.

## Impacto no negocio

- Reduz suporte inicial.
- Aumenta ativacao porque mostra o proximo passo claro.
- Evita go-live sem catalogo, IA testada ou WhatsApp validado.
- Cria base para health score de implantacao por organizacao.

## Riscos e proximos passos

- Criar tabela dedicada `payment_settings` quando Pix passar a ter credenciais por tenant.
- Adicionar eventos de analytics para abandono por etapa.
- Criar redirect condicional no login para tenants com onboarding incompleto.
