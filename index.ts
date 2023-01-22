import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import  "dotenv/config.js";
import { fileURLToPath } from 'node:url';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const commandsPath = join(__dirname, 'commands');
const commandFiles = await readdir(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const eventsPath = join(__dirname, 'events');
const eventFiles = await readdir(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(process.env.TOKEN);