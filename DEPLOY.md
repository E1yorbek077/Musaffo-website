# Deploying Musaffo on Ubuntu

The site runs as a Node.js server under PM2, behind Nginx, which handles HTTPS. Commands assume the
project lives in `/var/www/musaffo` and that `www.musaffo.uz` and `musaffo.uz` already point to the server.

## 1. Install what the server needs

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2
node -v    # needs to be 20.9 or newer
```

## 2. Get the code and set the secrets

Copy the project to `/var/www/musaffo`, then:

```bash
cd /var/www/musaffo
cp .env.example .env.local
nano .env.local
chmod 600 .env.local    # only this user can read the bot token
```

`.env.local` goes in the project folder, next to `package.json`. Fill in:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.musaffo.uz` |
| `TELEGRAM_BOT_TOKEN` | The token from @BotFather |
| `TELEGRAM_CHAT_ID` | The manager's chat ID |
| `ORDERS_FILE` | Optional. Where to keep the backup, if not `data/orders.jsonl` |

**Getting the chat ID:** the manager opens the bot in Telegram and presses Start, because a bot can't
message someone who hasn't started it. Then open this address and copy `chat.id` from the result:

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

## 3. Build and start

```bash
npm ci
npm run build
pm2 start npm --name musaffo -- start
pm2 save
pm2 startup    # prints one more command to run, so the site returns after a reboot
```

- Run `npm ci` without `NODE_ENV=production`: the build needs the dev dependencies.
- The build downloads the site's font from Google, so the server needs internet access while building.
- The site now listens on port 3000. Use only one PM2 process: the rate limit is kept in memory, so
  cluster mode would give each process its own count.

## 4. Nginx

Create `/etc/nginx/sites-available/musaffo`:

```nginx
server {
    listen 80;
    server_name www.musaffo.uz musaffo.uz;

    client_max_body_size 64k;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        # The order rate limit relies on these. Nginx overwrites anything the visitor sends.
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/musaffo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 5. HTTPS

```bash
sudo certbot --nginx -d www.musaffo.uz -d musaffo.uz
```

Certbot edits the Nginx config and renews the certificate by itself. Choose its redirect option, so all
visits use HTTPS. Installing the app and offline use only work over HTTPS.

## 6. Firewall

Keep port 3000 closed to the outside. Otherwise visitors could reach Node directly, send a fake
`X-Real-IP` header and get around the rate limit.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 7. Check that orders work

This sends a **real message to the manager**, so warn them first:

```bash
curl -i https://www.musaffo.uz/api/order/ \
  -H 'content-type: application/json' \
  -d '{"customerType":"person","name":"Test","phone":"+998901234567","address":"Test","comment":"Sinov buyurtmasi","locale":"uz","items":[{"slug":"kefir-1","size":450,"boxes":1}]}'
```

Expected: `{"ok":true,"orderNumber":"M-…"}`. The trailing slash in `/api/order/` matters: without it
the server answers with a 308 redirect (`curl -L` follows it).

## Viewing orders

Every order is added to `data/orders.jsonl` as one line of JSON, including orders Telegram didn't deliver.

```bash
sudo apt install -y jq
tail -n 20 data/orders.jsonl | jq .                                # the latest orders
tail -f data/orders.jsonl | jq .                                   # watch them arrive
jq 'select(.telegram == "failed")' data/orders.jsonl               # orders the manager did NOT receive
jq 'select(.orderNumber == "M-261107-4821")' data/orders.jsonl     # one order
```

The file holds customers' names, phone numbers and addresses, so keep it private and include it in your
backups. Decide how long to keep it, and clear out old orders accordingly. It's readable only by the user
running the site, and is excluded from git.

## Updating the site

```bash
cd /var/www/musaffo
# copy or pull the new code, then:
npm ci
npm run build
pm2 restart musaffo
```

Restart after every build. Visitors pick up the new version on their next visit, including anyone who
saved the catalog for offline use.

## When something goes wrong

```bash
pm2 logs musaffo     # order problems are logged with the prefix [order]
pm2 status
```

| Log message | Cause |
|---|---|
| `TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set` | `.env.local` is missing or incomplete. Fix it, then `pm2 restart musaffo`. |
| `Telegram refused the message: 401` | The token is wrong. |
| `Telegram refused the message: 400 ... chat not found` | Wrong chat ID, or the manager hasn't pressed Start. |
| `Telegram refused the message: 403` | The manager blocked the bot. |
| `Could not reach Telegram` | The server can't reach `api.telegram.org`. Orders are still saved. |
