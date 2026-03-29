# Frontend

Este workspace contém o frontend mobile do MVP de controle veicular.
O aplicativo foi construído com Expo, React Native, TypeScript e React Navigation,
e se integra com a API do backend para autenticação, veículos, abastecimentos,
manutenções, lembretes e atualização de quilometragem.

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- React Navigation
- Axios
- Expo Secure Store com fallback para localStorage no web

## Estrutura do Projeto

O aplicativo principal fica em [mobile](mobile).

Estrutura geral:

```text
frontend/
  README.md
  README.pt-BR.md
  mobile/
    App.tsx
    index.ts
    app.json
    .env
    .env.example
    src/
      components/
      context/
      lib/
      navigation/
      screens/
```

Diretórios importantes dentro de [mobile/src](mobile/src):

- [mobile/src/components](mobile/src/components)
  - Blocos de UI compartilhados.
  - Atualmente inclui o container base usado nas telas.

- [mobile/src/context](mobile/src/context)
  - Estado global e providers.
  - [mobile/src/context/AuthContext.tsx](mobile/src/context/AuthContext.tsx): bootstrap de sessão, login, logout e usuário atual.
  - [mobile/src/context/ToastContext.tsx](mobile/src/context/ToastContext.tsx): notificações temporárias de sucesso, informação e erro.

- [mobile/src/lib](mobile/src/lib)
  - Helpers centrais e integração com API.
  - [mobile/src/lib/api.ts](mobile/src/lib/api.ts): cliente Axios, bearer token, refresh token e normalização de erros.
  - [mobile/src/lib/authStorage.ts](mobile/src/lib/authStorage.ts): persistência de tokens com Secure Store no nativo e localStorage no web.
  - [mobile/src/lib/input.ts](mobile/src/lib/input.ts): formatação e parsing de moeda, hodômetro, decimais e placa.
  - [mobile/src/lib/services.ts](mobile/src/lib/services.ts): serviços da API por domínio.
  - [mobile/src/lib/types.ts](mobile/src/lib/types.ts): tipos de entidades e respostas.

- [mobile/src/navigation](mobile/src/navigation)
  - Definições da navegação.
  - [mobile/src/navigation/AppNavigator.tsx](mobile/src/navigation/AppNavigator.tsx): rotas autenticadas e não autenticadas.
  - [mobile/src/navigation/types.ts](mobile/src/navigation/types.ts): tipagem dos parâmetros de navegação.

- [mobile/src/screens](mobile/src/screens)
  - Telas por funcionalidade.
  - Autenticação: login.
  - Veículos: listagem, formulário de cadastro/edição, detalhe.
  - Registros: abastecimento, manutenção, lembretes.
  - Utilitárias: resumo e perfil.

## Funcionalidades Atuais

- Autenticação com login e refresh token no backend.
- CRUD de veículos.
- Atualização manual de quilometragem.
- Criação e listagem de abastecimentos.
- Criação e listagem de manutenções.
- Criação e listagem de lembretes.
- Busca, paginação, pull-to-refresh e toasts.
- Suporte a web via Expo web.

## Pré-requisitos

- Node.js 20+
- npm
- Backend da API em execução

Opcional:

- Emulador Android
- Simulador iOS no macOS
- Expo Go em dispositivo físico

## Variáveis de Ambiente

O frontend usa [mobile/.env.example](mobile/.env.example) como referência.

Variável obrigatória:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Observações:

- O frontend adiciona `/api` automaticamente quando necessário.
- No web, o backend precisa liberar a origem do frontend via CORS.

## Dependência do Backend

Este frontend espera que o repositório do backend esteja em execução.

Expectativas importantes do backend:

- Base da API disponível em `/api`
- Endpoints de autenticação habilitados
- Banco configurado
- CORS configurado para acesso web

Se você estiver usando o frontend no navegador, garanta que o backend permita a origem web, por exemplo:

```env
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

## Instalação

Na raiz do frontend:

```bash
cd mobile
npm install
```

Crie o arquivo local de ambiente:

```bash
cp .env.example .env
```

Depois ajuste `EXPO_PUBLIC_API_URL` para o host do seu backend.

## Como Rodar

Inicie o Expo:

```bash
cd mobile
npm run start
```

Comandos por plataforma:

- Web:

```bash
cd mobile
npm run web
```

- Android:

```bash
cd mobile
npm run android
```

- iOS:

```bash
cd mobile
npm run ios
```

Se precisar limpar cache do Expo:

```bash
cd mobile
npx expo start -c
```

## Typecheck

Para validar o TypeScript:

```bash
cd mobile
npx tsc --noEmit
```

## Fluxos Principais

1. Entrar com as credenciais do backend.
2. Abrir a lista de veículos.
3. Criar ou editar um veículo.
4. Abrir o detalhe do veículo.
5. Adicionar abastecimentos, manutenções ou lembretes.
6. Atualizar a quilometragem quando necessário.

## Regras de Quilometragem

- Cadastro e edição de veículo aceitam quilometragem.
- Atualização manual do hodômetro não permite regressão.
- Abastecimentos e manutenções podem ser cadastrados com quilometragem menor do que a atual do veículo.
- Abastecimentos e manutenções só atualizam a quilometragem do veículo quando o valor informado é maior do que o atual.

## Observações para Uso no Web

- A autenticação usa localStorage no web.
- No nativo, usa Expo Secure Store.
- Após alterar `.env`, reinicie o Expo.

## Troubleshooting

- Erro de CORS no web:
  - Verifique `CORS_ALLOWED_ORIGINS` no backend.
  - Reinicie o backend após alterar variáveis de ambiente.

- Erros de autenticação:
  - Confirme se `EXPO_PUBLIC_API_URL` aponta para o backend correto.
  - Confirme se o backend está acessível pelo navegador.

- Mudanças de ambiente não aplicadas:
  - Reinicie o Expo.
  - Se necessário, limpe cache com `npx expo start -c`.

- Erros de tipo:
  - Rode `npx tsc --noEmit` dentro de [mobile](mobile).

## Arquivos Relacionados

- [MVP_Frontend.md](MVP_Frontend.md)
- [mobile/package.json](mobile/package.json)
- [mobile/.env.example](mobile/.env.example)
