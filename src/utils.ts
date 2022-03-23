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
  const channel = (await client.channels.fetch(
    process.env.CONTRIBUTOR_CHANNEL_ID || ''
  )) as TextChannel;
  if (!channel) return;
  const messages = await channel.messages.fetch();
  if (!messages) return;

  let thePost = messages
    .filter((message) => message.author.id === client.user?.id)
    .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
    .first();

  // TODO: If the post is further back and it wasn't returned by fetch, we need to look deeper
  // const sorted = messages.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
  // const last = sorted.last();
  // channel.messages.fetch({ before: last.id });

  return thePost;
};

const getReactors = async (message: Message, emoji: EmojiResolvable) => {
  const reactors = await message.reactions.cache
    .get(emoji.toString())
    ?.users.fetch();
  return reactors?.filter((user) => !user.bot);
};
