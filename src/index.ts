import { Collection, TextChannel, User } from 'discord.js';
import dotenv from 'dotenv';
import { startServer } from './server';
import {
  client,
  getAvailableContributors,
  getLatestAvailabilityPost,
  msgIsMonthlyPost,
} from './utils';

type RoleType = {
  name: string;
  emoji: string;
};

const roles: RoleType[] = [
  {
    name: 'Brand',
    emoji: '🎨',
  },
  {
    name: 'Strategy',
    emoji: '📓',
  },
  {
    name: 'Product design',
    emoji: '📱',
  },
  {
    name: 'Frontend eng',
    emoji: '🔨',
  },
];

dotenv.config();

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error('No bot token found!');
}

if (!process.env.CONTRIBUTOR_CHANNEL_ID) {
  throw new Error('No channel ID found!');
}

client.on('ready', async () => {
  console.log('ready!');

  if (!(await getLatestAvailabilityPost())) {
    monthlyPost();
  }
});

client.on('messageCreate', async (msg) => {
  if (msg.channel.id !== process.env.CONTRIBUTOR_CHANNEL_ID || '') return;
  if (msg.author.id === client.user?.id) return;

  // Try to parse the client name from the message. Example:
  // `Client: \nACME Corp`
  // should return "ACME Corp"
  const clientName = msg.content.match(/Client: *\n+([^\n]+)/)?.[1];
  const thread = await msg.startThread({
    name: clientName || 'New opportunity',
  });

  const matchedContributors = await roles.reduce<
    Promise<
      {
        role: RoleType;
        users: Collection<string, User>;
      }[]
    >
  >(async (acc, role) => {
    if (msg.content.includes(role.emoji)) {
      const users = await getAvailableContributors(role.emoji);
      if (users) {
        return [
          ...(await acc),
          {
            role,
            users,
          },
        ];
      }
    }
    return acc;
  }, Promise.resolve([]));

  const text = matchedContributors.reduce((acc, { role, users }) => {
    return (
      acc +
      `\n\n${role.emoji} ${role.name}: \n${
        users.size
          ? users.map((user) => user.toString()).join(' ')
          : 'No one yet!'
      }`
    );
  }, `Hey gang, looks like there’s a call for contributors. Tagging everyone who’s indicated they’re available for the requested skillsets.`);

  thread.send(
    text +
      `\n\n As a reminder, the project lead, ${msg.author.toString()} will reach out to contributors on this project to put together a team.`
  );
});

export const monthlyPost = async () => {
  const contributorChannel = (await client.channels.fetch(
    process.env.CONTRIBUTOR_CHANNEL_ID || ''
  )) as TextChannel;
  if (!contributorChannel) {
    console.error("Couldn't get contributor channel");
    return;
  }
  // Unpin previous posts
  const pinnedMessages = await contributorChannel.messages.fetchPinned();
  for (let i = 0; i < pinnedMessages.size; i++) {
    const message = pinnedMessages.at(i);
    if (!message) continue;
    if (msgIsMonthlyPost(message)) {
      if (
        message.content.includes(
          `month of ${new Date().toLocaleString('default', { month: 'long' })}`
        )
      ) {
        console.error('Already posted this month');
        return;
      }
      message.unpin();
    }
  }
  const text = roles.reduce(
    (acc, role) => {
      return acc + `\n${role.emoji} ${role.name}`;
    },
    `Hey @everyone, looking for contributors for the month of ${new Date().toLocaleString(
      'default',
      { month: 'long' }
    )}, please react to this message if you are available for any of these areas. If you react as available, you will get tagged in all new projects that could use someone of your skillset. \n 
Please only react only if you are confident about your availability (15-30 hours split over 4-6 weeks), as we want to help project leads accurate understand who wants to contribute. \n`
  );
  const msg = await contributorChannel.send(text);
  msg.pin();

  roles.forEach((role) => {
    msg.react(role.emoji);
  });
};

client.login(process.env.DISCORD_BOT_TOKEN);
startServer();
