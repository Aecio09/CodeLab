# Frontend Routes Map

## Rotas principais

| Rota | Tela | Acesso esperado |
| --- | --- | --- |
| `/` | Login (`LoginPage`) | Público |
| `/register` | Cadastro (`RegisterPage`) | Público |
| `/perfil` | Perfil (`ProfilePage`) | Usuário autenticado |
| `/admin/questions` | Admin de Questões (`AdminQuestionsPage`) | Usuário autenticado com role `ADMIN` |

## Regras de navegação atuais

- Após cadastro com sucesso, o app redireciona para `/?registered=1`.
- Em `/perfil`, se o usuário carregado em `/api/users/me` tiver role `ADMIN`, o frontend redireciona para `/admin/questions`.
- Em `/admin/questions`, se não houver sessão válida, o frontend redireciona para `/`.
- Em `/admin/questions`, se o usuário autenticado não for admin, o frontend redireciona para `/perfil`.
