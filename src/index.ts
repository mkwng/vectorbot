import { Collection, TextChannel, User } from 'discord.js';
import {
  client,
  getAvailableContributors,
  getLatestAvailabilityPost,
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
    emoji: '💻',
  },
];

client.on('ready', () => {
  console.log('ready!');
});

client.on('message', async (msg) => {
  if (msg.channel.id !== process.env.CONTRIBUTOR_CHANNEL_ID) return;

  const thread = await msg.startThread({
    name: 'Call for contributors',
    reason: 'Discussing the call for contributors',
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
          ? users.map((user) => '@' + user.username).join(' ')
          : 'No one yet!'
      }`
    );
  }, "Hey gang, looks like there's a call for contributors. Tagging everyone who&apos;s indicated they're available for the requested skillsets.");

  thread.send(text);
});

// TODO: Create endpoint for cron job to hit this monthly
const monthlyPost = async () => {
  const contributorChannel = client.channels.cache.find(
    (channel) => channel.id === process.env.CONTRIBUTOR_CHANNEL_ID
  ) as TextChannel;
  const text = roles.reduce(
    (acc, role) => {
      return acc + `\n${role.emoji} ${role.name}`;
    },
    `Hey @everyone, looking for contributors for the month of March, please 
	react to this message if you are available for any of these areas. If you 
	react as available, you will get tagged in all new projects that could use 
	someone of your skillset. \n\n
	Please only react only if you are confident about 
	your availability (15-30 hours split over 4-6 weeks), as we want to help 
	project leads accurate understand who wants to contribute. \n`
  );
  const msg = await contributorChannel.send(text);

  roles.forEach((role) => {
    msg.react(role.emoji);
  });
};

client.login(process.env.DISCORD_BOT_TOKEN).then(() => {
  if (!getLatestAvailabilityPost()) {
    monthlyPost();
  }
});
