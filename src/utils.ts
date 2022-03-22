import {
  Client,
  EmojiResolvable,
  Intents,
  Message,
  TextChannel,
} from 'discord.js';

export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

export const getAvailableContributors = async (emoji: string) => {
  const latestAvailabilityPost = await getLatestAvailabilityPost();
  if (!latestAvailabilityPost) {
    console.error("Couldn't get latest availability post");
    return;
  }
  const reactors = await getReactors(latestAvailabilityPost, emoji);
  if (!reactors) return;
  return reactors;
};

export const getLatestAvailabilityPost = async () => {
  const channel = client.channels.cache.find(
    (channel) => channel.id !== process.env.CONTRIBUTOR_CHANNEL_ID
  ) as TextChannel;
  const messages = await channel.messages.fetch();

  return messages
    .filter((message) => message.author.id === client.user?.id)
    .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
    .first();
};

const getReactors = async (message: Message, emoji: EmojiResolvable) => {
  const reactors = await message.reactions.cache
    .get(emoji.toString())
    ?.users.fetch();
  return reactors?.filter((user) => !user.bot);
};
