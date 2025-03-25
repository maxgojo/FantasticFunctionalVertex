const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const client = require('../../index');

const API_URL = 'https://api.rnilaweera.lk/api/image/generate';
const API_KEY = `Bearer ${client.config.imagegenapi}`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagine')
        .setDescription('Generates an image based on your prompt.')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The description of the image you want to create.')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('model')
                .setDescription('Select the image generation model.')
                .setRequired(true)
                .addChoices(
                    { name: 'Rsn Labs', value: 'rsnlabs' },
                    { name: 'Flux', value: 'flux' },
                    { name: 'Anime', value: 'anime' },
                    { name: 'Disney', value: 'disney' },
                    { name: 'Cartoon', value: 'cartoon' },
                    { name: 'Photography', value: 'photography' },
                    { name: 'Icon', value: 'icon' }
                )
        ),

    async execute(interaction, client) {
        await interaction.deferReply(); 

        const prompt = interaction.options.getString('prompt');
        const selectedModel = interaction.options.getString('model');

        try {
            const response = await axios.post(API_URL, {
                prompt: prompt,
                model: selectedModel
            }, {
                headers: {
                    Authorization: API_KEY
                }
            });

            const imageUrl = response.data.image_url;

            if (imageUrl) {
                const embed = new EmbedBuilder()
                    .setImage(imageUrl);
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({ content: 'Image generation failed. Please try again or check your API credentials.' });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'An error occurred during image generation. Please try again later.' });
        }
    }
};

