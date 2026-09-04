# Gestão Escolar – JG Sistemas
## Guia de Uso (entrega ao cliente)

Este sistema foi entregue e está no ar em produção:

| Item | Endereço |
|---|---|
| **Sistema (frontend)** | https://jgsistemas.vercel.app |
| **API (backend)** | https://jgsistemas-backend.onrender.com |

---

## 1. Acessar o sistema

1. Abra o navegador e acesse **https://jgsistemas.vercel.app**
2. Na tela de login, entre com o **e-mail** e a **senha** do administrador cadastrado.
3. O painel principal carrega com o **Dashboard** (visão geral da escola).

---

## 2. Primeiro acesso / usuário administrador

O usuário administrador principal e a senha inicial são definidos pelo responsável técnico
(quem configurou o sistema). Em produção o registro de novos usuários **exige** login de um
administrador — o próprio administrador cria os demais usuários pelo painel.

---

## 3. Redefinição de senha (pelo próprio usuário) — sem depender de ninguém

Na tela de login, clique em **"Esqueci minha senha"**:

1. Informe o **e-mail** cadastrado no sistema.
2. O sistema envia um **e-mail** com um link único de redefinição.
3. O link tem **validade de 30 minutos**.
4. Clique no link, informe a nova senha e salve.
5. Volte ao login e acesse com a nova senha.

> O envio de e-mails usa o provedor **Resend** com o domínio verificado
> **`no-reply@jgsistemas.dev.br`**. Verifique a caixa de entrada **e a pasta de spam/lixo**
> caso o e-mail não apareça.

---

## 4. Gerenciamento de usuários e permissões

No menu **Configurações** → aba **Usuários**, o administrador pode:

- **Criar** novos usuários (nome, e-mail, senha, papel/função)
- **Editar** dados de usuários existentes
- **Desativar/remover** usuários
- **Habilitar/desabilitar permissões** por módulo (cada usuário acessa apenas o que tem permissão)

Os itens do menu lateral são mostrados ou ocultados conforme as permissões do usuário logado.

---

## 5. Módulos disponíveis

1. **Dashboard** – visão geral com indicadores
2. **Alunos** – cadastro completo com documentos
3. **Turmas** – turmas e horários
4. **Matrículas** – matrícula, renovação, cancelamento e trancamento
5. **Frequência** – presença e relatórios
6. **Avaliações** – provas, trabalhos e médias
7. **Financeiro** – mensalidades, pagamentos e planos
8. **Agenda** – calendário de eventos
9. **Comunicação** – WhatsApp, e-mail e SMS
10. **Relatórios** – exportação em PDF e Excel
11. **Pesquisa** – busca em todo o sistema
12. **Perfil do Aluno** – histórico completo
13. **Configurações** – logo, cores, usuários e permissões

---

## 6. Boas práticas

- **Troque a senha do administrador** logo no primeiro acesso.
- Mantenha o **e-mail de cada usuário** correto — é por ele que a redefinição de senha chega.
- Use senhas fortes e **não compartilhe** as credenciais.
- O sistema faz **backup dos dados** de forma automática (disponível no respectivo recurso).

---

## 7. Suporte

Para dúvidas, ajustes ou novas funcionalidades, contate o responsável técnico da **JG Sistemas**.
