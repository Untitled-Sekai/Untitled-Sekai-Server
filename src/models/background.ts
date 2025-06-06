import mongoose from "mongoose"

const background = new mongoose.Schema({
    name: String,
    version: Number,
    title: {
      en: String,
      ja: String
    },
    subtitle: {
      en: String,
      ja: String
    },
    author: {
      en: String,
      ja: String
    },
    tags: [{
      title: {
        en: String,
        ja: String
      },
      icon: String
    }],
    description: {
      en: String,
      ja: String
    },
    thumbnail: {
      hash: String,
      url: String,
    },
    data: {
      hash: String,
      url: String,
    },
    image: {
      hash: String,
      url: String,
    },
    configuration: {
      hash: String,
      url: String,
    },
    createdAt: {
      type: Date,
        default: Date.now
    },
})

export const Background = mongoose.model("Background", background)