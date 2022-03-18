const fs = require('fs'),
    ms = require('ms'),
    { Client, Intents, MessageEmbed } = require('discord.js'),
    utils = require('./utilities.js');

const dotenv = require('dotenv');
dotenv.config();
const { TOKEN } = process.env;

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.username}#${client.user.discriminator}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    await interaction.deferReply();

    if (commandName === 'firstreaction') {
        // -- USER VARIABLES -- //
        const time = 10000; // time for reactions to be collected before timing out (in ms)
        const emojiList = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣']; // emojis to use for reactions

        // -- ARGUMENTS -- //
        const reactionNum = interaction.options.get('reactions').value; // argument: reaction count
        const firstUsers = interaction.options.get('usercount').value; // argument: first X users to show

        // -- VARIABLE CHECKS -- //
        if (reactionNum < 1) return interaction.editReply({ content: 'I need to be able to react with at least one emoji!', ephemeral: true });
        if (firstUsers < 1) return interaction.editReply({ content: 'You must specify at least one user that has to react!', ephemeral: true });
        if (reactionNum > emojiList.length)
            return interaction.editReply({ content: 'Your reaction count is larger than the amount of available emojis!', ephemeral: true });

        // -- APPLICATION CONSTANTS -- //
        const min = 3; // minimum time IN FULL SECONDS
        const max = 7; // maximum time IN FULL SECONDS
        const delay = (Math.random() * (max - min) + min) * 1000; // delay in milliseconds between min and max
        const emoti = utils.getRandom(emojiList, reactionNum); // get random emojis from the list above
        const specialEmoji = utils.getRandom(emoti, 1); // choose single emoji for first reactors to react with
        const coolUsers = [];
        const terribleUsers = [];
        const reactTimes = [];

        // -- EMBEDS -- //
        let embed1 = {
            title: 'Preparing reaction test!',
            description: 'Please wait.',
            color: 'RANDOM',
        };
        let embed2 = {
            title: 'Get ready to react...',
            description: 'If you react before an emoji is chosen, you will be disqualified!',
            color: 'RANDOM',
        };
        // prettier-ignore
        let embed3 = {
            title: 'Reaction test in progress!',
            description: `Click the ${specialEmoji} reaction as fast as you can.\n\nThe **first ${firstUsers == 1 ? `person` : `${firstUsers} people`}** to react will be seen below.\n\nIf you clicked a reaction before this prompt appeared, you're probably disqualified this round.`,
            color: 'RANDOM',
        };
        // prettier-ignore
        let embed4 = {
            title: 'Reaction test complete!',
            description: `Here's **${firstUsers == 1 ? `the first person` : `a list of the ${firstUsers} people`}** who reacted before anyone else${firstUsers != 1 ? ', in the order of how fast they responded' : ''}:`,
            fields: [],
            color: 'RANDOM',
        };

        const filter = (reaction, user) => {
            return reaction.emoji.name === specialEmoji.toString();
        };

        client.on('messageReactionAdd', async (reaction, user) => {
            if (user.bot) return;
            if (forLoopDone == true) return;
            terribleUsers.push(user);
        });

        await interaction.editReply({ embeds: [embed1] }).then(async (msg) => {
            forLoopDone = false;
            for (let r = 0; r < emoti.length; r++) {
                await msg.react(emoti[r]);
            }

            await msg.edit({ embeds: [embed2] });
            setTimeout(async function () {
                await msg.edit({
                    embeds: [embed3],
                });
                baseTime = Date.now();
            }, delay);
            forLoopDone = true;

            const collector = await msg.createReactionCollector({ time: 13000 });
            collector.on('collect', (reaction, user) => {
                if (
                    reaction.emoji.name == specialEmoji.toString() &&
                    !coolUsers.includes(user) &&
                    coolUsers.length < firstUsers &&
                    !terribleUsers.includes(user)
                ) {
                    coolUsers.push(user);
                } else if (reaction.emoji.name != specialEmoji.toString() && !terribleUsers.includes(user) && !coolUsers.includes(user)) {
                    terribleUsers.push(user);
                }
                // if (coolUsers.length >= reactionNum) collector.stop('Enough reactions obtained');
            });

            collector.on('end', (collector, reason) => {
                const fields = coolUsers.map((v, i) => `${i + 1}.) ${v.tag}`);
                for (var i = 0; i != fields.length; ++i)
                    embed4.fields.push({
                        name: fields[i],
                        value: `${coolUsers[i]}`,
                    });
                if (coolUsers.length == 0) {
                    embed4.description = `Nobody reacted ${coolUsers.length == 0 ? 'correctly ' : ''}within the allotted time!`;
                    msg.reactions.removeAll();
                }
                msg.edit({
                    embeds: [embed4],
                });
            });
        });
    } else if (commandName === 'eval') {
        const { code } = interaction.options.get('code').value;
        const { user } = interaction.message.author;

        if (user.id !== '212957230251769858') return;

        const result = eval(code);

        if (result instanceof Promise) {
            result.then((res) => {
                editReply(`Promise resolved with: \`${res}\``);
            });
        } else {
            editReply(`Result: \`${result}\``);
        }
    } else if (commandName === 'thankyou') {
        const tyembed = {
            title: 'From both me and rhearmas to you, SoundDrout...',
            description: '💜 Thank You! 💜',
            color: '0xffaaaa',
        };
        interaction.editReply({ embeds: [tyembed] });
    }
});

let forLoopDone = true;
let baseTime = 0;
client.login(TOKEN);
