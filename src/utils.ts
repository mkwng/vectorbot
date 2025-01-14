
import {
  Client,
  EmojiResolvable,
  Message,
  TextChannel,
  GatewayIntentBits,
} from 'discord.js';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

export const msgIsMonthlyPost = (message: Message) =>
  message.author.id === client.user?.id &&
  message.content.includes('Hey @everyone, looking for contributors');

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
  try {
    const channel = (await client.channels.fetch(
      process.env.CONTRIBUTOR_CHANNEL_ID || ''
    )) as TextChannel | undefined;
    if (!channel) return;
    let lastID: string | undefined;

    while (true) {
      const fetchedMessages = await channel.messages.fetch({
        limit: 100,
        ...(lastID && { before: lastID }),
      });

      if (fetchedMessages.size === 0) {
        return;
      }
      const matchedMessage = fetchedMessages.find(msgIsMonthlyPost);
      if (matchedMessage) {
        return matchedMessage;
      }

      lastID = fetchedMessages.lastKey();
    }
  } catch (error) {
    console.error(error);
    return;
  }
};

const getReactors = async (message: Message, emoji: EmojiResolvable) => {
  const reactors = await message.reactions.cache
    .get(emoji.toString())
    ?.users.fetch();
  return reactors?.filter((user) => !user.bot);
};
