// DBに保存する型
import mongoose from "mongoose";
import { UserRole } from "./type.js";

const anonymous_AcountSchema = new mongoose.Schema({
  name: { type: String, required: true},
  id: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
})

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userNumber: { type: Number, required: true, unique: true },
    
    sonolusAuthenticated: { type: Boolean, default: false },
    sonolusProfile: { type: Object },

    role: { type: String, enum: UserRole, default: UserRole.USER },

    anonymousaccount:  [anonymous_AcountSchema],

    profile: {
      iconColor: { type: String, default: '#6366f1' },
      description: { type: String, default: '' }
    },

    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    timeoutUntil: { type: Date, default: null, nullable: true },
    timeoutReason: { type: String, default: null, nullable: true },

    isBanned: { type: Boolean, default: false, nullable: true },
    banReason: { type: String, default: null, nullable: true },
    bannedBy: { type: String, default: null, nullable: true },
    banDate: { type: Date, default: null, nullable: true},

    likedCharts: [{type: String}],
    sonolusAuth: { type: Boolean, default: false },
}, {
    timestamps: true
});
userSchema.index({ 'anonymousaccount.name': 1, 'username': 1 }, { unique: true });
export const UserModel = mongoose.model('User', userSchema);