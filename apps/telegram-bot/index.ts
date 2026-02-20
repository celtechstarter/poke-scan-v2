import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('Schick mir ein Foto einer Pokémon-Karte, dann erkenne ich sie.');
});

bot.on('photo', (ctx) => {
  ctx.reply('Bild erhalten 👑');
});

bot.catch((err, ctx) => {
  ctx.reply('Karte nicht erkannt, bitte manuell suchen');
  console.error(err);
});

bot.launch();