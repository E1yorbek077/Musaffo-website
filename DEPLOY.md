# Deploying the Musaffo Khorezm site on Netlify

This is the website of the **Musaffo Khorezm branch**. It is not musaffo.uz, the main brand's separate site.

Netlify builds the site with its Next.js runtime, which it detects by itself: the pages are generated during the
build, and `/api/order` (which sends each order to the manager on Telegram) runs as a serverless function.
`netlify.toml` sets the build command and Node.js version.

## 1. Create the site

1. In Netlify: **Add new site → Import an existing project → GitHub**, and pick this repository.
2. Leave the build settings as they are: `netlify.toml` provides them (`npm run build`, Node.js 22).
3. Before the first deploy, add the environment variables below.

## 2. Environment variables

**Site configuration → Environment variables → Add a variable.** Set each one for **all deploy contexts**, then
trigger a new deploy: the values are read during the build and by the order function.

| Variable | Kind | Value |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | **SECRET** | The bot's token from @BotFather. Tick "Contains secret values". |
| `TELEGRAM_CHAT_ID` | **SECRET** | The manager's Telegram chat ID. Tick "Contains secret values". |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | The site's own address once it has a custom domain, e.g. `https://musaffo-xorazm.uz` (no trailing slash). Optional: without it, the address Netlify gives the site (`URL`) is used. |

Netlify sets `URL` by itself; don't add it. The two Telegram values are only read on the server (never prefixed
with `NEXT_PUBLIC_`), so they don't reach visitors' browsers.

**Getting the chat ID:** the manager opens the bot in Telegram and presses Start, because a bot can't message
someone who hasn't started it. Then open this address and copy `chat.id` from the result:

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

## 3. Custom domain

**Domain management → Add a domain**, then follow Netlify's DNS instructions. HTTPS is issued automatically;
installing the app and using it offline need HTTPS. After the domain works, set `NEXT_PUBLIC_SITE_URL` to it (or
rely on `URL`, which then becomes the custom domain) and redeploy, so canonical links, the sitemap and share
previews use it.

## 4. Check that orders work

This sends a **real message to the manager**, so warn them first:

```bash
curl -i https://<your-site>/api/order/ \
  -H 'content-type: application/json' \
  -d '{"customerType":"person","name":"Test","phone":"+998901234567","address":"Test","comment":"Sinov buyurtmasi","locale":"uz","items":[{"slug":"kefir-1","size":450,"boxes":1}]}'
```

Expected: `{"ok":true,"orderNumber":"M-…"}`. The trailing slash in `/api/order/` matters: without it the server
answers with a 308 redirect (`curl -L` follows it).

## Where orders go

Only to the manager on Telegram. Nothing is written to disk: Netlify's filesystem isn't kept between requests. If
Telegram can't be reached, the customer sees an error with the order number and the phone number to call, and the
order is not kept anywhere else.

## Updating the site

Push to the repository's `main` branch; Netlify builds and publishes it. Visitors pick up the new version on their
next visit, including anyone who saved the catalog for offline use.

## When something goes wrong

**Logs → Functions** in Netlify shows the order function's log. Order problems start with `[order]`.

| Log message | Cause |
|---|---|
| `TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set` | A variable is missing. Add it, then redeploy. |
| `Telegram refused sendMessage: 401` | The token is wrong. |
| `Telegram refused sendMessage: 400 ... chat not found` | Wrong chat ID, or the manager hasn't pressed Start. |
| `Telegram refused sendMessage: 403` | The manager blocked the bot. |
| `Could not reach Telegram` | Telegram didn't answer in time. The customer was asked to call. |

A build that stops with "Site address unknown" means neither `NEXT_PUBLIC_SITE_URL` nor Netlify's `URL` was set,
which only happens when building outside Netlify: set `NEXT_PUBLIC_SITE_URL` for that build.
