import Discord, { TextChannel } from "discord.js";

const client = new Discord.Client({
	intents: [Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

const contributors = [
	{
		contributor: "Brand",
		reaction: "🎨",
	},
	{
		contributor: "Strategy",
		reaction: "📓",
	},
	{
		contributor: "Product design",
		reaction: "📱",
	},
	{
		contributor: "Frontend eng",
		reaction: "💻",
	},
];

client.on("ready", () => {
	console.log("ready!");
});

client.on("message", async (msg) => {
	if (msg.channel.toString().toLowerCase() !== "call-for-contributors") return;

	// TODO: Add to opportunities

	const thread = await msg.startThread({
		name: "Call for contributors",
		reason: "Discussing the call for contributors",
	});
	contributors.forEach((contributorType) => {
		if (msg.content.includes(contributorType.reaction)) return;

		msg.react(contributorType.reaction);

		thread.send("Hey! I'm mentioning you because you said you were available...");
		// TODO: Mention all available folks in thread
	});
});

client.on("messageReactionAdd", (reaction, user) => {
	if (user.bot) return;

	// TODO: Check if the message is an opportunity
	// // TODO: Check if the reaction is of the right type
	// // TODO: Add user as interested in the opportunity

	// TODO: Or, check if the message is a monthly post
	// // TODO: Add user to list of available contributors
});

// TODO: Create endpoint for cron job to hit this monthly
const monthlyPost = async () => {
	// TODO: Clear list of available contributors

	const contributorChannel = client.channels.cache.find(
		(channel) => channel.toString().toLowerCase() === "call-for-contributors"
	) as TextChannel;
	const msg = await contributorChannel.send("Who's interested in contributing to the project this month?");

	contributors.forEach((contributorType) => {
		msg.react(contributorType.reaction);
	});
};
