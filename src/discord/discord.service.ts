import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CreateDiscordDto } from './dto/create-discord.dto';
import { UpdateDiscordDto } from './dto/update-discord.dto';
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Client;
  private readonly token: string;
  private readonly channelId: string; // channel in discord that I want to send messages to
  private readonly guildId: string; // Optional: server in discord where the bot is a member

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });
    this.token = this.configService.getOrThrow<string>('MY_TEST_BOT_TOKEN');
    this.channelId =
      this.configService.getOrThrow<string>('MY_TEST_CHANNEL_ID');
  }

  async onModuleInit() {
    this.client.once('ready', async () => {
      console.log(`BananaBomber live & lit as ${this.client.user.tag}!`);

      // Register slash commands on bot startup
      await this.registerSlashCommands();
    });

    this.client.on('interactionCreate', async (interaction) => {      
      if (interaction.isButton()) {
        const [action, , channelId] = interaction.customId.split('_');

        if (action === 'bomb') {
          if (interaction.customId.startsWith('bomb_yes')) {
            const channel = this.client.channels.cache.get(channelId) as TextChannel;
            if (channel) {
              await channel.send('BOOM! The channel has been bombed!');
              await interaction.update({ content: `The channel ${channel} has been bombed!`, components: [] });
            } else {
              await interaction.update({ content: 'Channel not found!', components: [] });
            }
          } else if (interaction.customId.startsWith('bomb_no')) {
            await interaction.update({ content: 'The bomb has been cancelled.', components: [] });
          }
        }
        return;
      }

      if (!interaction.isCommand()) return;
      // const command = interaction.commandName;
      await this.handleInteraction(interaction);
    });

    await this.client.login(this.token);
  }

  async onModuleDestroy() {
    try {
      await this.client.destroy();
      console.log('Bomb logged out and blow up gracefully.');
    } catch (error) {
      console.error('Error occurred while logging out Discord bot:', error);
    }
  }

  async registerSlashCommands() {
    const rest = new REST({ version: '9' }).setToken(this.token);

    try {
      console.log('BananaBombers is Loading Land Mines, & then Your Mine!');

      // Replace with your Discord application client ID and guild ID (if applicable)
      const clientId = this.client.user.id;

      const commands = [
        {
          name: 'bitch',
          description: 'Replies with biotch!',
        },
         {
          name: 'bomb',
          description: 'Replies with a BananaBomb to explode in channel of command',
        },
         {
          name: 'block',
          description: 'Replies with a block to any bomb!',
        },
        {
          name: 'detonate',
          description: 'Replies with Pong!',
        },
        {
        name: 'bombchannel',
        description: 'Propose to bomb a specific channel',
        options: [
          {
            name: 'channel',
            type: 'CHANNEL',
            description: 'The channel to propose bombing',
            required: true,
          },
        ],
      },
        // Add more commands as needed
      ];

      if (this.guildId) {
        await rest.put(
          Routes.applicationGuildCommands(clientId, this.guildId),
          { body: commands },
        );
      } else {
        await rest.put(Routes.applicationCommands(clientId), {
          body: commands,
        });
      }

      console.log('Registered BananaBombers (/)commands.');
    } catch (error) {
      console.error('Error in BananaBombers (/)commands:', error);
    }
  }

  async handleInteraction(interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
      case 'bitch':
        await interaction.reply('Biotch!');
        break;
      case 'bomb':
        await interaction.reply('BOOM BANG bitches YOUs all be getting Banana Bombed, bitch');
        break;
      case 'block':
        await interaction.reply('Party Pooper YOUs just an ole Bomb Tom Blocker');
        break;
      case 'detonate':
        const confirm = new ButtonBuilder()
          .setCustomId('confirm')
          .setLabel('Bomb This Channel?')
          .setStyle(ButtonStyle.Success);

        const cancel = new ButtonBuilder()
          .setCustomId('cancel')
          .setLabel('No Wait!')
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...[confirm, cancel],
        );

        const response = await interaction.reply({
          content: 'Decide their Doomed Fate, or geez have some Mercy',
          components: [row],
        });

        const collectorFilter = (i) => i.user.id === interaction.user.id;

        try {
          const confirmation = await response.awaitMessageComponent({
            filter: collectorFilter,
            time: 10_000,
          });

          if (confirmation.customId === 'confirm') {
            // await interaction.guild.members.ban(target);
            await confirmation.update({
              content: `Banana Bomb fuses is LIT; Go Dive behind your Blocks, hurry ya idiot!`,
              components: [],
            });
          } else if (confirmation.customId === 'cancel') {
            await confirmation.update({
              content: `Yous a Pansy, I mean, phew you so nice, and thats aPEELing`,
              components: [],
            });
          }
        } catch (e) {
          await interaction.editReply({
            content: 'Decision was not made, so the Bomb blows on the commander, not make decisions you cant follow thrr on! What Madness!',
            components: [],
          });
        }
        break;
    case 'bombchannel':
      await this.handleBombChannel(interaction);
        break;
    case 'bombchannel':
      await this.handleBombChannel(interaction);
        break;
      default:
        await interaction.reply('Thats not a Move (well, not yet)');
        break;
    }
  }

async handleBombChannel(interaction: Interaction) {
  const channel = interaction.options.getChannel('channel');

  if (!channel || !channel.isTextBased()) {
    await interaction.reply('Please select a valid text channel.');
    return;
  }

  const confirm = new ButtonBuilder()
    .setCustomId(`bomb_yes_${channel.id}`)
    .setLabel('Bomb Yes')
    .setStyle(ButtonStyle.Danger);

  const cancel = new ButtonBuilder()
    .setCustomId(`bomb_no_${channel.id}`)
    .setLabel('Bomb No')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...[confirm, cancel],
  );

  await interaction.reply({
    content: `Do you want to bomb the channel ${channel}?`,
    components: [row],
  });
}

  create(createDiscordDto: CreateDiscordDto) {
    return `This action adds a new discord : ${createDiscordDto}`;
  }

  findAll() {
    return `Returns all available Channels eligible to get bombed, or are they? Fuk around and find out, you wont`;
  }

  findOne(id: number) {
    return `This action returns a possible bombing suspect #${id} discord`;
  }

  update(id: number, updateDiscordDto: UpdateDiscordDto) {
    return `This action updates a #${id} discord ${updateDiscordDto}`;
  }

  remove(id: number) {
    return `Removed a punishment for #${id} discord`;
  }

  sendMessage(content: string) {
    const channel = this.client.channels.cache.get(this.channelId);
    if (channel && channel.isTextBased()) {
      channel.send(content);
    } else {
      console.error('Channel not found or is not text-based.');
    }
  }
}
