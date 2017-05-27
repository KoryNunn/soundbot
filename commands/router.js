const channel = require('./channel');
const help = require('./help');
const sentence = require('./sentence');
const sounds = require('./sounds');

const router = (message) => {
  // Join/leave the user's voice channel
  if (message.content.startsWith('.join')) channel.join(message);
  if (message.content.startsWith('.leave')) channel.leave(message);

  // Generate semi-sensical sentences
  if (message.content.startsWith('.sentence')) sentence.sentence(message);
  if (message.content.startsWith('.ttssentence')) sentence.tts(message);

  // Play a sound
  if (message.content.startsWith('.play')) sounds.play(message);
  if (message.content === '.randomsound') sounds.random(message);

  // Help messages
  if (message.content.startsWith('.list')) help.list(message);
  if (message.content.startsWith('.sounds')) help.sounds(message);
};

module.exports = router;
