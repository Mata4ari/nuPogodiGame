const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
const supabase = createClient(process.env.DB_URL, process.env.DB_TOKEN);

// Middleware для обработки данных Telegram
app.use((req, res, next) => {
  console.log('req---')
  const initData = req.headers['tg-web-app-initdata']; // Telegram сам добавляет этот заголовок
  if (!initData) return next();

  try {
    // Проверяем подлинность данных (важно для безопасности!)
    const params = new URLSearchParams(initData);

    
    req.telegramUser = JSON.parse(params.get('user'));
    console.log(req.telegramUser);
    
  } catch (err) {
    console.error('Telegram data error:', err);
  }
  next();
});

// Обработчик главной страницы
app.get('/', async (req, res) => {
  if (req.telegramUser) {
    const { id, username, first_name } = req.telegramUser;

    const result = await supabase
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

    if (result.error) console.log('Supabase error:', result.error);
    console.log(result)
  }

  res.sendFile(__dirname + '/public/index.html');
});

app.listen(process.env.PORT||3000, () => console.log('Server started'));