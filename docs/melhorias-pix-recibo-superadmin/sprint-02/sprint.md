# Sprint 02 — Chave PIX persiste e modal dá feedback claro

## Objetivo

Eliminar o Bug #1 (chave PIX não persiste no modal Configurações) usando o teste de reprodução da lacuna L2 antes de qualquer correção, e tornar o salvamento seguro (D-04 e D-12): reabrir o modal mantém a chave, QR Code continua no carnê, e falha de salvar mantém o formulário digitado com a mensagem "Erro ao salvar. Tente novamente.".

## Fases

| Fase | Título | Roda em paralelo com |
|---|---|---|
| F-02.1 | Backend: reprodução L2 e persistência do PIX | F-02.2 |
| F-02.2 | Frontend: seguro no salvamento do PIX (D-12) e cache coerente | F-02.1 |

Detalhe de cada fase em `fases.md`; tasks em `tasks.md`.

## Critério de saída

Teste de reprodução (GET → PUT com payload completo do GET + pix_key → GET) passa e a chave PIX persiste; teste de regressão confirma que PUT não zera `pix_key` nem falha com payload do frontend; Settings mantém o valor digitado em erro e mostra a mensagem D-12; suites rodam com 0 failed.

## Riscos conhecidos

- L2 (causa raiz desconhecida) — hipóteses vivas no `base/00-LACUNAS.md`: validação 422 em `dark_mode` (frontend pode enviar boolean e o schema espera int) ou cache global de `useSettings` servindo valor velho; a F-02.1 decide por evidência, não por palpite.
- Se a reprodução passar (backend íntegro), o defeito está no frontend e a F-02.2 é a entrega da correção; o plano já cobre as duas frentes sem depender do desfecho.