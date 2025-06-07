const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
const supabase = createClient(process.env.DB_URL, process.env.DB_TOKEN);



// Обработчик главной страницы
app.get('/', async (req, res) => {
    const initData = req.query.initData;
    console.log(initData)
  if (initData) {

    const params = new URLSearchParams(initData);
    const userData = params.get('user');
    const { id, username, first_name } = JSON.parse(userData);

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