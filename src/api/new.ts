import { sonolus } from "../index.js";
import { LevelModel } from "../models/level.js";
import { MESSAGE } from "../message.js";
import { NewChartModel } from "../models/newlevel.js";
import { RequestHandler } from "express";
import { apiKeyAuth } from "./middleware/auth.js";
import { notifyWebhooks } from "./webhook.js";

export const getExternalNewCharts = async () => {
  sonolus.router.get("/api/external/charts/new",
    apiKeyAuth,
    async (req, res) => {
      try {
        const { limit = 20, page = 1, since = '' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const query = since
          ? { publishedAt: { $gt: new Date(String(since)) } }
          : {};

        const newCharts = await NewChartModel.find(query)
          .sort({ publishedAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean()
          .exec();

        const totalCount = await NewChartModel.countDocuments(query);

        const chartsData = newCharts.map(chart => {
          return {
            id: chart._id,
            name: chart.name,
            title: {
              ja: chart.title?.ja || null,
              en: chart.title?.en || null
            },
            artist: {
              ja: chart.artist?.ja || null,
              en: chart.artist?.en || null
            },
            author: {
              ja: chart.author?.ja || null,
              en: chart.author?.en || null
            },
            rating: chart.rating || 0,
            publishedAt: chart.publishedAt,
            coverUrl: chart.coverUrl || "",
            playUrl: `https://us.pim4n-net.com/charts/${chart.name}`
          };
        });

        res.json({
          success: true,
          data: chartsData,
          totalCount,
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          timestamp: new Date()
        });
      } catch (e) {
        console.error("Error fetching new charts for external API:", e);
        res.status(500).json({ error: MESSAGE.ERROR.SERVERERROR });
      }
    }
  );
};

export const addToNewCharts = async (levelName: string) => {
  try {
    const level = await LevelModel.findOne({ name: levelName });
    if (!level) return false;

    const existingLevel = await NewChartModel.findOne({ levelName });
    if (existingLevel) return false;

    const newChart = new NewChartModel({
      name: levelName,
      levelName,
      publishedAt: new Date(),
      title: level.title,
      artist: level.artists,
      author: level.author,
      rating: level.rating,
      coverUrl: level.cover?.url
    });

    await newChart.save();

    await notifyWebhooks('new_chart', {
      name: levelName,
      title: level.title,
      artist: level.artists,
      author: level.author,
      rating: level.rating || 0,
      publishedAt: new Date(),
      coverUrl: level.cover?.url || ""
    });

    return true;
  } catch (e) {
    console.error("Error adding to new charts:", e);
    return false;
  }
}

export const getNewCharts = async () => {
  sonolus.router.get("/api/charts/new", async (req, res) => {
    try {
      const { limit = 20, page = 1 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const newCharts = await NewChartModel.find()
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean()
        .exec();

      const totalCount = await NewChartModel.countDocuments();

      const chartsData = newCharts.map(chart => {
        return {
          name: chart.name,
          title: chart.title?.ja || chart.title?.en || "No Title",
          artist: chart.artist?.ja || chart.artist?.en || "Unknown",
          author: chart.author?.ja || chart.author?.en || "Unknown",
          rating: chart.rating || 0,
          publishedAt: chart.publishedAt,
          coverUrl: chart.coverUrl || ""
        };
      });

      res.json({
        success: true,
        data: chartsData,
        totalCount,
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit))
      });
    } catch (e) {
      console.error("Error fetching new charts:", e);
      res.status(500).json({ error: MESSAGE.ERROR.SERVERERROR });
    }
  })
}

export const CheckNewChart = async () => {
  sonolus.router.get("/api/charts/:id/new", (async (req, res) => {
    try {
      const { id } = req.params;
      const newChart = await NewChartModel.findOne({ levelName: id });

      res.json({
        success: true,
        isNew: !!newChart,
        publishedAt: newChart ? newChart.publishedAt : null
      });
    } catch (e) {
      console.error("Error checking new chart:", e);
      res.status(500).json({ error: MESSAGE.ERROR.SERVERERROR });
    }
  }) as RequestHandler);
}

export const initializePublicationTracking = async () => {
  try {
    await LevelModel.updateMany(
      { 'meta.isPublic': true },
      { $set: { 'meta.wasPublicBefore': true } }
    );

    await LevelModel.updateMany(
      { 'meta.isPublic': false, 'meta.wasPublicBefore': { $exists: false } },
      { $set: { 'meta.wasPublicBefore': false } }
    );

    console.log('譜面の公開状態追跡を初期化しました');
  } catch (error) {
    console.error('譜面公開状態の初期化エラー:', error);
  }
};

export const newChartApis = () => {
  getNewCharts();
  CheckNewChart();
};