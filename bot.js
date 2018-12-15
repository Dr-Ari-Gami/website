const { inspect } = require('util');
const { Client } = require("discord.js");
const { r } = require("./ConstantStore");
const client = module.exports = new Client({disableEveryone: true});
const config = require("./config.json");
client.login(config.token);

const evalUsers = ['233823931830632449', '326055601916608512', '221659063312842752'];

client.once('ready', () => {
    console.log(`[discord] logged in as ${client.user.tag}`);
    client.user.setActivity('over discordboats.club', { type: 'WATCHING' });
});


client.on("message", async (msg) => {
    if (msg.author.bot || msg.author.id === client.user.id) return;
    const prefix = "dbc ";
    
    if (!msg.content.startsWith(prefix)) return;
    
    const args = msg.content.slice(prefix.length).split(/ +/g);
    const cmd = args.shift().toLowerCase();

    switch(cmd) {
        case "ping":
	        const ping = await msg.channel.send(":ping_pong: Ping!");
	        ping.edit(`:clock1030: Pong! ${ping.createdTimestamp - msg.createdTimestamp}ms response\n:sparkling_heart:  ${Math.round(client.ws.ping)}ms API heartbeat`);
        break;

        case "say":
            if (!msg.guild || msg.guild.id !== '482022278758924298') return;
            msg.channel.send(args.join(' '), { disableEveryone: true });
        break;

        case 'eval':
            if (evalUsers.indexOf(msg.author.id) === -1) return;
            
            const input = args.join(' ');
            if (!input) return msg.channel.send('Input is required');
            
            let result = null;
            let error = false;
            
            try {
                result = await eval(input);
            }
            catch(e) {
                result = e.toString();
                error = true;
            }
            
            const inputMessage = `Input:\`\`\`js\n${input}\n\`\`\``;
            const message = `${inputMessage} Output:\`\`\`js\n${error ? result : inspect(result)}\n\`\`\``;
            if (message.length > 2000) return msg.channel.send(`${inputMessage} Output: \`\`\`\nOver 2000 characters\n\`\`\``);
            
            msg.channel.send(message);
            break;

        case 'help':
        case 'commands':
        case 'cmds':
            msg.channel.send({
                embed: {
                    title: 'Help',
                    color: color,
                    footer: {
                        text: `Help | Requested by ${msg.author.username}`,
                        icon_url: client.user.avatarURL
                    },
                    fields: [
                        {
                            name: 'Help',
                            value: `Lists all bot commands\n\n**Usage:**\n\`${prefix}[help|cmds|commands]\``
                        },
                        {
                            name: 'Say',
                            value: `Makes the bot say something\n\n**Usage:**\n\`${prefix} <message>\``
                        },
                        {
                            name: 'Eval',
                            value: `Evaluate some code with the bot\n\n**Usage:**\n\`${prefix} <code>\``
                        },
                        {
                            name: 'Ping',
                            value: 'Responds with the bot ping and response time'
                        }
                    ]
                }
            });
            break;
    }

});

client.on('guildMemberAdd', async member => {
	if (member.guild.id !== config.ids.mainServer) return;
	const bot = await r.table('bots').get(member.id);
	if (!bot || !bot.verified) return;

	member.roles.add(config.ids.botRole).catch(() => {});
});

client.on('guildMemberRemove', async (member) => {
    if (member.guild.id !== config.ids.mainServer) return;
    
    const staffChannel = client.channels.get(config.ids.staffChannel);
    
    if (member.user.bot) {
        const bot = await r.table('bots').get(member.user.id);
        if (!bot) return;
        
        const owner = await client.users.fetch(bot.ownerID);
        
        staffChannel.send(`**${member.user.tag}** (\`${member.user.id}\`) left the main server, but is currently listed. Its owner is **${owner.tag}** (\`${owner.id}\`>)\nDelete it at: <${config.baseURL}/dashboard/bot/${member.user.id}/manage>`);
    }
    else {
        const bots = await r.table('bots').filter({ ownerID: member.user.id });
        if (!bots.length) return;
        
        staffChannel.send(`**${member.user.tag}** (\`${member.user.id}\`) left the main server, but they have **${bots.length}** bot${bots.length === 1 ? '' : 's'} on the list. They are:\n${bots.map(b => ` - ${b.name} (Deletion URL: <${config.baseURL}/dashboard/bot/${b.id}/manage>)`).join('\n')}`);
    }
});
