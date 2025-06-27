import { sonolus } from "../index.js";
import { LevelModel } from "../models/level.js";
import { MESSAGE } from "../message.js";
import { RequestHandler } from "express";
import { UserModel } from "../models/user.js";
import { verifyToken } from "./middleware/isAuth.js"

const convertTagsToStringArray = (tags: any[]): string[] => {
    return tags?.map(tag => tag.title?.ja || tag.title?.en).filter(Boolean) || [];
};

export const getCharts = async () => {
    sonolus.router.get('/api/charts', async (req, res) => {
        try {
            const charts = await LevelModel.find({ 'meta.isPublic': true })
                .sort({ createdAt: -1 })
                .lean()
                .exec();

            const charts_data = charts.map(level => {
                return {
                    name: level.name,
                    title: level.title?.ja || level.title?.en || "No Titile",
                    artist: level.artists?.ja || level.artists?.en || "Unknown",
                    author: level.author?.ja || level.author?.en || "Unknown",
                    rating: level.rating || 0,
                    uploadDate: level.createdAt,
                    coverUrl: level.cover?.url || "Unknown",
                    description: level.description?.ja || level.description?.en || "No description",
                    tags: level.tags,
                    meta: {
                        isPublic: level.meta?.isPublic || false,
                        isderivative: level.meta?.derivative?.isDerivative || false,
                        fileOpen: level.meta?.fileOpen || false,
                        originalUrl: level.meta?.originalUrl || null,
                        collaboration: {
                            iscollaboration: level.meta?.collaboration?.iscollaboration || false,
                            members: level.meta?.collaboration?.members || []
                        }
                    }
                };
            });

            res.json({
                success: true,
                data: charts_data
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({
                message: MESSAGE.ERROR.SERVERERROR
            });
        }
    })
}

export const getChart_detail = async () => {
    sonolus.router.get('/api/charts/:id', (async (req, res) => {
        try {
            const level = await LevelModel.findOne({ name: req.params.id })
            if (!level) {
                return res.status(404).json({
                    message: MESSAGE.ERROR.NOTFOUND
                })
            }
            
            const chart_detail = {
                id: level._id,
                name: level.name,
                title: {
                    ja: level.title?.ja,
                    en: level.title?.en
                },
                artist: {
                    ja: level.artists?.ja,
                    en: level.artists?.en
                },
                author: {
                    ja: level.author?.ja,
                    en: level.author?.en
                },
                rating: level.rating,
                version: level.version,
                uploadDate: level.createdAt,
                coverUrl: level.cover?.url,
                description: {
                    ja: level.description?.ja,
                    en: level.description?.en
                },
                tags: convertTagsToStringArray(level.tags),
                bgmUrl: level.bgm?.url,
                dataUrl: level.data?.url,
                previewUrl: level.preview?.url,
                engine: level.engine,
                meta: {
                    isPublic: level.meta?.isPublic || false,
                    isderivative: level.meta?.derivative?.isDerivative || false,
                    fileOpen: level.meta?.fileOpen || false,
                    originalUrl: level.meta?.originalUrl || null,
                    collaboration: {
                        iscollaboration: level.meta?.collaboration?.iscollaboration || false,
                        members: level.meta?.collaboration?.members || []
                    }
                }
            }

            res.json({
                success: true,
                data: chart_detail
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({
                message: MESSAGE.ERROR.SERVERERROR
            });
        }
    }) as RequestHandler);
}

export const searchCharts = async () => {
    sonolus.router.get('/api/charts/search', async (req, res) => {
        try {
            const {
                query = '',
                category = 'all',
                minRainting = 1,
                maxRatinc = 99,
                page = 1,
                limit = 20
            } = req.query;

            const skip = (Number(page) - 1 * Number(limit));

            const searchQuery: any = {
                'meta.isPublic': true,
                rating: { $gte: Number(minRainting), $lte: Number(maxRatinc) }
            }

            if (query) {
                const searchRegex = new RegExp(String(query), 'i');

                if (category === 'all') {
                    searchQuery['$or'] = [
                        { 'title.en': searchRegex },
                        { 'title.ja': searchRegex },
                        { 'artists.en': searchRegex },
                        { 'artists.ja': searchRegex },
                        { 'author.en': searchRegex },
                        { 'author.ja': searchRegex }
                    ];
                } else if (category === 'title') {
                    searchQuery['$or'] = [
                        { 'title.en': searchRegex },
                        { 'title.ja': searchRegex }
                    ];
                } else if (category === 'artist') {
                    searchQuery['$or'] = [
                        { 'artists.en': searchRegex },
                        { 'artists.ja': searchRegex }
                    ];
                } else if (category === 'author') {
                    searchQuery['$or'] = [
                        { 'author.en': searchRegex },
                        { 'author.ja': searchRegex }
                    ];
                }
            }

            const totalCount = await LevelModel.countDocuments(searchQuery);
            const levels = await LevelModel.find(searchQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            res.json({
                levels,
                totalCount,
                currentPage: Number(page),
                totalPages: Math.ceil(totalCount / Number(limit))
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({
                message: MESSAGE.ERROR.SERVERERROR
            });
        }
    })
}

export const getUserCharts = async () => {
    sonolus.router.get('/api/charts/user/:username', async (req, res) => {
        try {
            const { username } = req.params;
            let isOwner = false;

            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                try {
                    const authUser = await verifyToken(token);
                    if (authUser && authUser.username === username) {
                        isOwner = true;
                    }
                } catch (err) {
                    console.warn('Invalid token:', err);
                }
            }

            const publicFilter = isOwner ? {} : { 'meta.isPublic': true };

            const userWithHandle = await UserModel.findOne({ username }).select('sonolusProfile');
            const userHandle = userWithHandle?.sonolusProfile?.handle;

            let chartsQuery = {};
            if (userHandle) {
                chartsQuery = {
                    $and: [
                        {
                            $or: [
                                { 'author.ja': { $regex: `#${userHandle}($|\\s)`, $options: 'i' } },
                                { 'author.en': { $regex: `#${userHandle}($|\\s)`, $options: 'i' } },
                                { 'author.ja': username },
                                { 'author.en': username }
                            ]
                        },
                        publicFilter
                    ]
                };
            } else {
                chartsQuery = {
                    $and: [
                        {
                            $or: [
                                { 'author.ja': { $regex: `^${username}(#|\\s|$)`, $options: 'i' } },
                                { 'author.en': { $regex: `^${username}(#|\\s|$)`, $options: 'i' } }
                            ]
                        },
                        publicFilter
                    ]
                };
            }

            const charts = await LevelModel.find(chartsQuery).sort({ createdAt: -1 }).lean().exec();

            const collabCharts = await LevelModel.find({
                $and: [
                    {
                        'meta.collaboration.iscollaboration': true,
                        'meta.collaboration.members.handle': { $exists: true }
                    },
                ]
            })
                .lean()
                .exec();

            const anonymousCharts = userHandle ? await LevelModel.find({
                $and: [
                    { 'meta.anonymous.isAnonymous': true },
                    { 'meta.anonymous.original_handle': userHandle },
                    publicFilter
                ]
            }).lean().exec() : [];

            const userCollabCharts = userHandle ? collabCharts.filter(chart =>
                chart.meta?.collaboration?.members?.some(member =>
                    String(member.handle) === String(userHandle)
                )
            ) : [];

            const privateSharedCharts = userHandle ? await LevelModel.find({
                $and: [
                    {
                        'meta.privateShare.isPrivateShare': true,
                        'meta.privateShare.users.handle': userHandle
                    },
                    publicFilter
                ]
            })
                .lean()
                .exec() : [];

            const userPrivateSharedCharts = userHandle ? privateSharedCharts.filter(chart =>
                chart.meta?.privateShare?.users?.some(user =>
                    String(user.handle) === String(userHandle)
                )
            ) : [];

            const allCharts = [...charts];

            userCollabCharts.forEach(collabChart => {
                if (!allCharts.some(c => c.name === collabChart.name)) {
                    allCharts.push(collabChart);
                }
            });

            userPrivateSharedCharts.forEach(privateChart => {
                if (!allCharts.some(c => c.name === privateChart.name)) {
                    allCharts.push(privateChart);
                }
            });

            anonymousCharts.forEach(anonChart => {
                if (!allCharts.some(c => c.name === anonChart.name)) {
                    allCharts.push(anonChart);
                }
            });

            const charts_data = allCharts.map(level => {
                return {
                    name: level.name,
                    title: level.title?.ja || level.title?.en || "No Title",
                    artist: level.artists?.ja || level.artists?.en || "Unknown",
                    author: level.author?.ja || level.author?.en || "Unknown",
                    rating: level.rating || 0,
                    uploadDate: level.createdAt,
                    coverUrl: level.cover?.url || "",
                    description: level.description?.ja || level.description?.en || "",
                    tags: level.tags,
                    meta: {
                        isPublic: level.meta?.isPublic || false,
                        collaboration: {
                            iscollaboration: level.meta?.collaboration?.iscollaboration || false
                        },
                        privateShare: {
                            isPrivateShare: level.meta?.privateShare?.isPrivateShare || false
                        }
                    },
                    isCollab: Boolean(userCollabCharts.find(c => c.name === level.name)),
                    isPrivateShared: Boolean(userPrivateSharedCharts.find(c => c.name === level.name))
                };
            });

            res.json({
                success: true,
                data: charts_data
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({
                message: MESSAGE.ERROR.SERVERERROR
            });
        }
    });
}

export const getlikedCharts = async () => {
    sonolus.router.get('/api/charts/liked/user/:username', (async (req, res) => {
        try {
            const { username } = req.params;

            const user = await UserModel.findOne({ username }).lean().exec();

            if (!user) {
                return res.status(404).json({
                    message: MESSAGE.ERROR.NOTFOUND
                });
            }

            if (!user.likedCharts || user.likedCharts.length === 0) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const charts = await LevelModel.find({
                name: { $in: user.likedCharts }
            }).lean().exec();

            const charts_data = charts.map(level => {
                return {
                    name: level.name,
                    title: level.title?.ja || level.title?.en || "No Title",
                    artist: level.artists?.ja || level.artists?.en || "Unknown",
                    author: level.author?.ja || level.author?.en || "Unknown",
                    rating: level.rating || 0,
                    uploadDate: level.createdAt,
                    coverUrl: level.cover?.url || "",
                    description: level.description?.ja || level.description?.en || "",
                    tags: level.tags,
                    meta: {
                        isPublic: level.meta?.isPublic || false,
                        isderivative: level.meta?.derivative?.isDerivative || false,
                        fileOpen: level.meta?.fileOpen || false,
                        originalUrl: level.meta?.originalUrl || null,
                        collaboration: {
                            iscollaboration: level.meta?.collaboration?.iscollaboration || false,
                            members: level.meta?.collaboration?.members || []
                        }
                    }
                };
            });

            res.json({
                success: true,
                data: charts_data
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({
                message: MESSAGE.ERROR.SERVERERROR
            });
        }
    }) as RequestHandler);
}

export const charts = () => {
    getCharts();
    getChart_detail();
    searchCharts();
    getUserCharts();
    getlikedCharts();
}

