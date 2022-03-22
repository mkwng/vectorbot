import {
  Client,
  EmojiResolvable,
  Intents,
  Message,
  TextChannel,
} from 'discord.js';

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

const ContributorType = {
  Brand: '🎨',
  Strategy: '📓',
  Product_design: '📱',
  Frontend_eng: '💻',
} as const;

type ContributorTypeKeys = keyof typeof ContributorType;
type ContributorTypeEmojis = typeof ContributorType[ContributorTypeKeys];

client.on('ready', () => {
  console.log('ready!');
});

client.on('message', async (msg) => {
  if (msg.channel.id !== process.env.CONTRIBUTOR_CHANNEL_ID) return;

  const thread = await msg.startThread({
    name: 'Call for contributors',
    reason: 'Discussing the call for contributors',
  });

  for (const emoji in ContributorType) {
    if (!msg.content.includes(emoji)) return;
    msg.react(emoji);
    const availableContributors = await getAvailableContributors(
      emoji as ContributorTypeEmojis
    );
    if (availableContributors) {
      thread.send(
        `The following members mentioned they are available for ${Object.keys(
          ContributorType
        )
          .find((key) => key === emoji)
          ?.replace('_', ' ')
          .toLocaleLowerCase()} this month: ${availableContributors
          .map((user) => '@' + user.toString())
          .join(', ')}`
      );
    }
  }
});

// TODO: Create endpoint for cron job to hit this monthly
const monthlyPost = async () => {
  const contributorChannel = client.channels.cache.find(
    (channel) => channel.id === process.env.CONTRIBUTOR_CHANNEL_ID
  ) as TextChannel;
  const msg = await contributorChannel.send(
    "Who's interested in contributing to the project this month?"
  );

  for (const emoji in ContributorType) {
    msg.react(emoji);
  }
};

const getAvailableContributors = async (emoji: ContributorTypeEmojis) => {
  const latestAvailabilityPost = await getLatestAvailabilityPost();
  if (!latestAvailabilityPost) {
    console.error("Couldn't get latest availability post");
    return;
  }
  const reactors = await getReactors(latestAvailabilityPost, emoji);
  if (!reactors) return;
  return reactors;
};

const getLatestAvailabilityPost = async () => {
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

client.login(process.env.DISCORD_BOT_TOKEN);
