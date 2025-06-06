import { sonolus } from "../../index.js";
import { convertChart } from "./convert.js";
import { convertToPng } from "./topng.js";
import { createAudioPreview } from "./preview.js";
import { saveData, saveCoverAsBackground } from "./save.js";
import { levelitemType, LevelData, levelActions } from "./type.js";
import { engineInfo } from "../../../lib/sonolus-pjsekai-engine-extended/index.js";
import { LevelModel } from "../../models/level.js";
import { Background } from "../../models/background.js";
import { MESSAGE } from "../../message.js";
import { isValidSession, getProfile } from "../auth/state.js";
import { UserModel } from "../../models/user.js";

import multer from "multer";
import crypto from "crypto";
import { RequestHandler } from "express";
import { LevelItemModel, BackgroundItemModel } from "@sonolus/express";
import { Icon } from "@sonolus/core";
import { get } from "http";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 35 * 1024 * 1024 }, // 35mb
});
// uploadLevel
export const uploadLevel = () => {
    sonolus.router.post('/api/chart/upload',
        upload.fields([
            { name: 'chart', maxCount: 1 },
            { name: 'cover', maxCount: 1 },
            { name: 'bgm', maxCount: 1 }
        ]),

        ((req, res, next) => {
            (async () => {
                try {
                    // console.log('uploadLevel'); debug
                    const files = req.files as {
                        [fieldname: string]: Express.Multer.File[];
                    };

                    const uploadFiles = {
                        cover: files['cover']?.[0],
                        chart: files['chart']?.[0],
                        bgm: files['bgm']?.[0],
                    };

                    const coverFile = files['cover']?.[0];
                    const chartFile = files['chart']?.[0];
                    const bgmFile = files['bgm']?.[0];

                    const filetype = chartFile?.originalname.endsWith('.sus') ? 'sus' : 'usc';

                    if (!coverFile || !chartFile || !bgmFile) {
                        return res.status(400).json({ error: 'Missing files' });
                    }

                    if (!uploadFiles.chart || !uploadFiles.cover || !uploadFiles.bgm) {
                        return res.status(400).json({ error: 'Missing files' });
                    }

                    const processedLevel = await convertChart(uploadFiles.chart.buffer, filetype);
                    const processedCover = await convertToPng(uploadFiles.cover.buffer);
                    const processedBgm = uploadFiles.bgm.buffer;
                    const processedPreview = await createAudioPreview(processedBgm);

                    const fileExtension = chartFile.originalname.substring(chartFile.originalname.lastIndexOf('.'));
                    const originalchart = await saveData(uploadFiles.chart.buffer, levelitemType.CHART, fileExtension);

                    const coverHash = await saveData(processedCover, levelitemType.COVER);
                    const levelHash = await saveData(processedLevel, levelitemType.LEVEL);
                    const bgmHash = await saveData(processedBgm, levelitemType.BGM);
                    const previewHash = await saveData(processedPreview.buffer, levelitemType.PREVIEW);

                    const backgroundHash = await saveCoverAsBackground(coverHash);

                    const hashes = {
                        level: levelHash,
                        cover: coverHash,
                        bgm: bgmHash,
                        preview: previewHash,
                        background: backgroundHash,
                        originalChart: originalchart,
                    };

                    const isDerivative = req.body.derivative === 'true' || req.body.derivative === true;
                    const isFileOpen = req.body.fileOpen === 'true' || req.body.fileOpen === true;
                    const isCollaboration = req.body.collaboration === 'true' || req.body.collaboration === true;
                    const isPrivateShare = req.body.privateShare === 'true' || req.body.privateShare === true;

                    const levels: LevelData = {
                        name: 'utsk-' + crypto.randomBytes(8).toString('hex'),
                        rating: parseInt(req.body.rating),
                        version: 1,
                        title: {
                            en: req.body.title,
                            ja: req.body.title
                        },
                        artists: {
                            en: req.body.artist,
                            ja: req.body.artist
                        },
                        author: {
                            en: req.body.author,
                            ja: req.body.author
                        },
                        tags: [
                            {
                                title: {
                                    en: req.body.difficultyTag || req.body["difficulty-type"] || "Master",
                                    ja: req.body.difficultyTag || req.body["difficulty-type"] || "Master"
                                }
                            },
                            {
                                title: {
                                    en: "0",
                                    ja: "0"
                                },
                                icon: Icon.Heart
                            }
                        ],
                        engine: engineInfo.name,
                        description: {
                            en: req.body.description,
                            ja: req.body.description
                        },
                        useBackground: {
                            useDefault: false as const,
                            item: {
                                name: 'utsk-background-' + crypto.randomBytes(8).toString('hex'),
                                version: 2 as const,
                                title: {
                                    en: req.body.title,
                                    ja: req.body.title
                                },
                                subtitle: {
                                    en: req.body.title,
                                    ja: req.body.title
                                },
                                author: {
                                    en: req.body.author || 'Unknown',
                                    ja: req.body.author || '不明'
                                },
                                tags: [
                                    {
                                        title: {
                                            en: 'background',
                                            ja: 'background'
                                        },
                                    },
                                ],
                                description: {
                                    en: req.body.description,
                                    ja: req.body.description
                                },
                                thumbnail: {
                                    hash: hashes.cover,
                                    url: '/repository/cover/' + hashes.cover,
                                },
                                data: {
                                    hash: 'c972b0fb8294c036bf95ccd9320218046f084235',
                                    url: '/repository/background/v3_data.json.gz',
                                },
                                image: {
                                    hash: hashes.background,
                                    url: '/repository/background/' + hashes.background,
                                },
                                configuration: {
                                    hash: '1d74186f6969df1e006736f03424994a4c1a731b',
                                    url: '/repository/background/configuration.json.gz',
                                }
                            }
                        },
                        useEffect: {
                            useDefault: true as const
                        },
                        useParticle: {
                            useDefault: true as const
                        },
                        useSkin: {
                            useDefault: true as const
                        },
                        cover: {
                            hash: hashes.cover,
                            url: '/repository/cover/' + hashes.cover,
                        },
                        bgm: {
                            hash: hashes.bgm,
                            url: '/repository/bgm/' + hashes.bgm,
                        },
                        preview: {
                            hash: hashes.preview,
                            url: '/repository/preview/' + hashes.preview,
                        },
                        data: {
                            hash: hashes.level,
                            url: '/repository/level/' + hashes.level,
                        },
                        meta: {
                            isPublic: req.body.isPublic === 'true' || req.body.isPublic === true,
                            wasPublicBefore: false,
                            derivative: {
                                isDerivative,
                                ...(isDerivative ? {
                                    id: {
                                        name: req.body.derivativeId || 'utsk-' + crypto.randomBytes(8).toString('hex'),
                                    }
                                } : {})
                            },
                            fileOpen: isFileOpen,
                            ...(isFileOpen ? {
                                originalUrl: '/repository/chart/' + hashes.originalChart
                            } : {}),
                            collaboration: {
                                iscollaboration: isCollaboration,
                                ...(isCollaboration && req.body.collaborationHandles ? {
                                    members: JSON.parse(req.body.collaborationHandles).map((handle: string) => ({
                                        handle: Number(handle)
                                    }))
                                } : {})
                            },
                            privateShare: {
                                isPrivateShare: isPrivateShare,
                                ...(isPrivateShare && req.body.privateShareHandles ? {
                                    users: JSON.parse(req.body.privateShareHandles).map((handle: string) => ({
                                        handle: Number(handle)
                                    }))
                                } : {})
                            },
                            anonymous: {
                                isAnonymous: req.body.anonymous === 'true' || req.body.anonymous === true,
                                anonymous_handle: req.body.anonymousHandle || '',
                                original_handle: Number(req.body.originalHandle) || 0
                            }
                        }
                    }

                    const newLevel = new LevelModel(levels);
                    await newLevel.save();

                    sonolus.level.actions = levelActions;
                    sonolus.background.items.unshift(levels.useBackground.item as BackgroundItemModel);

                    const newbackground = new Background(levels.useBackground.item as BackgroundItemModel);
                    await newbackground.save();

                    if (levels.meta.isPublic) {
                        const { addToNewCharts } = await import("../../api/new.js");
                        await addToNewCharts(levels.name);
                    }

                    sonolus.level.items.unshift(levels);
                    return res.status(200).json({
                        message: MESSAGE.SUCCESS.UPLOADSUCCESS,
                        name: levels.name,
                    })
                } catch (e) {
                    console.error(e);
                    res.status(500).json(MESSAGE.ERROR.SERVERERROR);
                }
            })()
        })
    )
}
// editLevel
export const editLevel = () => {
    sonolus.router.patch('/api/chart/edit/:id',
        upload.fields([
            { name: 'chart', maxCount: 1 },
            { name: 'cover', maxCount: 1 },
            { name: 'bgm', maxCount: 1 }
        ]),

        ((req, res, next) => {
            (async () => {
                try {
                    const { id } = req.params;
                    const files = req.files as {
                        [fieldname: string]: Express.Multer.File[];
                    };

                    const existingLevel = await LevelModel.findOne({ name: id });
                    if (!existingLevel) {
                        return res.status(404).json({ error: '指定された譜面が見つかりません' });
                    }

                    const updateData: Partial<LevelItemModel> = {};

                    const meta = existingLevel.meta || {};

                    const updatedMeta = {
                        isPublic: meta.isPublic || false,
                        wasPublicBefore: meta.wasPublicBefore || false,
                        derivative: {
                            isDerivative: meta.derivative?.isDerivative || false,
                            ...(meta.derivative?.id && meta.derivative.id.name ? {
                                id: { name: meta.derivative.id.name }
                            } : {})
                        },
                        fileOpen: meta.fileOpen || false,
                        ...(meta.originalUrl ? { originalUrl: meta.originalUrl } : {}),
                        collaboration: {
                            iscollaboration: meta.collaboration?.iscollaboration || false,
                            ...(meta.collaboration?.members ? {
                                members: Array.isArray(meta.collaboration.members) ?
                                    meta.collaboration.members.map(member => ({
                                        handle: Number(member.handle)
                                    })) : []
                            } : {})
                        },
                        privateShare: {
                            isPrivateShare: meta.privateShare?.isPrivateShare || false,
                            ...(meta.privateShare?.users ? {
                                users: Array.isArray(meta.privateShare.users) ?
                                    meta.privateShare.users.map(user => ({
                                        handle: Number(user.handle)
                                    })) : []
                            } : {})
                        },
                        anonymous: {
                            isAnonymous: meta.anonymous?.isAnonymous || false,
                            anonymous_handle: typeof meta.anonymous?.anonymous_handle === 'string' 
                                ? meta.anonymous.anonymous_handle 
                                : '',
                            original_handle: Number(meta.anonymous?.original_handle) || 0
                        }
                    };


                    if (req.body.title) {
                        updateData.title = {
                            en: req.body.title,
                            ja: req.body.title
                        };
                    }

                    if (req.body.artist) {
                        updateData.artists = {
                            en: req.body.artist,
                            ja: req.body.artist
                        };
                    }

                    if (req.body.author) {
                        updateData.author = {
                            en: req.body.author,
                            ja: req.body.author
                        };
                    }

                    if (req.body.description) {
                        updateData.description = {
                            en: req.body.description,
                            ja: req.body.description
                        };
                    }

                    if (req.body.rating) {
                        updateData.rating = parseInt(req.body.rating);
                    }


                    if (req.body.isPublic !== undefined) {
                        const newIsPublic = req.body.isPublic === 'true' || req.body.isPublic === true;

                        if (newIsPublic !== updatedMeta.isPublic) {
                            if (newIsPublic && !updatedMeta.wasPublicBefore) {
                                const { addToNewCharts } = await import("../../api/new.js");
                                if (id) {
                                    await addToNewCharts(id);
                                }

                                updatedMeta.wasPublicBefore = true;
                            }
                        }

                        updatedMeta.isPublic = newIsPublic;
                    }

                    if (req.body.fileOpen !== undefined) {
                        updatedMeta.fileOpen = req.body.fileOpen === 'true' || req.body.fileOpen === true;
                    }
                    if (req.body.fileOpen !== undefined) {
                        updatedMeta.fileOpen = req.body.fileOpen === 'true' || req.body.fileOpen === true;

                        if (!updatedMeta.fileOpen) {
                            delete updatedMeta.originalUrl;
                        }
                    }

                    updateData.meta = updatedMeta;

                    if (files['chart']?.[0]) {
                        const chartFile = files['chart'][0];
                        const filetype = chartFile.originalname.endsWith('.sus') ? 'sus' : 'usc';
                        const levelData = await convertChart(chartFile.buffer, filetype);
                        const levelHash = await saveData(levelData, levelitemType.LEVEL);

                        updateData.data = {
                            hash: levelHash,
                            url: '/repository/level/' + levelHash
                        };

                        if (updatedMeta.fileOpen) {
                            const fileExtension = chartFile.originalname.substring(chartFile.originalname.lastIndexOf('.'));
                            const originalChartHash = await saveData(chartFile.buffer, levelitemType.CHART, fileExtension);
                            updatedMeta.originalUrl = '/repository/chart/' + originalChartHash;
                        }
                    }

                    if (files['cover']?.[0]) {
                        const coverData = await convertToPng(files['cover'][0].buffer);
                        const coverHash = await saveData(coverData, levelitemType.COVER);

                        updateData.cover = {
                            hash: coverHash,
                            url: '/repository/cover/' + coverHash
                        };

                        const backgroundHash = await saveCoverAsBackground(coverHash);

                        if (existingLevel.useBackground && !existingLevel.useBackground.useDefault && existingLevel.useBackground.item) {
                            const bgItem = existingLevel.useBackground.item;

                            updateData.useBackground = {
                                useDefault: false as const,
                                item: {
                                    ...bgItem,
                                    name: bgItem.name,
                                    version: bgItem.version,
                                    title: bgItem.title,
                                    subtitle: bgItem.subtitle,
                                    author: bgItem.author,
                                    tags: Array.isArray(bgItem.tags) ? bgItem.tags : (bgItem.tags ? Array.from(bgItem.tags) : []),
                                    description: bgItem.description,
                                    thumbnail: {
                                        hash: coverHash,
                                        url: '/repository/cover/' + coverHash
                                    },
                                    data: bgItem.data,
                                    image: {
                                        hash: backgroundHash,
                                        url: '/repository/background/' + backgroundHash
                                    },
                                    configuration: bgItem.configuration
                                } as unknown as BackgroundItemModel
                            };

                            const bgIndex = sonolus.background.items.findIndex(bg =>
                                typeof bg !== 'string' && bg.name === bgItem.name
                            );

                            if (bgIndex !== -1) {
                                sonolus.background.items[bgIndex] = {
                                    ...sonolus.background.items[bgIndex],
                                    image: {
                                        hash: backgroundHash,
                                        url: '/repository/background/' + backgroundHash
                                    },
                                    thumbnail: {
                                        hash: coverHash,
                                        url: '/repository/cover/' + coverHash
                                    }
                                } as BackgroundItemModel;
                            }

                            await Background.updateOne(
                                { name: bgItem.name },
                                {
                                    $set: {
                                        image: {
                                            hash: backgroundHash,
                                            url: '/repository/background/' + backgroundHash
                                        },
                                        thumbnail: {
                                            hash: coverHash,
                                            url: '/repository/cover/' + coverHash
                                        }
                                    }
                                }
                            );
                        }
                    }

                    if (files['bgm']?.[0]) {
                        const bgmFile = files['bgm'][0].buffer;
                        const bgmHash = await saveData(bgmFile, levelitemType.BGM);

                        updateData.bgm = {
                            hash: bgmHash,
                            url: '/repository/bgm/' + bgmHash
                        };

                        const previewData = await createAudioPreview(bgmFile);
                        const previewHash = await saveData(previewData.buffer, levelitemType.PREVIEW);

                        updateData.preview = {
                            hash: previewHash,
                            url: '/repository/preview/' + previewHash
                        };
                    }

                    // DBを更新
                    await LevelModel.updateOne({ name: id }, { $set: updateData });

                    // メモリ上のデータも更新する
                    const levelIndex = sonolus.level.items.findIndex(level => level.name === id);
                    if (levelIndex !== -1) {
                        sonolus.level.items[levelIndex] = {
                            ...sonolus.level.items[levelIndex],
                            ...updateData
                        } as LevelItemModel;
                    }
                    res.json({ message: '譜面の更新が完了しました', name: id });
                } catch (e) {
                    console.error(e);
                    res.status(500).json(MESSAGE.ERROR.SERVERERROR);
                }
            })()
        })
    )
}
// deleteLevel
export const deleteLevel = () => {
    sonolus.router.delete('/api/chart/delete/:id', (async (req, res) => {
        try {
            const { id } = req.params;

            // DBから譜面を探す
            const existingLevel = await LevelModel.findOne({ name: id });
            if (!existingLevel) {
                return res.status(404).json({ error: '指定された譜面が見つかりません' });
            }

            // DBから削除
            await LevelModel.deleteOne({ name: id });

            // メモリ上のデータも削除
            const levelIndex = sonolus.level.items.findIndex(level => level.name === id);
            if (levelIndex !== -1) {
                sonolus.level.items.splice(levelIndex, 1);
            }

            res.json({ message: '譜面の削除が完了しました', name: id });
        } catch (e) {
            console.error('削除エラー:', e);
            res.status(500).json(MESSAGE.ERROR.SERVERERROR);
        }
    }) as RequestHandler);
}
