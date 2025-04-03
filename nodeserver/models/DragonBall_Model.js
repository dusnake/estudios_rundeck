import mongoose from 'mongoose';

const dragonBallSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  race: {
    type: String
  },
  gender: {
    type: String
  },
  image: {
    type: String
  },
  description: {
    type: String
  },
  originPlanet: {
    type: String
  },
  transformations: [{
    name: String,
    image: String
  }],
  ki: {
    type: String
  }
}, {
  timestamps: true,
  versionKey: false
});

const DragonBall = mongoose.model('DragonBall', dragonBallSchema);

export default DragonBall;