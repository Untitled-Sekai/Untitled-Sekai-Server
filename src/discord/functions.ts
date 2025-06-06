import { client } from './launch.js'
import { StorageData } from './type.js'
import { UserModel } from '../models/user.js'
import { getMaintenanceState, saveMaintenanceState } from './maintenance.js'
import { EventModel } from '../models/event.js'
import { LevelModel } from '../models/level.js'
import { checkLevelExists, listAllLevels } from './debugLevel.js';

import { Message, EmbedBuilder, TextChannel, PermissionFlagsBits } from 'discord.js'
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import dotenv from 'dotenv'

dotenv.config();

const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAINTENANCE_HTML_PATH = path.join(__dirname, '../../static/maintenance.html');
const MAINTENANCE_STATE_PATH = path.join(__dirname, '../../data/maintenance-state.json');


export const handleHelpcommand = async (message: Message) => {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('ヘルプ')
        .setDescription('以下のコマンドが使用できます。')
        .addFields(
            { name: '!test', value: 'テストメッセージを送信します。' },
            { name: '!help', value: 'このヘルプメッセージを表示します。' },
            { name: '!storage', value: 'ストレージの使用状況を表示します（管理者専用）' },
            { name: '!userlist', value: '登録ユーザーの一覧を表示します（管理者専用）' },
            { name: '!maintenance on/off/status/eta', value: 'メンテナンスモードの操作を行います（管理者専用）' },
            { name: '!mod add/remove ユーザー名', value: 'ユーザーにモデレーター権限を付与/削除します（管理者専用）' },
        )
        .setTimestamp()
        .setFooter({ text: 'Sonolus Bot', iconURL: client.user?.displayAvatarURL() });

    await message.reply({ embeds: [embed] });
}

export const handleTestCommand = async (message: Message) => {
    await message.reply('テストメッセージ')
}

export const handleStorageCommand = async (message: Message) => {
    // ストレージ情報を取得するAPIを呼び出す
    // コマンドの形式: !storage
    try {
        const response = await fetch(`http://localhost:${port}/api/storage`);

        if (!response.ok) {
            throw new Error(`APIエラー: ${response.status}`);
        }

        const data = await response.json() as StorageData;

        // 見やすい単位に変換
        const formatSize = (bytes: number): string => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        };

        // 使用率計算
        const usagePercent = ((data.usedSpace / data.totalSpace) * 100).toFixed(2);

        const fileTypesInfo = Object.entries(data.fileTypes)
            .map(([type, info]: [string, any]) =>
                `**${type}**: ${info.count}個のファイル (${formatSize(info.size)})`
            )
            .join('\n');

        // 大きいファイルのリスト作成
        const largeFilesInfo = data.largestFiles
            .map((file: any, index: number) =>
                `${index + 1}. **${file.name}** - ${formatSize(file.size)} (${file.type})`
            )
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('ストレージ使用状況')
            .setColor(0x00FFFF)
            .setDescription(`全体の使用状況: ${formatSize(data.usedSpace)} / ${formatSize(data.totalSpace)} (${usagePercent}% 使用中)`)
            .addFields(
                { name: '📊 ファイル総数', value: `${data.fileCount}個のファイルがあります` },
                { name: '📁 ファイルタイプ別', value: fileTypesInfo || 'データが存在しません' },
                { name: '🏆 サイズが大きいファイルTOP5', value: largeFilesInfo || '大きいファイルはありません' }
            )
            .setFooter({ text: 'ストレージ情報は定期的に更新されます。' })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (e) {
        console.error('ストレージ情報取得エラー:', e);
        await message.reply('ストレージ情報の取得に失敗しました。APIが正しく動作しているか確認してください。\nもしくは、管理者に連絡してください。');
    }
}

export const handleUserListCommand = async (message: Message) => {
    // コマンドの形式: !userlist
    // ユーザーリストを取得するAPIを呼び出す
    try {
        const users = await UserModel.find().limit(25);

        if (!users || users.length === 0) {
            await message.reply('ユーザーが見つかりませんでした。');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('登録ユーザー一覧')
            .setColor(0x00FFFF)
            .setDescription(`全${users.length}人のユーザーが登録されています。`)
            .setTimestamp();

        users.forEach((user, index) => {
            embed.addFields({
                name: `${index + 1}. ${user.username}`,
                value: `ID: ${user._id}
                \n登録日: ${new Date(user.createdAt).toLocaleDateString()}
                \n権限: ${user.role === 'admin' ? '管理者' : '一般ユーザー'}`
            })
        })

    } catch (e) {
        console.error('ユーザーリスト取得エラー:', e);
        await message.reply('エラーが発生しました。ユーザー一覧を取得できませんでした。');
    }
}

export const handleMaintenanceCommand = async (message: Message) => {
    // コマンドの形式: !maintenance on/off/status/eta
    // メンテナンスモードの操作を行う
    const args = message.content.split(' ');
    const subCommand = args[1]?.toLowerCase();

    try {
        if (subCommand === 'on') {
            let estimatedRecovery = undefined;
            if (args.length >= 4) {
                const dateString = args[2];
                const timeString = args[3];
                estimatedRecovery = `${dateString} ${timeString}`;
            }

            await saveMaintenanceState({
                enabled: true,
                lastUpdated: new Date().toISOString(),
                updatedBy: message.author.username,
                estimatedRecovery
            })

            const embed = new EmbedBuilder()
                .setTitle('🔴 メンテナンスモード: ON')
                .setColor(0xFF0000)
                .setDescription('メンテナンスモードをONにしました。メンテナンス中はサービスが利用できません。')
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } else if (subCommand === 'off') {
            await saveMaintenanceState({
                enabled: false,
                lastUpdated: new Date().toISOString(),
                updatedBy: message.author.username
            });

            const embed = new EmbedBuilder()
                .setTitle('🟢 メンテナンスモード: OFF')
                .setColor(0x00FF00)
                .setDescription('メンテナンスモード解除しました。サービスが再開されました。')
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } else if (subCommand === 'status') {
            const htmlContent = await fs.readFile(MAINTENANCE_HTML_PATH, 'utf-8');
            const state = await getMaintenanceState();

            const embed = new EmbedBuilder()
                .setTitle('メンテナンス画面プレビュー')
                .setColor(0xFF6347)
                .setDescription(`現在のメンテナンスモード: ${state.enabled ? 'ON 🔴' : 'OFF 🟢'}`)
                .addFields(
                    { name: '使い方', value: '`!maintenance on` - メンテナンスモードをONにする\n`!maintenance off` - メンテナンスモードをOFFにする\n`!maintenance status` - 現在の状態を確認する' }
                )
                .setFooter({ text: 'static/maintenance.htmlファイルを自由に編集してもらって構いません。' })
                .setTimestamp();

            const snippet = htmlContent.substring(0, 200) + '...';

            await message.reply({
                content: `\`\`\`html\n${snippet}\n\`\`\``,
                embeds: [embed]
            });
        } else if (subCommand === 'eta') {
            // メンテナンスの推定回復時間のみを更新
            if (args.length < 4) {
                await message.reply('使用方法: `!maintenance eta 2025-05-23 15:00`')
                return;
            }

            const dateString = args[2];
            const timeString = args[3];
            const estimatedRecovery = `${dateString} ${timeString}`;

            const state = await getMaintenanceState();
            await saveMaintenanceState({
                ...state,
                estimatedRecovery,
                lastUpdated: new Date().toISOString(),
                updatedBy: message.author.username
            })

            const embed = new EmbedBuilder()
                .setTitle('復旧予定時間の更新')
                .setColor(0xFF6347)
                .setDescription(`メンテナンスの推定回復時間を更新しました。\n\n**推定回復時間:** ${estimatedRecovery}`)
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }
    } catch (e) {
        console.error('メンテナンスコマンドエラー:', e);
        await message.reply('エラーが発生しました。メンテナンスコマンドを実行できませんでした。');
    }
}

export const handleModCommand = async (message: Message) => {
    // コマンドの形式: !mod add/remove ユーザー名
    // モデレーター権限を付与/削除する
    // 管理者権限を持つユーザーのみ実行可能
    const adminRole = message.guild?.roles.cache.find(role => role.name === 'Admin');
    if (!adminRole || !message.member?.roles.cache.has(adminRole.id)) {
        await message.reply('このコマンドを実行する権限がありません。');
        return;
    }
    const args = message.content.split(' ');

    if (args.length < 3) {
        await message.reply('使い方：\n`!mod add ユーザー名` - モデレーター権限を付与\n`!mod remove ユーザー名` - モデレーター権限を削除');
        return;
    }

    const action = args[1]?.toLowerCase();
    const username = args[2];

    try {
        if (action !== 'add' && action !== 'remove') {
            await message.reply('addかremoveで指定してください。\n例：`!mod add ユーザー名`');
            return;
        }

        const user = await UserModel.findOne({ username });
        if (!user) {
            await message.reply(`"${username}"というユーザーは見つかりませんでした。`);
            return;
        }

        if (action === 'add') {
            if (user.role === 'moderator') {
                await message.reply(`${username}はすでにモデレータです。`);
                return;
            }

            if (user.role === 'admin') {
                await message.reply(`${username}は管理者です。モデレーター権限を付与できません。`);
                return;
            }

            user.role = 'moderator';
            await user.save();

            const embed = new EmbedBuilder()
                .setTitle('モデレーター権限付与')
                .setColor(0x9B59B6)
                .setDescription(`${username}にモデレーター権限を付与しました。`)
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } else if (action === 'remove') {
            if (user.role !== 'moderator') {
                await message.reply(`${username}はモデレーターではありません。`);
                return;
            }

            user.role = 'user';
            await user.save();

            const embed = new EmbedBuilder()
                .setTitle('モデレーター権限削除')
                .setColor(0xE74C3C)
                .setDescription(`${username}のモデレーター権限を削除しました。`)
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }
    } catch (e) {
        console.error('モデレーターコマンドエラー:', e);
        await message.reply('エラーが発生しました。モデレーターコマンドを実行できませんでした。');
    }
}

export const handleEventCommand = async (message: Message) => {
    const args = message.content.split(' ');

    // !listLevels の処理を追加
    if (args[0]?.toLowerCase() === '!listlevels') {
        try {
            await message.reply('譜面リストを取得中');
            const levels = await listAllLevels();
            
            if (levels.length === 0) {
                await message.reply('譜面がみつかりません。');
                return;
            }
            
            // 20件ずつに分割して送信（Discordメッセージ制限対策）
            const chunks = [];
            for (let i = 0; i < levels.length; i += 10) {
                const chunk = levels.slice(i, i + 10)
                    .map((level, index) => {
                        const title = level.title?.ja || level.title?.en || 'タイトルなし';
                        return `${i + index + 1}. **${level.name}** - ${title}`;
                    })
                    .join('\n');
                chunks.push(chunk);
            }
            
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
            
            await message.reply('イベント登録は下記から選んでください。');
            return;
        } catch (error) {
            console.error('譜面リスト取得エラー:', error);
            await message.reply('エラー');
            return;
        }
    }

    // !checkLevel 処理を追加
    if (args[0]?.toLowerCase() === '!checklevel' && args[1]) {
        try {
            const levelName = args[1];
            const exists = await checkLevelExists(levelName);
            
            if (exists) {
                await message.reply(`✅ 譜面「${levelName}」が見つかりました。`);
            } else {
                await message.reply(`❌ 譜面「${levelName}」は見つかりませんでした。`);
            }
            return;
        } catch (error) {
            console.error('譜面チェックエラー:', error);
            await message.reply('エラー');
            return;
        }
    }

    if (args.length < 4 && args[0]?.toLowerCase() === '!addevent') {
        await message.reply('使い方：\n`!addEvent 譜面のname 開始日(YYYYMMDD) 終了日(YYYYMMDD)`\n\n最初に `!listLevels` で譜面一覧チェックしてみ！');
        return;
    }

    // 以下は既存のコード
    try {
        const member = message.member;
        
        // !listLevels - 譜面一覧表示
        if (args[0]?.toLowerCase() === '!listlevels') {
            try {
                await message.reply('譜面リストを取得中');
                const levels = await listAllLevels();
                
                if (levels.length === 0) {
                    await message.reply('譜面がありません。');
                    return;
                }
                
                // 10件ずつに分割して送信
                const chunks = [];
                for (let i = 0; i < levels.length; i += 10) {
                    const chunk = levels.slice(i, i + 10)
                        .map((level, index) => {
                            const title = level.title?.ja || level.title?.en || 'タイトルなし';
                            return `${i + index + 1}. **${level.name}** - ${title}`;
                        })
                        .join('\n');
                    chunks.push(chunk);
                }
                
                for (const chunk of chunks) {
                    await message.reply(chunk);
                }
                
                await message.reply('ここからイベント登録してください。');
                return;
            } catch (error) {
                console.error('譜面リスト取得エラー:', error);
                await message.reply('エラー');
                return;
            }
        }

        // !checkLevel - 譜面の存在確認
        if (args[0]?.toLowerCase() === '!checklevel' && args[1]) {
            try {
                const levelName = args[1];
                const exists = await checkLevelExists(levelName);
                
                if (exists) {
                    await message.reply(`✅ 譜面「${levelName}」が見つかりました。`);
                } else {
                    await message.reply(`❌ 譜面「${levelName}」は見つかりませんでした。`);
                }
                return;
            } catch (error) {
                console.error('譜面チェックエラー:', error);
                await message.reply('エラー');
                return;
            }
        }

        // !addEvent のヘルプ表示
        if (args[0]?.toLowerCase() === '!addevent' && args.length < 4) {
            await message.reply('使い方：\n`!addEvent 譜面のname 開始日(YYYYMMDD) 終了日(YYYYMMDD)`\n\n最初に `!listLevels` で譜面一覧チェックしてみ！');
            return;
        }

        // ここから先は管理者権限が必要なコマンド
        if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
            await message.reply('管理者権限ありません。');
            return;
        }

        // !addEvent - イベント追加
        if (args[0]?.toLowerCase() === '!addevent') {
            const levelName = args[1];
            const exists = await checkLevelExists(levelName as string);
            
            if (!exists) {
                await message.reply(`${levelName}という譜面は見つかりませんでした。`);
                return;
            }
            
            const startDateStr = args[2] || '';
            const endDateStr = args[3] || '';
            
            // 日付フォーマットチェック
            if (!/^\d{8}$/.test(startDateStr) || !/^\d{8}$/.test(endDateStr)) {
                await message.reply('YYYYMMDD形式でお願いします。例: 20250524');
                return;
            }

            // 日付に変換
            const startDate = new Date(
                parseInt(startDateStr.substring(0, 4)),
                parseInt(startDateStr.substring(4, 6)) - 1,
                parseInt(startDateStr.substring(6, 8))
            );

            const endDate = new Date(
                parseInt(endDateStr.substring(0, 4)),
                parseInt(endDateStr.substring(4, 6)) - 1,
                parseInt(endDateStr.substring(6, 8))
            );

            if (endDate < startDate) {
                await message.reply('終了日は開始日より後にしてください。');
                return;
            }

            // 既存のイベントがあるか確認
            const existingEvent = await EventModel.findOne({ levelName });
            if (existingEvent) {
                // 更新
                existingEvent.startDate = startDate;
                existingEvent.endDate = endDate;
                existingEvent.createdBy = message.author.username;
                await existingEvent.save();

                await message.reply(`イベントを更新しました。\n譜面: ${levelName}\n期間: ${startDate.toLocaleDateString('ja-JP')} ～ ${endDate.toLocaleDateString('ja-JP')}`);
            } else {
                // 新規作成
                const newEvent = new EventModel({
                    levelName,
                    startDate,
                    endDate,
                    createdBy: message.author.username
                });

                await newEvent.save();

                await message.reply(`イベント追加しました。\n譜面: ${levelName}\n期間: ${startDate.toLocaleDateString('ja-JP')} ～ ${endDate.toLocaleDateString('ja-JP')}`);
            }
            return;
        }
        
        // !removeEvent - イベント削除
        if (args[0]?.toLowerCase() === '!removeevent') {
            const levelName = args[1];
            if (!levelName) {
                await message.reply('譜面名を指定してください。例: `!removeEvent 譜面名`');
                return;
            }

            const result = await EventModel.deleteOne({ levelName });

            if (result.deletedCount > 0) {
                await message.reply(`"${levelName}"のイベント削除しました。`);
            } else {
                await message.reply(`"${levelName}"のイベントは見つかりませんでした。`);
            }
            return;
        }
        
        // !listEvents - イベント一覧
        if (args[0]?.toLowerCase() === '!listevents') {
            const events = await EventModel.find().sort({ startDate: 1 });

            if (events.length === 0) {
                await message.reply('イベントがありません。');
                return;
            }

            const eventList = events.map(event => {
                return `・${event.levelName}: ${event.startDate.toLocaleDateString('ja-JP')} ～ ${event.endDate.toLocaleDateString('ja-JP')}`;
            }).join('\n');

            await message.reply(`【現在のイベント一覧】\n${eventList}`);
            return;
        }
    } catch (e) {
        console.error('イベントコマンドエラー:', e);
        await message.reply(`エラー\n\`\`\`${e}\`\`\``);
    }
}