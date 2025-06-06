import { Client, GatewayIntentBits, Events } from 'discord.js';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { command } from './command.js';

dotenv.config();
const botToken = process.env.DISCORD_BOT_TOKEN;

console.log(botToken)

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

client.once(Events.ClientReady, (c) => {
    console.log(chalk.green(`Launched Discord bot as ${c.user.tag}`));
})

command(client);

export const startBot = () => {
    client.login(botToken).catch(error => {
        console.error('botのログインに失敗', error);
    });
};