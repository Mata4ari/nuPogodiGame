const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
const supabase = createClient(process.env.DB_URL, process.env.DB_TOKEN);

// Middleware для обработки данных Telegram
app.use((req, res, next) => {
  const initData = req.headers['tg-web-app-initdata']; // Telegram сам добавляет этот заголовок
  if (!initData) return next();

  try {
    // Проверяем подлинность данных (важно для безопасности!)
    const botToken = process.env.BOT_TOKEN;
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const calculatedHash = crypto.createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash === hash) {
      req.telegramUser = JSON.parse(params.get('user')); // Сохраняем пользователя в запросе
    }
  } catch (err) {
    console.error('Telegram data error:', err);
  }
  next();
});

// Обработчик главной страницы
app.get('/', async (req, res) => {
  if (req.telegramUser) {
    const { id, username, first_name } = req.telegramUser;

    const { error } = await supabase
      .from('users')
      .upsert(
        {
          id,
          username,
          first_name,
          updated_at: new Date()
        },
        { onConflict: 'id' }
      );

    if (error) console.error('Supabase error:', error);
  }

  res.sendFile(__dirname + '/public/index.html');
});

app.listen(process.env.PORT||3000, () => console.log('Server started'));