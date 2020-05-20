const Discord = require('discord.js');
const client = new Discord.Client();
const token = 'NO';

client.on('ready', () => {
    console.log("One more time!")
})

client.login(token)