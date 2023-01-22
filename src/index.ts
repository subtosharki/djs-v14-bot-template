import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
} from 'discord.js';
import 'dotenv/config.js';
import { fileURLToPath } from 'node:url';

const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as Client & {
    commands: Collection<string, any>;
};

client.commands = new Collection<string, any>();

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((file) =>
    file.endsWith('.js')
);

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    let command = await import(filePath);
    command = command.default;
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
try {
    console.log(
        `Started refreshing ${client.commands.size} application (/) commands.`
    );
    await rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENTID,
            process.env.GUILDID
        ),
        { body: client.commands.map((command) => command.data.toJSON()) }
    );

    console.log(
        `Successfully reloaded ${client.commands.size} application (/) commands.`
    );
} catch (error) {
    console.error(error);
}

const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter((file) =>
    file.endsWith('.js')
);

for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    let event = await import(filePath);
    event = event.default;
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

await client.login(process.env.TOKEN);
