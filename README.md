# QWIK Admin (MVP)

Локальный MVP-референс админки QWIK с моковыми данными, IIKO/MAX логикой, аналитикой и сохранением состояния в `localStorage`.

## Что внутри

- Login c mock-авторизацией `admin / admin`
- Реестр вызовов с деталями и таймлайном статусов
- Столы и закрепления waiter/hookah
- Режимы системы: `Конфигурация` / `Работа`
- Новые кнопки и ButtonBinding whitelist
- CRUD для сотрудников, услуг и столов
- Журналы `unknown_button`, `invalid_signal`, ошибок
- IIKO mock integration screen
- DataLens-style аналитика с графиками

## Запуск

```bash
npm i
npm run dev
```

После запуска откроется Vite dev server, обычно:

```text
http://localhost:5173
```

## Как посмотреть MVP

1. Войти под `admin / admin`
2. Открыть `Реестр вызовов`, `Столы и закрепления`, `Привязки`, `IIKO интеграция`, `Аналитика`
3. Проверить рабочие и технические статусы на моковых данных
4. Для сценария закрытия чека открыть `IIKO интеграция` и нажать `Симулировать закрытие чека`

## Сборка

```bash
npm run build
```

Проект проверен локальной production-сборкой.

## GitHub Pages

В репозитории настроен workflow для автодеплоя в GitHub Pages:

- push в `main` запускает `.github/workflows/deploy-pages.yml`
- production build публикуется как project page репозитория
- ожидаемый адрес после включения Pages:

```text
https://greed-is-good.github.io/QWIK-waiter-call/
```

Что нужно сделать один раз в GitHub:

1. Открыть `Settings -> Pages`
2. В `Source` выбрать `GitHub Actions`
3. Дождаться успешного выполнения workflow `Deploy GitHub Pages`

Важно:

- на GitHub Pages приложение использует hash-routing, поэтому внутренние адреса будут вида `#/calls`
- это сделано специально, чтобы навигация не ломалась на статическом хостинге GitHub Pages
