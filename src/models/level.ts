// DBに保存する型 レベルデータ
// Reactからも使う
import mongoose from "mongoose";

export type LangField = {
  en: string;
  ja: string;
};

export type TagType = {
  title: LangField;
  icon: string;
  _id?: string;
};

export type ResourceData = {
  hash: string;
  url: string;
};

export type BackgroundItem = {
  name: string;
  version: number;
  title: LangField;
  subtitle: LangField;
  author: LangField;
  tags: TagType[];
  description: LangField;
  thumbnail: ResourceData;
  data: ResourceData;
  image: ResourceData;
  configuration: ResourceData;
};

export type UseResource = {
  useDefault: boolean;
  item?: BackgroundItem;
};

export type LevelMetadata = {
  isPublic: boolean;
  derivative: {
    isDerivative: boolean;
    id?: {
      name: string;
    };
  };
  fileOpen: boolean;
  originalUrl?: string;
  collaboration: {
    iscollaboration: boolean;
    members?: {
      handle: number;
    }[];
  };
  privateShare: {
    isPrivateShare: boolean;
    users?: {
      handle: number;
    }[];
  };
  anonymous: {
    isAnonymous: boolean;
    anonymous_handle: String;
    original_handle: Number;
  }
};

// メインのレベル型定義
export interface Level {
  name: string;
  rating: number;
  version: number;
  title: LangField;
  artists: LangField;
  author: LangField;
  tags: TagType[];
  engine: string;
  description: LangField;
  useBackground: UseResource;
  useEffect: {
    useDefault: boolean;
  };
  useParticle: {
    useDefault: boolean;
  };
  useSkin: {
    useDefault: boolean;
  };
  cover: ResourceData;
  bgm: ResourceData;
  preview: ResourceData;
  data: ResourceData;
  meta: LevelMetadata;
  createdAt: Date;
}

// クライアント側で使うための簡略化型
export type ChartSummary = {
  _id: string;
  name: string;
  title: string;
  artist: string;
  author: string;
  rating: number;
  uploadDate: string;
  coverUrl: string;
  description: string;
  tags: string[];
  meta: LevelMetadata;
};

// 譜面詳細用の型
export type ChartDetail = {
  name: string;
  title: LangField;
  artist: LangField;
  author: LangField;
  rating: number;
  version: number;
  uploadDate: string;
  coverUrl: string;
  description: LangField;
  tags: TagType[];
  bgmUrl: string;
  dataUrl: string;
  previewUrl: string;
  engine: string;
  difficultyTag?: string;
  meta: LevelMetadata;
};


const levelSchema = new mongoose.Schema({
  name: String,
  rating: Number,
  version: Number,
  title: {
    en: String,
    ja: String
  },
  artists: {
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
  engine: String,
  description: {
    en: String,
    ja: String
  },
  useBackground: {
    useDefault: Boolean,
    item: {
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
      }
    }
  },
  useEffect: {
    useDefault: Boolean
  },
  useParticle: {
    useDefault: Boolean
  },
  useSkin: {
    useDefault: Boolean
  },
  cover: {
    hash: String,
    url: String
  },
  bgm: {
    hash: String,
    url: String
  },
  preview: {
    hash: String,
    url: String
  },
  data: {
    hash: String,
    url: String
  },
  meta: {
    isPublic: Boolean,
    wasPublicBefore: Boolean,
    derivative: {
      isDerivative: Boolean,
      id: {
        name: String,
      }
    },
    fileOpen: Boolean,
    originalUrl: String,
    collaboration: {
      iscollaboration: Boolean,
      members: [{
        handle: Number,
      }]
    },
    privateShare: {
      isPrivateShare: Boolean,
      users: [{
        handle: Number,
      }]
    },
    anonymous: {
      isAnonymous: Boolean,
      anonymous_handle: String,
      original_handle: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const LevelModel = mongoose.model('Level', levelSchema);