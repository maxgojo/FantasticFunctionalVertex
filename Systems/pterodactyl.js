const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    PermissionsBitField,
    ButtonStyle,
} = require('discord.js');
const Schema = require('../Schemas/ptero');

module.exports = (client) => {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isAutocomplete()) return;
        
        const { commandName, options, user } = interaction;
      
        if (commandName === 'pterodactyl') {
            const focusedOption = options.getFocused(true);
            
            if (focusedOption.name === 'server') {
                const credentials = await Schema.findOne({ discordId: user.id });
                if (!credentials) {
                    return interaction.respond([]);
                }
                
                const { panelURL, apiKey } = credentials;
      
                const axiosInstance = require('axios').create({
                    baseURL: panelURL.replace(/\/$/, ""),
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
      
                try {
                    const res = await axiosInstance.get('/api/client');
                    const servers = res.data.data; 
                    const query = focusedOption.value.toLowerCase();
      
                    const filtered = servers
                        .filter(s => 
                            s.attributes.name.toLowerCase().includes(query) || 
                            s.attributes.identifier.toLowerCase().includes(query)
                        )
                        .map(s => ({
                            name: s.attributes.name,
                            value: s.attributes.identifier 
                        }))
                        .slice(0, 25);
                    
                    await interaction.respond(filtered);
                } catch (err) {
                    console.error(err);
                    await interaction.respond([]);
                }
            }
        }
      });
};

