import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  fullName: String,
  roles: {
    type: [String],
    default: ['user']
  },
  lastLogin: Date,
  authMethod: {
    type: String,
    enum: ['ldap', 'local'],
    default: 'ldap'
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;