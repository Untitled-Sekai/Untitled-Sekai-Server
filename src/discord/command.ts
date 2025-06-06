import { Client, CommandInteraction, Message, EmbedBuilder } from 'discord.js';
import {
    handleTestCommand,
    handleHelpcommand,
    handleStorageCommand,
    handleUserListCommand,
    handleMaintenanceCommand,
    handleModCommand,
    handleEventCommand
} from './functions.js';

export const command = async (client: Client) => {
    client.on('messageCreate', async (message: Message) => {
        if (message.author.bot) return;

        if (message.content === '!test') {
            await handleTestCommand(message);
        } if (message.content === '!help') {
            await handleHelpcommand(message);
        } else if (message.content === '!storage') {
            const isServerOwner = message.guild?.ownerId === message.author.id;

            if (isServerOwner) {
                await handleStorageCommand(message);
            } else {
                await message.reply('このコマンドはサーバーの所有者のみ実行が可能です。');
            }
        } else if (message.content === '!userlist') {
            const isServerOwner = message.guild?.ownerId === message.author.id;

            if (isServerOwner) {
                await handleUserListCommand(message);
            } else {
                await message.reply('このコマンドはサーバーの所有者のみ実行が可能です。');
            }
        } else if (message.content.startsWith('!maintenance')) {
            const isServerOwner = message.guild?.ownerId === message.author.id;

            if (isServerOwner) {
                await handleMaintenanceCommand(message);
            } else {
                await message.reply('このコマンドはサーバーの所有者のみ実行が可能です。');
            }
        } else if (message.content.startsWith('!mod')) {
            await handleModCommand(message);
            return;
        } else if (message.content.startsWith('!addEvent') ||
            message.content.startsWith('!removeEvent') ||
            message.content.startsWith('!listEvents') ||
            message.content.startsWith('!listLevels') ||
            message.content.startsWith('!checkLevel')) {
            await handleEventCommand(message);
            return;
        }

    })
}